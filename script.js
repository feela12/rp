// Utility functions (define immediately)
window.toggleMenu=()=>document.getElementById('menu')?.classList.toggle('active');
window.scrollToSection=()=>document.getElementById('uvod')?.scrollIntoView({behavior:'smooth'});
window.toggleText=(c)=>c?.classList.toggle('active');
window.closePopup=()=>{
  const popup = document.getElementById('successPopup');
  if (popup) popup.classList.remove('show');
};
window.showPopup=()=>{
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

// Event listeners (wait for DOM)
document.addEventListener('DOMContentLoaded',()=>{
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

    popup.querySelectorAll('.close').forEach((closeButton) => {
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
    searchButton.setAttribute('aria-label', 'Spustit vyhledavani');
    searchButton.innerHTML = '<span aria-hidden="true">&rarr;</span>';

    document.body.appendChild(searchPanel);
    searchPanel.appendChild(input);
    searchPanel.appendChild(searchButton);

    const searchTargets = [
      { href: 'product1.html', terms: ['chaos', 'great chaos', 'chain', 'ken carson', 'replica'] },
      { href: 'product2.html', terms: ['brutalist', 'necklace', 'rick owens ss20', 'ss20 chain'] },
      { href: 'product3.html', terms: ['drkshdw', 'rick owens drkshdw', 'collection'] },
      { href: 'product4.html', terms: ['maison margiela', 'future', 'futures', 'margiela'] },
      { href: 'product5.html', terms: ['yzy', 'tank top', 'wet tank', 'vultures', 'yeezy'] },
      { href: 'product6.html', terms: ['xo', 'weeknd', 'pendant', 'xo chain'] },
      { href: 'qfullmen.html', terms: ['men', 'man', 'male'] },
      { href: 'qfullwomen.html', terms: ['women', 'woman', 'female'] },
      { href: 'kosik.html', terms: ['cart', 'basket', 'kosik'] }
    ];

    function updateSearchPosition(){
      const headerEl = document.querySelector('.fixed-section') || document.querySelector('header');
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-bar-height')) || 112;
      searchPanel.style.top = Math.max(Math.round(headerBottom), 0) + 'px';
    }

    function openSearch(){
      updateSearchPosition();
      search.classList.add('move');
      searchPanel.classList.add('open');
      setTimeout(()=>input.focus(),80);
    }

    function closeSearch(){
      search.classList.remove('move');
      searchPanel.classList.remove('open');
    }

    function runSearch(){
      const query = input.value.trim().toLowerCase();
      if (!query) {
        input.focus();
        return;
      }

      const match = searchTargets.find((item) => item.terms.some((term) => query.includes(term) || term.includes(query)));
      if (match) {
        window.location.href = match.href;
        return;
      }

      window.location.href = 'index.html?search=1#high-demand';
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
      runSearch();
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
        runSearch();
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('search') === '1' || window.location.hash === '#search-open') {
      openSearch();
    }

    window.addEventListener('resize', updateSearchPosition);
    updateSearchPosition();
  }

  if (image) {
    image.addEventListener('click',()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
  }
});

document.addEventListener('click', (event) => {
  const successPopup = document.getElementById('successPopup');
  if (successPopup && successPopup.classList.contains('show') && event.target === successPopup) {
    closePopup();
  }
});





