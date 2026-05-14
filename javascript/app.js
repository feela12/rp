const THREE_VERSION = '0.160.0';
const THREE_CDN_ORIGIN = 'https://esm.sh';
const THREE_MODULE_URL = `${THREE_CDN_ORIGIN}/three@${THREE_VERSION}/es2022/three.mjs`;
const THREE_ADDONS_BASE_URL = `${THREE_CDN_ORIGIN}/three@${THREE_VERSION}/es2022/examples/jsm/`;
const THREE_DRACO_DECODER_URL = `https://unpkg.com/three@${THREE_VERSION}/examples/jsm/libs/draco/`;

const onReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

const whenReady = () => new Promise((resolve) => onReady(resolve));
const APP_CART_MAX_QUANTITY = 80;

onReady(() => {
  document.querySelectorAll('#uvod .image-gallery > .image-card').forEach((item, index) => {
    item.classList.add('scroll-reveal', 'high-demand-reveal');
    item.style.setProperty('--reveal-delay', `${index * 140}ms`);
  });

  const revealItems = document.querySelectorAll('.scroll-reveal');

  if (!revealItems.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');
      if (entry.target.classList.contains('high-demand-reveal')) {
        const delayValue = entry.target.style.getPropertyValue('--reveal-delay');
        const delay = delayValue.endsWith('ms') ? Number.parseFloat(delayValue) : 0;
        window.setTimeout(() => {
          entry.target.style.removeProperty('--reveal-delay');
        }, 900 + (Number.isFinite(delay) ? delay : 0));
      }
      observer.unobserve(entry.target);
    });
  }, {
    threshold:0.12,
    rootMargin:'0px 0px -8% 0px'
  });

  revealItems.forEach((item) => revealObserver.observe(item));
});

function clampCartQuantity(value) {
  const quantity = parseInt(value, 10);
  if (Number.isNaN(quantity)) {
    return 1;
  }

  return Math.min(APP_CART_MAX_QUANTITY, Math.max(1, quantity));
}

// Cart page
onReady(() => {
  const itemsContainer = document.querySelector('.items-container');
  const summaryPrice = document.querySelector('.summary-price');
  if (!itemsContainer || !summaryPrice) return;

  const euro = String.fromCharCode(8364);
  const productCatalog = [
    { name: 'A GREAT CHAOS CHAIN - REPLICA', url: 'product1.html' },
    { name: 'RICK OWENS SS20 BRUTALIST CHAIN', url: 'product2.html' },
    { name: 'RICK OWENS DRKSHDW', url: 'product3.html' },
    { name: 'MAISON MARGIELA FUTURE', url: 'product4.html' },
    { name: 'YZY WET TANK TOP', url: 'product5.html' },
    { name: 'XO PENDANT - THE WEEKND REPLICA', url: 'product6.html' },
    { name: 'GRADUATION - ACTION FIGURE', url: 'product7.html' },
    { name: 'GRADUATION CD', url: 'product8.html' },
    { name: 'BULLY CD', url: 'product9.html' },
    { name: 'MICHAEL JACKSON - THRILLER CD', url: 'product10.html', image: '../images/products/mj1.png' }
  ];
  const productUrlMap = Object.fromEntries(productCatalog.map((product) => [product.name, product.url]));
  const productImageMap = Object.fromEntries(productCatalog.filter((product) => product.image).map((product) => [product.name, product.image]));

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function getProductUrl(product) {
    return product.url || productUrlMap[product.name] || '#';
  }

  function getProductImage(product) {
    return productImageMap[product.name] || product.image || '';
  }

  function updatePrices() {
    let total = 0;

    itemsContainer.querySelectorAll('.item-row').forEach((row) => {
      const price = Number.parseInt(row.querySelector('.item-price').textContent, 10) || 0;
      const input = row.querySelector('.qty-input');
      const quantity = clampCartQuantity(input.value);
      const itemTotal = price * quantity;

      input.value = quantity;
      row.querySelector('.total-price').textContent = `${itemTotal} ${euro}`;
      total += itemTotal;
    });

    summaryPrice.textContent = `${total} ${euro}`;
  }

  function updateCartQuantity(input) {
    const row = input.closest('.item-row');
    if (!row) return;

    const quantity = clampCartQuantity(input.value);
    const productName = row.querySelector('.cart-product-link').textContent;
    const cart = getCart();
    const cartItem = cart.find((item) => item.name === productName);

    input.value = quantity;

    if (cartItem) {
      cartItem.quantity = quantity;
      saveCart(cart);
    }
  }

  function removeItem(button) {
    const row = button.closest('.item-row');
    if (!row) return;

    const productName = row.querySelector('.cart-product-link').textContent;
    const cart = getCart().filter((item) => item.name !== productName);
    saveCart(cart);

    row.style.opacity = '0';
    row.style.transform = 'scale(0.8)';

    window.setTimeout(() => {
      row.remove();
      loadCart();
    }, 300);
  }

  function createCartRow(product) {
    const price = Number(product.price) || 0;
    const quantity = clampCartQuantity(product.quantity);
    const productUrl = getProductUrl(product);
    const productImage = getProductImage(product);
    const row = document.createElement('div');

    product.quantity = quantity;
    product.image = productImage;
    row.className = 'item-row';
    row.innerHTML = `
      <div class="item-image"><img src="${productImage}" alt="Product"></div>
      <section class="itemcart">
        <a class="cart-product-link" href="${productUrl}">${product.name}</a>
        <p class="item-price">${price} ${euro}</p>
      </section>
      <div class="quantity-control">
        <button class="qty-btn" type="button" data-cart-action="decrease">-</button>
        <input type="number" class="qty-input" value="${quantity}" min="1" max="${APP_CART_MAX_QUANTITY}">
        <button class="qty-btn" type="button" data-cart-action="increase">+</button>
      </div>
      <div class="item-total"><p class="total-price">${price * quantity} ${euro}</p></div>
      <button class="bin-button" type="button" data-cart-action="remove"><img src="../images/icons/trash.svg" class="binb" alt="Remove"></button>
    `;

    return row;
  }

  function loadCart() {
    const cart = getCart();
    const emptyMessage = itemsContainer.querySelector('.cart-empty-message');

    itemsContainer.querySelectorAll('.item-row').forEach((row) => row.remove());
    if (emptyMessage) {
      emptyMessage.remove();
    }

    if (!cart.length) {
      itemsContainer.insertAdjacentHTML('beforeend', '<p class="cart-empty-message" style="text-align:center;padding:40px;font-size:20px">YOUR CART IS EMPTY</p>');
      summaryPrice.textContent = `0 ${euro}`;
      return;
    }

    cart.forEach((product) => {
      itemsContainer.appendChild(createCartRow(product));
    });

    saveCart(cart);
    updatePrices();
  }

  itemsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;

    const action = button.dataset.cartAction;

    if (action === 'remove') {
      removeItem(button);
      return;
    }

    const input = action === 'increase'
      ? button.previousElementSibling
      : button.nextElementSibling;

    if (!input || !input.classList.contains('qty-input')) return;

    if (action === 'increase') {
      input.value = clampCartQuantity(clampCartQuantity(input.value) + 1);
      updateCartQuantity(input);
      updatePrices();
      return;
    }

    if (Number.parseInt(input.value, 10) <= 1) {
      removeItem(button.closest('.item-row').querySelector('[data-cart-action="remove"]'));
      return;
    }

    input.value = clampCartQuantity(Number.parseInt(input.value, 10) - 1);
    updateCartQuantity(input);
    updatePrices();
  });

  itemsContainer.addEventListener('input', (event) => {
    if (!event.target.classList.contains('qty-input')) return;
    updateCartQuantity(event.target);
    updatePrices();
  });

  itemsContainer.addEventListener('change', (event) => {
    if (!event.target.classList.contains('qty-input')) return;
    updateCartQuantity(event.target);
    updatePrices();
  });

  loadCart();
});

