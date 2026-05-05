const onReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

const whenReady = () => new Promise((resolve) => onReady(resolve));

// 3D product viewers
(() => {
  const readyEventName = 'iczz-three-ready';

  (async () => {
    await whenReady();

    if (!document.querySelector('.three-model[data-model-src]')) {
      window.dispatchEvent(new Event(readyEventName));
      return;
    }

    const [
      THREE,
      { GLTFLoader },
      { DRACOLoader },
      { OrbitControls },
      { RoomEnvironment }
    ] = await Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ]);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    const mounted = new WeakMap();
    const clock = new THREE.Clock();
    const activeViewers = new Set();

    dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    function readRotationSpeed(value) {
      if (!value) return 0.9;
      const amount = Number.parseFloat(value);
      if (!Number.isFinite(amount)) return 0.9;
      if (value.includes('%')) return Math.max(0.3, amount / 120);
      if (value.includes('deg')) return THREE.MathUtils.degToRad(amount);
      return amount;
    }

    function readCameraPadding(value) {
      const amount = Number.parseFloat(value);
      return Number.isFinite(amount) ? amount : 1.45;
    }

    function fitModel(model, camera, controls, viewer) {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z) || 1;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
      const fitWidth = size.x / (2 * Math.tan(horizontalFov / 2));
      const fitDepth = size.z * 0.8;
      const distance = Math.max(fitHeight, fitWidth, fitDepth, maxSize * 0.35) * readCameraPadding(viewer.dataset.cameraPadding);

      model.position.sub(center);
      camera.near = maxSize / 100;
      camera.far = distance * 20;
      camera.position.set(distance * 0.06, distance * 0.14, distance);
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0);
      controls.update();
    }

    function disposeViewer(viewer) {
      const instance = mounted.get(viewer);
      if (!instance) return;

      activeViewers.delete(instance);
      instance.resizeObserver.disconnect();
      instance.controls.dispose();
      if (instance.model) {
        disposeObject(instance.model);
      }
      instance.environment.dispose();
      instance.renderer.dispose();
      viewer.innerHTML = '';
      mounted.delete(viewer);
    }

    function disposeMaterial(material) {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    }

    function disposeObject(object) {
      object.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(disposeMaterial);
        } else if (child.material) {
          disposeMaterial(child.material);
        }
      });
    }

    function createLights(scene) {
      const hemi = new THREE.HemisphereLight(0xfffbf0, 0x171717, 1.45);
      const key = new THREE.DirectionalLight(0xffffff, 3.1);
      const rim = new THREE.DirectionalLight(0xcfe0ff, 1.6);
      const fill = new THREE.DirectionalLight(0xffead1, 0.95);
      const top = new THREE.DirectionalLight(0xffffff, 1.15);

      key.position.set(-3.5, 5, 4.5);
      rim.position.set(4, 3, -5);
      fill.position.set(3.5, 1.8, 3);
      top.position.set(0, 6, 0.5);
      scene.add(hemi, key, rim, fill, top);
    }

    function mountThreeModel(viewer) {
      const src = viewer?.dataset.modelSrc;
      if (!src) return null;

      disposeViewer(viewer);
      viewer.classList.remove('three-model--error', 'three-model--loaded');
      viewer.classList.add('three-model');
      viewer.textContent = '';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      const controls = new OrbitControls(camera, renderer.domElement);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      const prefersControls = viewer.hasAttribute('data-camera-controls');
      const autoRotate = viewer.hasAttribute('data-auto-rotate');

      scene.environment = env;
      createLights(scene);

      pmrem.dispose();
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.setAttribute('aria-label', viewer.dataset.modelAlt || '3D model');
      renderer.domElement.setAttribute('role', 'img');
      viewer.appendChild(renderer.domElement);

      controls.enablePan = false;
      controls.enableDamping = true;
      controls.enableZoom = !viewer.hasAttribute('data-disable-zoom');
      controls.enabled = prefersControls;

      const instance = {
        viewer,
        scene,
        camera,
        renderer,
        controls,
        environment: env,
        model: null,
        autoRotate,
        rotationSpeed: readRotationSpeed(viewer.dataset.rotationSpeed),
        resizeObserver: new ResizeObserver(resize)
      };

      function resize() {
        const rect = viewer.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      instance.resizeObserver.observe(viewer);
      mounted.set(viewer, instance);
      activeViewers.add(instance);
      resize();

      loader.load(src, (gltf) => {
        instance.model = gltf.scene;
        instance.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((material) => {
              if ('envMapIntensity' in material) {
                material.envMapIntensity = 1.35;
              }
              material.needsUpdate = true;
            });
          }
        });
        scene.add(instance.model);
        fitModel(instance.model, camera, controls, viewer);
        viewer.classList.add('three-model--loaded');
      }, undefined, () => {
        viewer.classList.add('three-model--error');
        viewer.textContent = '3D model unavailable';
      });

      return instance;
    }

    function animate() {
      const delta = clock.getDelta();

      activeViewers.forEach((instance) => {
        if (!document.body.contains(instance.viewer)) {
          disposeViewer(instance.viewer);
          return;
        }

        if (instance.model && instance.autoRotate) {
          instance.model.rotation.y += instance.rotationSpeed * delta;
        }

        instance.controls.update();
        instance.renderer.render(instance.scene, instance.camera);
      });

      requestAnimationFrame(animate);
    }

    function mountAll() {
      document.querySelectorAll('.three-model[data-model-src]').forEach(mountThreeModel);
    }

    window.ICZZThreeModels = {
      mount: mountThreeModel,
      mountAll,
      dispose: disposeViewer
    };

    mountAll();
    window.addEventListener('iczz-three-mount', mountAll);
    window.dispatchEvent(new Event(readyEventName));
    animate();
  })().catch(() => {
    document.querySelectorAll('.three-model[data-model-src]').forEach((viewer) => {
      viewer.classList.add('three-model--error');
      viewer.textContent = '3D model unavailable';
    });
    window.dispatchEvent(new Event(readyEventName));
  });
})();

