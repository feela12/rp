const form = document.querySelector('#product-form');
const statusText = document.querySelector('#status');
const productSelect = document.querySelector('#product-select');
const backLink = document.querySelector('#back-link');
const requestedProduct = new URLSearchParams(location.search).get('product');
if (requestedProduct && Array.from(productSelect.options).some((option) => option.value === requestedProduct)) {
  productSelect.value = requestedProduct;
}

function endpoint() {
  const apiSlug = productSelect.value === 'product8' ? 'graduation-cd' : productSelect.value;
  return `/api/products/${encodeURIComponent(apiSlug)}`;
}

function showProduct(product) {
  document.querySelector('#product-id').textContent = product.id;
  form.elements.name.value = product.name;
  form.elements.description.value = product.description;
  form.elements.price.value = product.price;
  form.elements.imagePath.value = product.imagePath;
  backLink.href = `/${product.pagePath}`;
  backLink.textContent = `← Zpět na ${product.name}`;
}

async function loadProduct() {
  statusText.textContent = 'Načítám produkt…';
  try {
    const response = await fetch(endpoint(), { cache: 'no-store' });
    const product = await response.json();
    if (!response.ok) throw new Error(product.error || 'Produkt se nepodařilo načíst.');
    showProduct(product);
    statusText.textContent = '';
  } catch (error) {
    statusText.textContent = error.message;
  }
}

productSelect.addEventListener('change', loadProduct);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusText.textContent = 'Ukládám…';
  const payload = Object.fromEntries(new FormData(form));
  payload.price = Number(payload.price);

  try {
    const response = await fetch(endpoint(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const product = await response.json();
    if (!response.ok) throw new Error(product.error || 'Změny se nepodařilo uložit.');
    showProduct(product);
    statusText.textContent = 'Změny jsou uložené v databázi.';
  } catch (error) {
    statusText.textContent = error.message;
  }
});

loadProduct();