// 3D product viewers
(() => {
  const readyEventName = 'iczz-three-ready';
  const modelViewerSelector = '.three-model[data-model-src]';

  function browserHasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(
        window.WebGLRenderingContext
        && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (error) {
      return false;
    }
  }

  function isLowPowerDevice() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = Number(navigator.deviceMemory) || 0;
    const cores = Number(navigator.hardwareConcurrency) || 0;
    const wantsLessMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return Boolean(
      wantsLessMotion
      || (connection && connection.saveData)
      || (memory && memory <= 4)
      || (cores && cores <= 4)
    );
  }

  function shouldUseLowQuality(viewer) {
    if (viewer.hasAttribute('data-high-quality')) return false;
    return true;
  }

  function getModelSource(viewer, lowQuality) {
    if (!viewer) return '';
    return lowQuality && viewer.dataset.modelLowSrc
      ? viewer.dataset.modelLowSrc
      : viewer.dataset.modelSrc;
  }

  function showModelFallback(viewer, message = '3D model unavailable') {
    if (!viewer) return;

    viewer.classList.remove('three-model--loaded');
    viewer.classList.add('three-model--error');
    viewer.innerHTML = '';

    if (viewer.dataset.fallbackSrc) {
      const image = document.createElement('img');
      image.className = 'three-model__fallback-image';
      image.src = viewer.dataset.fallbackSrc;
      image.alt = viewer.dataset.modelAlt || '';
      viewer.appendChild(image);
      return;
    }

    viewer.textContent = message;
  }

  function showModelPreview(viewer) {
    if (!viewer) return;
    if (viewer.querySelector('canvas, .three-model__loading-text')) return;

    const loadingText = document.createElement('span');
    loadingText.className = 'three-model__loading-text';
    loadingText.textContent = 'loading 3D model...';
    viewer.appendChild(loadingText);
  }

  const hintedResources = new Set();

  function addResourceHint(rel, href, asType = '', priority = '') {
    const key = `${rel}:${href}:${asType}:${priority}`;
    if (!href || hintedResources.has(key)) return;

    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (asType) link.as = asType;
    if (rel === 'preconnect' || rel === 'preload' || rel === 'modulepreload') {
      link.crossOrigin = 'anonymous';
    }
    if (priority && 'fetchPriority' in link) {
      link.fetchPriority = priority;
    }

    hintedResources.add(key);
    document.head.appendChild(link);
  }

  function hintModelConnection(viewer, shouldPreload = false) {
    if (!viewer) return;

    try {
      const src = getModelSource(viewer, shouldUseLowQuality(viewer));
      const url = new URL(src, window.location.href);

      addResourceHint('preconnect', url.origin);
      if (shouldPreload) {
        addResourceHint('preload', url.href, 'fetch', 'high');
      }
    } catch (error) {
      // Ignore malformed asset URLs and let the regular loader handle the fallback.
    }
  }

  function collectModelSources(viewers) {
    const sources = new Set();

    viewers.forEach((viewer) => {
      [viewer.dataset.modelSrc, viewer.dataset.modelLowSrc].filter(Boolean).forEach((src) => {
        try {
          sources.add(new URL(src, window.location.href).href);
        } catch (error) {
          // Ignore malformed model URLs.
        }
      });
    });

    return Array.from(sources);
  }

  function registerModelCache(viewers) {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;

    const urls = collectModelSources(viewers);
    if (!urls.length) return;

    const register = () => {
      navigator.serviceWorker.register('../sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          const worker = registration.active || navigator.serviceWorker.controller;
          if (worker) {
            worker.postMessage({
              type: 'ICZZ_WARM_MODELS',
              urls
            });
          }
        })
        .catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(register, { timeout: 2500 });
    } else {
      window.addEventListener('load', () => window.setTimeout(register, 1200), { once: true });
    }
  }

  let runtime = null;
  let runtimePromise = null;
  let lazyObserver = null;
  const pendingViewers = new WeakSet();
  const loadingViewers = new WeakSet();
  const interactionViewers = new WeakSet();

  function loadThreeRuntime() {
    if (runtime) return Promise.resolve(runtime);
    if (runtimePromise) return runtimePromise;

    addResourceHint('preconnect', THREE_CDN_ORIGIN);
    [
      THREE_MODULE_URL,
      `${THREE_ADDONS_BASE_URL}loaders/GLTFLoader.mjs`,
      `${THREE_ADDONS_BASE_URL}loaders/DRACOLoader.mjs`,
      `${THREE_ADDONS_BASE_URL}controls/OrbitControls.mjs`,
      `${THREE_ADDONS_BASE_URL}environments/RoomEnvironment.mjs`
    ].forEach((href) => addResourceHint('modulepreload', href, '', 'high'));

    runtimePromise = Promise.all([
      import(THREE_MODULE_URL),
      import(`${THREE_ADDONS_BASE_URL}loaders/GLTFLoader.mjs`),
      import(`${THREE_ADDONS_BASE_URL}loaders/DRACOLoader.mjs`),
      import(`${THREE_ADDONS_BASE_URL}controls/OrbitControls.mjs`),
      import(`${THREE_ADDONS_BASE_URL}environments/RoomEnvironment.mjs`)
    ]).then(([
      THREE,
      { GLTFLoader },
      { DRACOLoader },
      { OrbitControls },
      { RoomEnvironment }
    ]) => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      const mounted = new WeakMap();
      const clock = new THREE.Clock();
      const activeViewers = new Set();
      let isAnimating = false;

      dracoLoader.setDecoderPath(THREE_DRACO_DECODER_URL);
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

      function readViewerNumber(value, fallback) {
        const amount = Number.parseFloat(value);
        return Number.isFinite(amount) ? amount : fallback;
      }

      function readModelOffset(value) {
        const amount = Number.parseFloat(value);
        return Number.isFinite(amount) ? amount : 0;
      }

      function readHexColor(value, fallback) {
        if (!value) return fallback;
        const normalized = value.trim().replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback;
        return Number.parseInt(normalized, 16);
      }

      function readRenderScale(value, lowQuality) {
        const fallback = lowQuality ? 0.62 : 1;
        const amount = Number.parseFloat(value);

        if (!Number.isFinite(amount)) return fallback;
        return Math.min(1, Math.max(0.18, amount));
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
        model.position.x += readModelOffset(viewer.dataset.modelOffsetX) * maxSize;
        model.position.y += readModelOffset(viewer.dataset.modelOffsetY) * maxSize;
        model.position.z += readModelOffset(viewer.dataset.modelOffsetZ) * maxSize;
        camera.near = maxSize / 100;
        camera.far = distance * 20;
        camera.position.set(distance * 0.06, distance * 0.14, distance);
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.update();
      }

      function disposeMaterial(material) {
        Object.keys(material).forEach((key) => {
          const value = material[key];
          if (value && value.isTexture) value.dispose();
        });
        material.dispose();
      }

      function pixelateTexture(texture) {
        if (!texture || !texture.isTexture) return;

        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipmapNearestFilter;
        texture.needsUpdate = true;
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

      function disposeViewer(viewer) {
        const instance = mounted.get(viewer);
        if (!instance) return;

        activeViewers.delete(instance);
        if (instance.resizeObserver) {
          instance.resizeObserver.disconnect();
        }
        if (instance.removeResizeListener) {
          instance.removeResizeListener();
        }
        instance.controls.dispose();
        if (instance.model) {
          disposeObject(instance.model);
        }
        if (instance.environment) {
          instance.environment.dispose();
        }
        instance.renderer.dispose();
        viewer.innerHTML = '';
        mounted.delete(viewer);
      }

      function createLights(scene, intensity = 1) {
        const hemi = new THREE.HemisphereLight(0xfffbf0, 0x171717, 1.45 * intensity);
        const key = new THREE.DirectionalLight(0xffffff, 3.1 * intensity);
        const rim = new THREE.DirectionalLight(0xcfe0ff, 1.6 * intensity);
        const fill = new THREE.DirectionalLight(0xffead1, 0.95 * intensity);
        const top = new THREE.DirectionalLight(0xffffff, 1.15 * intensity);

        key.position.set(-3.5, 5, 4.5);
        rim.position.set(4, 3, -5);
        fill.position.set(3.5, 1.8, 3);
        top.position.set(0, 6, 0.5);
        scene.add(hemi, key, rim, fill, top);
      }

      function createJewelryLights(scene, intensity = 1) {
        const sparkleLeft = new THREE.PointLight(0xffffff, 3.2 * intensity, 9);
        const sparkleRight = new THREE.PointLight(0xdce9ff, 2.7 * intensity, 9);
        const frontGlow = new THREE.PointLight(0xfff7e8, 2.4 * intensity, 8);

        sparkleLeft.position.set(-2.4, 2.6, 3.2);
        sparkleRight.position.set(2.6, 1.7, 2.4);
        frontGlow.position.set(0, -1.4, 4);
        scene.add(sparkleLeft, sparkleRight, frontGlow);
      }

      function polishMetalMaterial(material, viewer, materialEnvIntensity) {
        if (!viewer.hasAttribute('data-polished-silver')) return;

        const silver = readHexColor(viewer.dataset.metalColor, 0xd8dde2);
        const roughness = readViewerNumber(viewer.dataset.metalRoughness, 0.08);
        const envIntensity = readViewerNumber(viewer.dataset.envIntensity, Math.max(materialEnvIntensity, 4.2));

        material.color = material.color || new THREE.Color();
        material.color.setHex(silver);
        material.map = null;
        material.metalnessMap = null;
        material.roughnessMap = null;
        material.emissiveMap = null;
        material.aoMap = null;

        if ('metalness' in material) material.metalness = 1;
        if ('roughness' in material) material.roughness = roughness;
        if ('envMapIntensity' in material) material.envMapIntensity = envIntensity;
        if ('clearcoat' in material) material.clearcoat = 1;
        if ('clearcoatRoughness' in material) material.clearcoatRoughness = 0.04;
      }

      function mountThreeModel(viewer) {
        if (!viewer) return null;

        const lowQuality = shouldUseLowQuality(viewer);
        const src = getModelSource(viewer, lowQuality);
        if (!src) return null;

        disposeViewer(viewer);
        viewer.classList.remove('three-model--error', 'three-model--loaded');
        viewer.classList.add('three-model', 'three-model--loading');
        viewer.querySelectorAll('canvas').forEach((canvas) => canvas.remove());

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
        const renderer = new THREE.WebGLRenderer({
          antialias: !lowQuality,
          alpha: true,
          powerPreference: lowQuality ? 'low-power' : 'high-performance'
        });
        const controls = new OrbitControls(camera, renderer.domElement);
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        const prefersControls = viewer.hasAttribute('data-camera-controls');
        const autoRotate = viewer.hasAttribute('data-auto-rotate');
        const lightIntensity = readViewerNumber(viewer.dataset.lightIntensity, 1);
        const materialEnvIntensity = readViewerNumber(viewer.dataset.envIntensity, 1.35);
        const renderScale = readRenderScale(viewer.dataset.renderScale, lowQuality);

        scene.environment = env;
        createLights(scene, lightIntensity);
        if (viewer.hasAttribute('data-jewelry-lighting')) {
          createJewelryLights(scene, lightIntensity);
        }

        pmrem.dispose();
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(lowQuality ? 1 : Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = readViewerNumber(viewer.dataset.toneExposure, 1.2);
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
          renderScale,
          resizeObserver: null,
          removeResizeListener: null
        };

        function resize() {
          const rect = viewer.getBoundingClientRect();
          const width = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          const renderWidth = Math.max(1, Math.round(width * instance.renderScale));
          const renderHeight = Math.max(1, Math.round(height * instance.renderScale));

          renderer.setSize(renderWidth, renderHeight, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }

        if ('ResizeObserver' in window) {
          instance.resizeObserver = new ResizeObserver(resize);
          instance.resizeObserver.observe(viewer);
        } else {
          const handleWindowResize = () => resize();
          window.addEventListener('resize', handleWindowResize);
          instance.removeResizeListener = () => {
            window.removeEventListener('resize', handleWindowResize);
          };
        }

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
                  material.envMapIntensity = materialEnvIntensity;
                }
                polishMetalMaterial(material, viewer, materialEnvIntensity);
                if (lowQuality && 'flatShading' in material) {
                  material.flatShading = true;
                }
                if (lowQuality) {
                  [
                    material.map,
                    material.normalMap,
                    material.roughnessMap,
                    material.metalnessMap,
                    material.emissiveMap,
                    material.aoMap
                  ].forEach(pixelateTexture);
                }
                material.needsUpdate = true;
              });
            }
          });
          scene.add(instance.model);
          fitModel(instance.model, camera, controls, viewer);
          viewer.classList.remove('three-model--loading');
          viewer.classList.add('three-model--loaded');
        }, undefined, () => {
          disposeViewer(viewer);
          showModelFallback(viewer);
        });

        return instance;
      }

      function animate() {
        if (!activeViewers.size) {
          isAnimating = false;
          return;
        }

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

      function startAnimation() {
        if (isAnimating) return;

        isAnimating = true;
        clock.getDelta();
        requestAnimationFrame(animate);
      }

      runtime = {
        dispose: disposeViewer,
        has: (viewer) => mounted.has(viewer),
        mount: mountThreeModel,
        startAnimation
      };

      return runtime;
    }).catch((error) => {
      runtimePromise = null;
      throw error;
    });

    return runtimePromise;
  }

  function isMounted(viewer) {
    return Boolean(runtime && runtime.has(viewer));
  }

  function disposeViewer(viewer) {
    if (!viewer) return;
    if (lazyObserver) lazyObserver.unobserve(viewer);
    pendingViewers.delete(viewer);

    if (runtime) {
      runtime.dispose(viewer);
    }
  }

  function mountThreeModel(viewer) {
    if (!viewer || loadingViewers.has(viewer) || isMounted(viewer)) return Promise.resolve(null);

    if (lazyObserver) lazyObserver.unobserve(viewer);
    pendingViewers.delete(viewer);
    loadingViewers.add(viewer);
    showModelPreview(viewer);

    return loadThreeRuntime()
      .then((api) => {
        if (!document.body.contains(viewer)) return null;

        const instance = api.mount(viewer);
        api.startAnimation();
        return instance;
      })
      .catch(() => {
        showModelFallback(viewer);
        return null;
      })
      .finally(() => {
        loadingViewers.delete(viewer);
      });
  }

  function queueModelMount(viewer) {
    if (!viewer || isMounted(viewer) || pendingViewers.has(viewer) || loadingViewers.has(viewer)) return;

    showModelPreview(viewer);
    hintModelConnection(viewer, true);

    if (shouldLoadOnInteraction(viewer)) {
      queueInteractionMount(viewer);
      return;
    }

    if (!viewer.hasAttribute('data-model-viewport') || !lazyObserver || viewer.hasAttribute('data-model-eager') || viewer.closest('.product-left')) {
      mountThreeModel(viewer);
      return;
    }

    pendingViewers.add(viewer);
    lazyObserver.observe(viewer);
  }

  function shouldLoadOnInteraction(viewer) {
    return Boolean(
      viewer
      && viewer.closest('.image-card')
      && !viewer.closest('.product-left')
      && viewer.hasAttribute('data-model-lazy')
      && !viewer.hasAttribute('data-model-eager')
      && !viewer.hasAttribute('data-model-viewport')
    );
  }

  function queueInteractionMount(viewer) {
    if (!viewer || interactionViewers.has(viewer)) return;

    const trigger = viewer.closest('.image-card') || viewer;
    const load = () => mountThreeModel(viewer);

    interactionViewers.add(viewer);
    trigger.addEventListener('pointerenter', load, { once: true });
    trigger.addEventListener('focusin', load, { once: true });
    trigger.addEventListener('touchstart', load, { once: true, passive: true });
  }

  function mountAll() {
    document.querySelectorAll(modelViewerSelector).forEach(queueModelMount);
  }

  (async () => {
    await whenReady();

    const viewers = document.querySelectorAll(modelViewerSelector);
    if (!viewers.length) {
      window.dispatchEvent(new Event(readyEventName));
      return;
    }

    viewers.forEach(showModelPreview);
    viewers.forEach((viewer) => {
      hintModelConnection(viewer, true);
    });
    registerModelCache(viewers);

    if (!browserHasWebGL()) {
      viewers.forEach((viewer) => {
        showModelFallback(viewer);
      });
      window.dispatchEvent(new Event(readyEventName));
      return;
    }

    lazyObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;

          observer.unobserve(entry.target);
          mountThreeModel(entry.target);
        });
      }, {
        rootMargin: '260px 0px',
        threshold: 0.01
      })
      : null;

    window.ICZZThreeModels = {
      mount: mountThreeModel,
      mountAll,
      queue: queueModelMount,
      dispose: disposeViewer
    };

    mountAll();
    window.addEventListener('iczz-three-mount', mountAll);
    window.dispatchEvent(new Event(readyEventName));
  })().catch(() => {
    document.querySelectorAll(modelViewerSelector).forEach((viewer) => {
      showModelFallback(viewer);
    });
    window.dispatchEvent(new Event(readyEventName));
  });
})();