// Product media fullscreen
onReady(() => {
  const productSection = document.querySelector('.producttest');
  if (!productSection) return;

  const modal = document.createElement('div');
  modal.className = 'product-fullscreen';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="product-fullscreen__content">
      <button class="product-fullscreen__close" type="button" aria-label="Close fullscreen">x</button>
    </div>
  `;

  document.body.appendChild(modal);

  const content = modal.querySelector('.product-fullscreen__content');
  const closeButton = modal.querySelector('.product-fullscreen__close');
  let activeMedia = null;

  function disposeMedia(node) {
    if (node?.classList.contains('three-model')) {
      window.ICZZThreeModels?.dispose(node);
    }
  }

  function closeFullscreen() {
    if (activeMedia) {
      disposeMedia(activeMedia);
      activeMedia.remove();
      activeMedia = null;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fullscreen-open');
  }

  function openFullscreen(node) {
    if (!node) return;

    if (activeMedia) {
      disposeMedia(activeMedia);
      activeMedia.remove();
      activeMedia = null;
    }

    activeMedia = node;
    content.appendChild(activeMedia);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fullscreen-open');

    if (activeMedia.classList.contains('three-model')) {
      const modelNode = activeMedia;
      if (window.ICZZThreeModels) {
        window.ICZZThreeModels.mount(modelNode);
      } else {
        window.addEventListener('iczz-three-ready', () => {
          if (document.body.contains(modelNode)) {
            window.ICZZThreeModels?.mount(modelNode);
          }
        }, { once: true });
      }
    }
  }

  function buildImage(src, alt) {
    const img = document.createElement('img');
    img.className = 'product-fullscreen__image';
    img.src = src;
    img.alt = alt || '';
    return img;
  }

  document.addEventListener('click', (event) => {
    const mainImage = event.target.closest('#mainImage');
    if (mainImage) {
      openFullscreen(buildImage(mainImage.src, mainImage.alt));
    }
  });

  closeButton.addEventListener('click', closeFullscreen);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeFullscreen();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeFullscreen();
    }
  });
});

// Product-specific review carousel
onReady(() => {
  const productSection = document.querySelector('.producttest');
  const addToCartButton = document.getElementById('addToCartBtn');
  if (!productSection || !addToCartButton || document.querySelector('.product-reviews')) return;

  const productName = addToCartButton.dataset.productName;
  const productReviews = {
    'A GREAT CHAOS CHAIN - REPLICA': [
      {
        initials: 'MK',
        name: 'Marek K.',
        title: 'Verified buyer',
        text: 'The Great Chaos Chain is heavy in the right way. The pendant catches light hard and makes even a simple black fit feel finished.',
        rating: 5
      },
      {
        initials: 'LC',
        name: 'Lucie C.',
        title: 'Streetwear collector',
        text: 'I bought the Great Chaos Chain for the shape and it looks even sharper in person. It has that Ken Carson rage energy without feeling cheap.',
        rating: 5
      },
      {
        initials: 'TN',
        name: 'Tomas N.',
        title: 'Repeat customer',
        text: 'The Great Chaos Chain sits nicely on the neck and the metal finish feels solid. This is the piece people ask about first.',
        rating: 4
      }
    ],
    'RICK OWENS SS20 BRUTALIST CHAIN': [
      {
        initials: 'JD',
        name: 'Jan D.',
        title: 'Archive buyer',
        text: 'The Rick Owens Brutalist Chain has exactly the massive SS20 feel I wanted. It is bold, sculptural, and works best over plain layers.',
        rating: 5
      },
      {
        initials: 'AR',
        name: 'Adam R.',
        title: 'Design student',
        text: 'This Brutalist Chain feels more like a wearable object than a normal necklace. The proportions are dramatic but still clean.',
        rating: 5
      },
      {
        initials: 'ES',
        name: 'Eli S.',
        title: 'Stylist',
        text: 'I use the Rick Owens chain for darker outfits because it adds structure immediately. The pendant gives the whole look a runway edge.',
        rating: 4
      }
    ],
    'RICK OWENS DRKSHDW': [
      {
        initials: 'PS',
        name: 'Pavel S.',
        title: 'Sneaker buyer',
        text: 'The DRKSHDW pair has that webbed lace look that makes the shoe instantly recognizable. It feels aggressive but still wearable.',
        rating: 5
      },
      {
        initials: 'NM',
        name: 'Nina M.',
        title: 'Fashion editor',
        text: 'Rick Owens DRKSHDW changes the whole silhouette of an outfit. The high tongue and chunky sole make it feel intentional from every angle.',
        rating: 5
      },
      {
        initials: 'VK',
        name: 'Viktor K.',
        title: 'Daily wearer',
        text: 'I expected the DRKSHDW shoes to be mostly for styling, but they are comfortable enough for long days. The black and cream contrast is perfect.',
        rating: 4
      }
    ],
    'MAISON MARGIELA FUTURE': [
      {
        initials: 'OB',
        name: 'Ondrej B.',
        title: 'High fashion fan',
        text: 'The Maison Margiela Future is clean but futuristic. The padded shape is the reason I wanted them, and it looks even better on foot.',
        rating: 5
      },
      {
        initials: 'KH',
        name: 'Klara H.',
        title: 'Verified buyer',
        text: 'These Margiela Futures make simple trousers and a hoodie look expensive. The all-black finish keeps the silhouette sharp.',
        rating: 5
      },
      {
        initials: 'MS',
        name: 'Matej S.',
        title: 'Collector',
        text: 'The Future model has real presence without loud branding. It is one of those pieces where the shape does all the talking.',
        rating: 4
      }
    ],
    'YZY WET TANK TOP': [
      {
        initials: 'SB',
        name: 'Sara B.',
        title: 'YZY fan',
        text: 'The YZY Wet Tank Top has the raw texture I was hoping for. It looks simple at first, but the fit makes it feel very deliberate.',
        rating: 5
      },
      {
        initials: 'FL',
        name: 'Filip L.',
        title: 'Summer buyer',
        text: 'This tank is light, easy to layer, and still has that Vultures-era edge. The YZY Wet Tank Top works best with wide pants.',
        rating: 4
      },
      {
        initials: 'AM',
        name: 'Anna M.',
        title: 'Styling assistant',
        text: 'I like how the YZY Wet Tank Top does not feel overdesigned. The rough details give it character while keeping it wearable.',
        rating: 5
      }
    ],
    'XO PENDANT - THE WEEKND REPLICA': [
      {
        initials: 'DM',
        name: 'David M.',
        title: 'XO fan',
        text: 'The XO Pendant is exactly the kind of subtle Weeknd reference I wanted. It is recognizable without being too loud.',
        rating: 5
      },
      {
        initials: 'ER',
        name: 'Eva R.',
        title: 'Gift buyer',
        text: 'I bought the XO Pendant as a gift and the detail surprised me. It feels personal for a Weeknd fan but still works as everyday jewelry.',
        rating: 5
      },
      {
        initials: 'RT',
        name: 'Roman T.',
        title: 'Verified buyer',
        text: 'The XO chain has a clean shine and the pendant size is just right. It adds a small statement without taking over the whole outfit.',
        rating: 4
      }
    ]
  };

  const reviews = productReviews[productName];
  if (!reviews) return;

  const section = document.createElement('section');
  section.className = 'product-reviews';
  section.setAttribute('aria-label', `${productName} reviews`);

  const kicker = document.createElement('p');
  kicker.className = 'product-reviews__kicker';
  kicker.textContent = 'PRODUCT REVIEWS';

  const title = document.createElement('h2');
  title.className = 'product-reviews__title';
  title.textContent = productName;

  const shell = document.createElement('div');
  shell.className = 'product-reviews__shell';

  const prevButton = document.createElement('button');
  prevButton.className = 'product-reviews__arrow product-reviews__arrow--prev';
  prevButton.type = 'button';
  prevButton.setAttribute('aria-label', 'Previous review');
  prevButton.textContent = '<';

  const card = document.createElement('article');
  card.className = 'product-reviews__card';

  const nextButton = document.createElement('button');
  nextButton.className = 'product-reviews__arrow product-reviews__arrow--next';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next review');
  nextButton.textContent = '>';

  shell.append(prevButton, card, nextButton);
  section.append(kicker, title, shell);
  productSection.insertAdjacentElement('afterend', section);

  let activeIndex = 0;

  function renderReview() {
    const review = reviews[activeIndex];
    card.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'product-reviews__header';

    const avatar = document.createElement('div');
    avatar.className = 'product-reviews__avatar';
    avatar.textContent = review.initials;

    const meta = document.createElement('div');
    meta.className = 'product-reviews__meta';

    const name = document.createElement('h3');
    name.textContent = review.name;

    const subtitle = document.createElement('p');
    subtitle.textContent = review.title;

    meta.append(name, subtitle);
    header.append(avatar, meta);

    const quote = document.createElement('p');
    quote.className = 'product-reviews__quote';
    quote.textContent = `"${review.text}"`;

    const rating = document.createElement('div');
    rating.className = 'product-reviews__rating';
    rating.setAttribute('aria-label', `${review.rating} out of 5 stars`);

    for (let i = 0; i < 5; i += 1) {
      const star = document.createElement('span');
      star.className = 'product-reviews__star';
      star.textContent = i < review.rating ? String.fromCharCode(9733) : String.fromCharCode(9734);
      rating.appendChild(star);
    }

    card.append(header, quote, rating);
  }

  function moveReview(direction) {
    activeIndex = (activeIndex + direction + reviews.length) % reviews.length;
    card.classList.remove('is-changing');
    requestAnimationFrame(() => {
      card.classList.add('is-changing');
      renderReview();
    });
  }

  prevButton.addEventListener('click', () => moveReview(-1));
  nextButton.addEventListener('click', () => moveReview(1));

  renderReview();
});

// Shared navigation, search, and cart popup helpers
window.toggleMenu = () => document.getElementById('menu')?.classList.toggle('active');
window.scrollToSection = () => document.getElementById('uvod')?.scrollIntoView({ behavior: 'smooth' });
window.toggleText = (card) => card?.classList.toggle('active');
window.closePopup = () => {
  const popup = document.getElementById('successPopup');
  if (popup) popup.classList.remove('show');
};
window.showPopup = () => {
  let popup = document.getElementById('successPopup');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'successPopup';
    popup.className = 'success-popup';
    popup.innerHTML = `
      <div class="success-popup-content">
        <button class="success-popup-close" type="button" aria-label="Close popup" onclick="closePopup()">&times;</button>
        <p>SUCCESSFULLY ADDED TO CART</p>
        <div class="success-popup-actions">
          <button class="success-popup-btn secondary" type="button" onclick="closePopup()">CONTINUE SHOPPING</button>
          <a class="success-popup-btn primary" href="kosik.html">TO CART</a>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
  }

  popup.classList.add('show');
};

