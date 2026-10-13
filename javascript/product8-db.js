fetch('/api/products/graduation-cd')
  .then(async (response) => {
    const product = await response.json();
    if (!response.ok) throw new Error(product.error || 'Product data is unavailable');
    return product;
  })
  .then((product) => {
    document.querySelector('#db-product-name').textContent = product.name;
    document.querySelector('#db-product-description').textContent = product.description;
    document.querySelector('#db-product-price').textContent = `${product.price} €`;

    const addToCart = document.querySelector('#addToCartBtn');
    addToCart.dataset.productName = product.name;
    addToCart.dataset.productPrice = product.price;
    addToCart.dataset.productImage = product.imagePath;
  })
  .catch((error) => console.error('Could not load Graduation CD from database:', error));