// Product gallery controls
onReady(() => {
  const productSection = document.querySelector('.producttest');
  if (!productSection) return;

  const itemSelector = '.gallery-images .gallery-model-tile, .gallery-images img';
  let activeIndex = 0;

  function getGalleryItems() {
    return Array.from(document.querySelectorAll(itemSelector));
  }

  function getMediaType(item, explicitType) {
    if (explicitType) return explicitType;
    return item && item.classList.contains('gallery-model-tile') ? 'model' : 'image';
  }

  function setActiveItem(item) {
    const items = getGalleryItems();
    const nextIndex = items.indexOf(item);

    items.forEach((galleryItem, index) => {
      const isActive = galleryItem === item;
      galleryItem.classList.toggle('is-active', isActive);

      if (galleryItem.matches('button')) {
        galleryItem.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }

      if (isActive) {
        activeIndex = index;
      }
    });

    if (nextIndex >= 0) {
      activeIndex = nextIndex;
    }
  }

  window.showImage = (item, explicitType) => {
    const viewer = document.getElementById('mainViewer');
    if (!viewer || !item) return;

    const previousImage = document.getElementById('mainImage');
    if (previousImage) previousImage.remove();

    setActiveItem(item);

    if (getMediaType(item, explicitType) === 'model') {
      viewer.style.display = 'block';
      return;
    }

    viewer.style.display = 'none';

    const image = document.createElement('img');
    image.id = 'mainImage';
    image.className = 'product-main-image';
    image.src = item.src;
    image.alt = item.alt || '';
    viewer.insertAdjacentElement('beforebegin', image);
  };

  window.prevImage = () => {
    const items = getGalleryItems();
    if (!items.length) return;

    activeIndex = (activeIndex - 1 + items.length) % items.length;
    window.showImage(items[activeIndex]);
  };

  window.nextImage = () => {
    const items = getGalleryItems();
    if (!items.length) return;

    activeIndex = (activeIndex + 1) % items.length;
    window.showImage(items[activeIndex]);
  };

  const firstItem = getGalleryItems()[0];
  if (firstItem) {
    setActiveItem(firstItem);
  }

  document.querySelectorAll('.display-arrow.left').forEach((button) => {
    button.addEventListener('click', window.prevImage);
  });

  document.querySelectorAll('.display-arrow.right').forEach((button) => {
    button.addEventListener('click', window.nextImage);
  });

  getGalleryItems().forEach((item) => {
    item.addEventListener('click', () => {
      window.showImage(item);
    });
  });

  const mainViewer = document.getElementById('mainViewer');
  if (mainViewer) {
    mainViewer.addEventListener('mousemove', (event) => {
      const rect = mainViewer.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const isInInteractiveArea = x > 0.2 && x < 0.8 && y > 0.2 && y < 0.8;

      mainViewer.style.touchAction = isInInteractiveArea ? 'none' : 'pan-y';
    });

    mainViewer.addEventListener('mouseleave', () => {
      mainViewer.style.touchAction = 'pan-y';
    });
  }
});

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
    if (node && node.classList.contains('three-model') && window.ICZZThreeModels) {
      window.ICZZThreeModels.dispose(node);
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
            if (window.ICZZThreeModels) {
              window.ICZZThreeModels.mount(modelNode);
            }
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
let activePageScrollAnimation = null;

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function animateNumber({ from, to, duration = 760, onUpdate, onComplete }) {
  const start = performance.now();
  let frameId = 0;
  let cancelled = false;

  function step(now) {
    if (cancelled) return;

    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    onUpdate(from + (to - from) * eased);

    if (progress < 1) {
      frameId = requestAnimationFrame(step);
      return;
    }

    if (onComplete) onComplete();
  }

  frameId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
  };
}