onReady(() => {
  const search = document.getElementById('mysearch');
  const input = document.querySelector('.search-input');
  const image = document.getElementById('myImage');
  const addToCartButton = document.getElementById('addToCartBtn');
  const accountTriggers = document.querySelectorAll('.acc[href="#popup"]');
  const accountPopups = document.querySelectorAll('.popup');

  accountPopups.forEach((popup) => {
    document.body.appendChild(popup);

    popup.addEventListener('click', (event) => {
      if (event.target === popup) {
        popup.classList.remove('show-account-popup');
        window.location.hash = '';
      }
    });

    popup.querySelectorAll('.close, .login-close-x').forEach((closeButton) => {
      closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        popup.classList.remove('show-account-popup');
        window.location.hash = '';
      });
    });
  });

  accountTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const popup = document.getElementById('popup');
      if (popup) {
        popup.classList.add('show-account-popup');
      }
    });
  });

  if (addToCartButton) {
    const freshButton = addToCartButton.cloneNode(true);
    addToCartButton.replaceWith(freshButton);

    freshButton.addEventListener('click', function () {
      const name = this.getAttribute('data-product-name');
      const price = this.getAttribute('data-product-price');
      const imageSrc = this.getAttribute('data-product-image');
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find((item) => item.name === name);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          name,
          price,
          image: imageSrc,
          url: window.location.href,
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      showPopup();
    });
  }

  if (search && input) {
    const searchPanel = document.createElement('div');
    searchPanel.className = 'search-panel';

    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.className = 'search-submit';
    searchButton.setAttribute('aria-label', 'Zavrit vyhledavaci panel');
    searchButton.innerHTML = '<span aria-hidden="true">&rarr;</span>';

    document.body.appendChild(searchPanel);
    searchPanel.appendChild(input);
    searchPanel.appendChild(searchButton);

    function updateSearchPosition() {
      const headerEl = document.querySelector('.fixed-section') || document.querySelector('header');
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-bar-height')) || 112;
      searchPanel.style.top = Math.max(Math.round(headerBottom), 0) + 'px';
    }

    function openSearch() {
      updateSearchPosition();
      search.classList.add('move');
      searchPanel.classList.add('open');
      setTimeout(() => input.focus(), 80);
    }

    function closeSearch() {
      search.classList.remove('move');
      searchPanel.classList.remove('open');
    }

    search.addEventListener('click', (event) => {
      event.stopPropagation();
      if (searchPanel.classList.contains('open')) {
        closeSearch();
        return;
      }
      openSearch();
    });

    input.addEventListener('click', (event) => event.stopPropagation());
    searchButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeSearch();
    });

    searchPanel.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', () => {
      closeSearch();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeSearch();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });

    if (window.location.hash === '#search-open') {
      openSearch();
    }

    window.addEventListener('resize', updateSearchPosition);
    updateSearchPosition();
  }

  if (image) {
    image.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  }
});

