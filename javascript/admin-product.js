const form = document.querySelector('#product-form');
const statusText = document.querySelector('#status');

function showProduct(product) {
  document.querySelector('#product-id').textContent = product.id;
  form.elements.name.value = product.name;
  form.elements.description.value = product.description;
  form.elements.price.value = product.price;
  form.elements.imagePath.value = product.imagePath;
}

async function loadProduct() {
  try {
    const response = await fetch('/api/products/graduation-cd');
    const product = await response.json();
    if (!response.ok) throw new Error(product.error || 'Produkt se nepodařilo načíst.');
    showProduct(product);
  } catch (error) {
    statusText.textContent = error.message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusText.textContent = 'Ukládám…';
  const payload = Object.fromEntries(new FormData(form));
  payload.price = Number(payload.price);

  try {
    const response = await fetch('/api/products/graduation-cd', {
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