function smoothScrollWindowTo(targetY, duration = 820) {
  if (activePageScrollAnimation) {
    activePageScrollAnimation();
  }

  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const to = Math.min(Math.max(targetY, 0), maxY);

  activePageScrollAnimation = animateNumber({
    from: window.scrollY || window.pageYOffset,
    to,
    duration,
    onUpdate: (value) => window.scrollTo(0, value),
    onComplete: () => {
      activePageScrollAnimation = null;
    }
  });
}

function smoothScrollElementTo(element, targetLeft, duration = 760) {
  return animateNumber({
    from: element.scrollLeft,
    to: targetLeft,
    duration,
    onUpdate: (value) => {
      element.scrollLeft = value;
    }
  });
}

function syncThemeIcon() {
  const icon = document.getElementById('icon');
  if (!icon) return;

  icon.src = document.body.classList.contains('dark')
    ? '../images/icons/sun.svg'
    : '../images/icons/moon.svg';
}

function applySavedTheme() {
  const mode = localStorage.getItem('mode') || 'light';

  document.body.classList.toggle('dark', mode === 'dark');
  syncThemeIcon();
}

window.toggleDarkMode = () => {
  const nextMode = document.body.classList.contains('dark') ? 'light' : 'dark';

  document.body.classList.toggle('dark', nextMode === 'dark');
  localStorage.setItem('mode', nextMode);
  syncThemeIcon();
};

