// Utility functions (define immediately)
window.toggleMenu=()=>document.getElementById('menu')?.classList.toggle('active');
window.scrollToSection=()=>document.getElementById('uvod')?.scrollIntoView({behavior:'smooth'});
window.toggleText=(c)=>c?.classList.toggle('active');

// Event listeners (wait for DOM)
document.addEventListener('DOMContentLoaded',()=>{
  const search = document.getElementById('mysearch');
  const input = document.querySelector('.search-input');
  const image = document.getElementById('myImage');

  // keep search input positioned exactly under the header (dynamic height)
  function updateSearchPosition(){
    const headerEl = document.querySelector('.fixed-section') || document.querySelector('header');
    const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-bar-height')) || 112;
    if(input){
      input.style.top = Math.max(Math.round(headerBottom), 0) + 'px';
    }
  }

  if (search && input) {
    search.addEventListener('click', (event) => {
      event.stopPropagation();
      // ensure input sits exactly below header before showing
      updateSearchPosition();
      search.classList.toggle('move');

      if (search.classList.contains('move')) {
        // small timeout to allow input transition then focus
        setTimeout(()=>input.focus(),80);
      }
    });

    input.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', () => {
      search.classList.remove('move');
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        search.classList.remove('move');
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('search') === '1' || window.location.hash === '#search-open') {
      updateSearchPosition();
      search.classList.add('move');
      setTimeout(()=>input.focus(),80);
    }

    // update position on resize (header height may change)
    window.addEventListener('resize', updateSearchPosition);
    // initial position
    updateSearchPosition();
  }

  if (image) {
    image.addEventListener('click',()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
  }
});





