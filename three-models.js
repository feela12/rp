(async () => {
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

  function fitModel(model, camera, controls) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(center);
    camera.near = maxSize / 100;
    camera.far = maxSize * 100;
    camera.position.set(maxSize * 0.08, maxSize * 0.18, maxSize * 1.85);
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
    const hemi = new THREE.HemisphereLight(0xffffff, 0x242424, 1.8);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    const fill = new THREE.DirectionalLight(0xffffff, 0.8);

    key.position.set(4, 5, 5);
    fill.position.set(-4, 2, -3);
    scene.add(hemi, key, fill);
  }

  function mountThreeModel(viewer) {
    const src = viewer?.dataset.modelSrc;
    if (!src) return null;

    disposeViewer(viewer);
    viewer.classList.remove('three-model--error');
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
        }
      });
      scene.add(instance.model);
      fitModel(instance.model, camera, controls);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll, { once: true });
  } else {
    mountAll();
  }

  window.addEventListener('iczz-three-mount', mountAll);
  window.dispatchEvent(new Event('iczz-three-ready'));
  animate();
})().catch(() => {
  document.querySelectorAll('.three-model[data-model-src]').forEach((viewer) => {
    viewer.classList.add('three-model--error');
    viewer.textContent = '3D model unavailable';
  });
});
