document.addEventListener('DOMContentLoaded', () => {
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

  function closeFullscreen() {
    if (activeMedia) {
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
      activeMedia.remove();
      activeMedia = null;
    }

    activeMedia = node;
    content.appendChild(activeMedia);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fullscreen-open');
  }

  function buildImage(src, alt) {
    const img = document.createElement('img');
    img.className = 'product-fullscreen__image';
    img.src = src;
    img.alt = alt || '';
    return img;
  }

  function buildModel(sourceViewer) {
    const viewer = document.createElement('model-viewer');
    viewer.className = 'product-fullscreen__model';

    Array.from(sourceViewer.attributes).forEach((attr) => {
      if (attr.name !== 'id' && attr.name !== 'style') {
        viewer.setAttribute(attr.name, attr.value);
      }
    });

    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('touch-action', 'pan-y');
    return viewer;
  }

  document.addEventListener('click', (event) => {
    const mainImage = event.target.closest('#mainImage');
    if (mainImage) {
      openFullscreen(buildImage(mainImage.src, mainImage.alt));
      return;
    }

    const mainViewer = event.target.closest('#mainViewer');
    if (mainViewer) {
      openFullscreen(buildModel(mainViewer));
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
