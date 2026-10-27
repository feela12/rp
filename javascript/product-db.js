(() => {
  const priceElement = document.querySelector('.product-right .cenovka');
  const addToCartButton = document.querySelector('#addToCartBtn');
  if (!priceElement || !addToCartButton) return;

  let rewardElement = priceElement.querySelector('.loyalty-reward');
  if (!rewardElement) {
    rewardElement = document.createElement('span');
    rewardElement.className = 'loyalty-reward';
    priceElement.append(rewardElement);
  }
  let priceTextNode = Array.from(priceElement.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (!priceTextNode) {
    priceTextNode = document.createTextNode('');
    priceElement.insertBefore(priceTextNode, rewardElement);
  }
  const productSlug = location.pathname.split('/').pop().replace(/\.html$/, '');
  const apiSlug = productSlug === 'product8' ? 'graduation-cd' : productSlug;

  fetch(`/api/products/${encodeURIComponent(apiSlug)}`, { cache: 'no-store' })
    .then(async (response) => {
      const product = await response.json();
      if (!response.ok) throw new Error(product.error || 'Product data is unavailable');
      return product;
    })
    .then((product) => {
      const productName = document.querySelector('#db-product-name, .product-right .nadpisc a');
      const productDescription = document.querySelector('#db-product-description, .product-right .ricktext');
      if (productName) productName.textContent = product.name;
      if (productDescription) productDescription.textContent = product.description;
      priceElement.querySelector('.discount')?.remove();
      priceTextNode.textContent = `${product.price} \u20AC`;
      addToCartButton.dataset.productName = product.name;
      addToCartButton.dataset.productPrice = product.price;
      addToCartButton.dataset.productImage = product.imagePath;
      addToCartButton.disabled = false;
      const modelViewer = document.querySelector('#mainViewer[data-fallback-src]');
      if (modelViewer) modelViewer.dataset.fallbackSrc = product.imagePath;
      const galleryImage = document.querySelector('.product-gallery img');
      if (galleryImage) {
        galleryImage.src = product.imagePath;
        galleryImage.alt = product.name;
      }

      const points = Math.floor(Number(product.price) * 111);
      rewardElement.textContent = `+${new Intl.NumberFormat('cs-CZ').format(points)} BOD\u016E`;
      rewardElement.hidden = false;
      priceElement.hidden = false;
      document.dispatchEvent(new Event('product-price-updated'));
    })
    .catch((error) => {
      console.error(`Could not load ${productSlug} from database:`, error);
      if (priceElement.id === 'db-product-price') {
        priceTextNode.textContent = 'Cena není dostupná';
        priceElement.hidden = false;
        addToCartButton.dataset.productPrice = '';
        addToCartButton.disabled = true;
      } else {
        priceElement.hidden = false;
        rewardElement.hidden = true;
      }
      document.dispatchEvent(new Event('product-price-updated'));
    });
})();