window.toggleMenu = () => {
  const menu = document.getElementById('menu');
  if (menu) menu.classList.toggle('active');
};
window.scrollToSection = () => {
  const target = document.getElementById('uvod');
  if (!target) return;

  const header = document.querySelector('.fixed-section');
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const targetY = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - headerHeight - 10;

  smoothScrollWindowTo(targetY);
};
window.toggleText = (card) => {
  if (card) card.classList.toggle('active');
};
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
        <button class="success-popup-close" type="button" aria-label="Close popup" data-popup-action="close">&times;</button>
        <p>SUCCESSFULLY ADDED TO CART</p>
        <div class="success-popup-actions">
          <button class="success-popup-btn secondary" type="button" data-popup-action="close">CONTINUE SHOPPING</button>
          <a class="success-popup-btn primary" href="kosik.html">TO CART</a>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    popup.querySelectorAll('[data-popup-action="close"]').forEach((button) => {
      button.addEventListener('click', window.closePopup);
    });
  }

  popup.classList.add('show');
};

onReady(() => {
  document.querySelectorAll('.login-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  });

  document.querySelectorAll('.arrow-btn, .clickable-heading').forEach((control) => {
    control.addEventListener('click', window.scrollToSection);
  });

  document.querySelectorAll('.image-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.toggleText(card);
    });
  });
});