document.addEventListener('click', (event) => {
  const successPopup = document.getElementById('successPopup');
  if (successPopup && successPopup.classList.contains('show') && event.target === successPopup) {
    closePopup();
  }
});

// Legacy image modal helpers
function openModal(imgElement) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  if (!modal || !modalImg || !imgElement) return;
  modalImg.src = imgElement.src;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

onReady(() => {
  const image = document.getElementById('myImage');

  if (image) {
    image.addEventListener('click', () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });
  }
});

// Homepage promo carousel
onReady(() => {
  const carousel = document.querySelector('.promo-carousel');
  const track = document.getElementById('promoTrack');
  const slides = track ? Array.from(track.children) : [];
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('promoDots');
  const status = document.getElementById('carouselStatus');

  if (!carousel || !track || !slides.length || !prevBtn || !nextBtn) return;

  let index = 0;
  let autoplayId = null;
  let animationTimer = null;
  let isAnimating = false;
  const autoplayInterval = 4000;

  slides.forEach((_, i) => {
    if (!dotsContainer) return;
    const dot = document.createElement('button');
    dot.className = 'promo-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Prejit na slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  function clearSlideState(slide) {
    slide.classList.remove('is-active', 'is-before', 'is-after', 'is-entering');
  }

  function setStaticPositions() {
    slides.forEach((slide, i) => {
      clearSlideState(slide);
      if (i === index) {
        slide.classList.add('is-active');
      } else {
        slide.classList.add(i < index ? 'is-before' : 'is-after');
      }
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
  }

  function updateStatus() {
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    if (status) status.textContent = `Slide ${index + 1} of ${slides.length}`;
  }

  function update(direction = 'next') {
    const oldIndex = index;
    const nextIndex = (index + (direction === 'next' ? 1 : -1) + slides.length) % slides.length;
    if (isAnimating || oldIndex === nextIndex) return;

    const oldSlide = slides[oldIndex];
    const nextSlide = slides[nextIndex];
    const enteringFrom = direction === 'next' ? 'is-after' : 'is-before';
    const leavingTo = direction === 'next' ? 'is-before' : 'is-after';

    isAnimating = true;
    clearTimeout(animationTimer);
    clearSlideState(nextSlide);
    nextSlide.classList.add(enteringFrom, 'is-entering');
    nextSlide.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      oldSlide.classList.remove('is-active');
      oldSlide.classList.add(leavingTo);
      oldSlide.setAttribute('aria-hidden', 'true');
      nextSlide.classList.remove(enteringFrom);
      nextSlide.classList.add('is-active');
      index = nextIndex;
      updateStatus();
    });

    animationTimer = setTimeout(() => {
      setStaticPositions();
      updateStatus();
      isAnimating = false;
    }, 650);
  }

  function goTo(nextIndex) {
    const normalized = (nextIndex + slides.length) % slides.length;
    if (normalized === index || isAnimating) return;
    update(normalized > index || (index === slides.length - 1 && normalized === 0) ? 'next' : 'prev');
    restartAutoplay();
  }

  function next() {
    update('next');
    restartAutoplay();
  }

  function prev() {
    update('prev');
    restartAutoplay();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(next, autoplayInterval);
  }

  function stopAutoplay() {
    if (autoplayId) clearInterval(autoplayId);
    autoplayId = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  let startX = 0;
  let moveX = 0;

  carousel.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    moveX = 0;
    stopAutoplay();
  }, { passive: true });

  carousel.addEventListener('touchmove', (event) => {
    moveX = event.touches[0].clientX - startX;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (Math.abs(moveX) > 40) {
      moveX < 0 ? next() : prev();
    } else {
      startAutoplay();
    }
    moveX = 0;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') prev();
    if (event.key === 'ArrowRight') next();
  });

  setStaticPositions();
  updateStatus();
  startAutoplay();

  window.__promo = { goTo, next, prev };
});