onReady(() => {
  applySavedTheme();

  const themeToggle = document.getElementById('icon');
  if (themeToggle) {
    themeToggle.addEventListener('click', window.toggleDarkMode);
  }
});

onReady(() => {
  const search = document.getElementById('mysearch');
  const input = document.querySelector('.search-input');
  const image = document.getElementById('myImage');
  const addToCartButton = document.getElementById('addToCartBtn');
  const accountTriggers = document.querySelectorAll('.acc[href="#popup"]');
  const accountPopups = document.querySelectorAll('.popup');
  let lastAccountTrigger = null;

  function closeSearchPanel() {
    if (search) search.classList.remove('move');
    document.querySelectorAll('.search-panel.open').forEach((panel) => {
      panel.classList.remove('open');
    });
    if (input && document.activeElement === input) {
      input.blur();
    }
  }

  function clearPopupHash() {
    if (window.location.hash !== '#popup') return;

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }

    window.location.hash = '';
  }

  function setAccountPopupState(popup, isOpen) {
    popup.classList.toggle('show-account-popup', isOpen);
    popup.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function getOpenAccountPopup() {
    return Array.from(accountPopups).find((popup) => (
      popup.classList.contains('show-account-popup')
      || (popup.id && window.location.hash === `#${popup.id}`)
    ));
  }

  function openAccountPopup(popup, trigger) {
    if (!popup) return;

    closeSearchPanel();
    lastAccountTrigger = trigger || document.activeElement;
    accountPopups.forEach((accountPopup) => {
      setAccountPopupState(accountPopup, accountPopup === popup);
    });
    document.body.classList.add('account-popup-open');

    const focusFirstField = () => {
      const firstField = popup.querySelector('input[type="email"], .login-input, input, button, a[href]');
      if (firstField) firstField.focus({ preventScroll: true });
    };

    window.requestAnimationFrame(focusFirstField);
    window.setTimeout(focusFirstField, 80);
  }

  function closeAccountPopup() {
    accountPopups.forEach((popup) => {
      setAccountPopupState(popup, false);
    });
    document.body.classList.remove('account-popup-open');
    clearPopupHash();

    if (lastAccountTrigger && document.contains(lastAccountTrigger)) {
      lastAccountTrigger.focus({ preventScroll: true });
    }
  }

  function normalizeCloseButton(closeButton) {
    closeButton.classList.add('login-close-x');
    closeButton.textContent = 'EXIT';
    closeButton.setAttribute('aria-label', 'Close login popup');

    if (closeButton.tagName.toLowerCase() === 'button') {
      closeButton.type = 'button';
    }

    return closeButton;
  }

  function prepareLoginForm(popup) {
    const emailInput = popup.querySelector('input[type="email"]');
    const passwordInput = popup.querySelector('input[type="password"]');

    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-hidden', popup.classList.contains('show-account-popup') ? 'false' : 'true');

    if (emailInput) {
      emailInput.name = emailInput.name || 'email';
      emailInput.autocomplete = 'email';
      emailInput.inputMode = 'email';
      emailInput.setAttribute('aria-label', 'Email address');
    }

    if (passwordInput) {
      passwordInput.name = passwordInput.name || 'password';
      passwordInput.autocomplete = 'current-password';
      passwordInput.setAttribute('aria-label', 'Password');
    }
  }

  accountPopups.forEach((popup) => {
    document.body.appendChild(popup);
    prepareLoginForm(popup);

    popup.addEventListener('click', (event) => {
      if (event.target === popup) {
        closeAccountPopup();
      }
    });

    popup.querySelectorAll('.login-close-x, .close').forEach((closeButton) => {
      const button = normalizeCloseButton(closeButton);

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeAccountPopup();
      });
    });
  });

  document.addEventListener('click', (event) => {
    const closeButton = event.target.closest('.popup .close, .popup .login-close-x');
    if (!closeButton) return;

    event.preventDefault();
    event.stopPropagation();
    closeAccountPopup();
  }, true);

  accountTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openAccountPopup(document.getElementById('popup'), trigger);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && getOpenAccountPopup()) {
      event.preventDefault();
      closeAccountPopup();
    }
  });

  if (window.location.hash === '#popup') {
    openAccountPopup(document.getElementById('popup'));
  }

  if (addToCartButton) {
    const freshButton = addToCartButton.cloneNode(true);
    addToCartButton.replaceWith(freshButton);

    freshButton.addEventListener('click', function (event) {
      event.stopImmediatePropagation();

      const name = this.getAttribute('data-product-name');
      const price = this.getAttribute('data-product-price');
      const imageSrc = this.getAttribute('data-product-image');
      const productUrl = this.getAttribute('data-product-url') || window.location.href;
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find((item) => item.name === name);

      if (existing) {
        existing.quantity = clampCartQuantity(clampCartQuantity(existing.quantity) + 1);
        existing.image = imageSrc || existing.image;
        existing.url = productUrl;
      } else {
        cart.push({
          name,
          price,
          image: imageSrc,
          url: productUrl,
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      showPopup();
    }, true);
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

// Homepage trust badge carousel
onReady(() => {
  const badgesTrack = document.getElementById('badgesTrack');
  if (!badgesTrack || badgesTrack.dataset.loopReady) return;

  const badges = Array.from(badgesTrack.children).filter((badge) => badge.classList.contains('badge-item'));
  if (!badges.length) return;

  const createGroup = (items, isDuplicate = false) => {
    const group = document.createElement('div');
    group.className = 'badges-carousel-group';

    if (isDuplicate) {
      group.setAttribute('aria-hidden', 'true');
    }

    items.forEach((badge) => {
      group.appendChild(isDuplicate ? badge.cloneNode(true) : badge);
    });

    return group;
  };

  const wrapper = document.getElementById('badgesCarousel');
  const visibleWidth = wrapper ? wrapper.getBoundingClientRect().width : badgesTrack.getBoundingClientRect().width;
  const firstGroupItems = [...badges];
  const badgeWidth = badges[0].getBoundingClientRect().width || 120;
  const estimatedGap = 30;
  const targetWidth = visibleWidth + badgeWidth + estimatedGap;

  while (firstGroupItems.length * (badgeWidth + estimatedGap) < targetWidth) {
    firstGroupItems.push(...badges.map((badge) => badge.cloneNode(true)));
  }

  const firstGroup = createGroup(firstGroupItems);
  const duplicateGroup = createGroup(firstGroupItems, true);

  badgesTrack.textContent = '';
  badgesTrack.append(firstGroup, duplicateGroup);
  badgesTrack.dataset.loopReady = 'true';

  const updateBadgeLoop = () => {
    const trackStyles = window.getComputedStyle(badgesTrack);
    const trackGap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
    const distance = firstGroup.getBoundingClientRect().width + trackGap;

    badgesTrack.style.setProperty('--badges-scroll-distance', `${distance}px`);
    badgesTrack.style.setProperty('--badge-scroll-duration', `${Math.max(60, distance / 24)}s`);
    badgesTrack.classList.add('is-ready');
  };

  updateBadgeLoop();
  window.addEventListener('load', updateBadgeLoop, { once: true });
  window.addEventListener('resize', updateBadgeLoop);
});

// Celebrity carousel. Uses transform instead of native smooth scrolling so it works consistently across PCs.
onReady(() => {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.slide'));
  if (slides.length <= 1) return;

  let autoplayId = null;
  let isPaused = false;
  let activeIndex = 0;
  const autoplayInterval = 4000;

  function renderCarousel() {
    carousel.style.transform = `translate3d(${-activeIndex * 100}%, 0, 0)`;
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
    });
  }

  function goToNextSlide() {
    if (isPaused) return;
    activeIndex = (activeIndex + 1) % slides.length;
    renderCarousel();
  }

  function startAutoplay() {
    if (autoplayId) return;
    autoplayId = setInterval(goToNextSlide, autoplayInterval);
  }

  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function pause() {
    isPaused = true;
    stopAutoplay();
  }

  function resume() {
    isPaused = false;
    startAutoplay();
  }

  carousel.addEventListener('mouseenter', pause);
  carousel.addEventListener('mouseleave', resume);
  carousel.addEventListener('focusin', pause);
  carousel.addEventListener('focusout', resume);
  carousel.addEventListener('touchstart', pause, { passive: true });
  carousel.addEventListener('touchend', resume, { passive: true });

  window.addEventListener('resize', () => {
    renderCarousel();
  });

  renderCarousel();
  startAutoplay();
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
