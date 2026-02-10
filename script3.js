   (function(){
    const track = document.getElementById('promoTrack');
    const slides = Array.from(track.children);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('promoDots');
    const status = document.getElementById('carouselStatus');
    
    
    let index = 0;
    const total = slides.length;
    let isAnimating = false;
    let autoplayInterval = 4000;
    let autoplayId = null;
    
    
    slides.forEach((_, i)=>{
    const d = document.createElement('button');
    d.className = 'promo-dot';
    d.setAttribute('aria-label', `Přejít na slide ${i+1}`);
    d.addEventListener('click', ()=> goTo(i));
    dotsContainer.appendChild(d);
    });
    const dots = Array.from(dotsContainer.children);
    
    
    function update(){
    track.style.transform = `translateX(${-index*100}%)`;
    dots.forEach((d,i)=> d.classList.toggle('active', i===index));
    status.textContent = `Slide ${index+1} of ${total}`;
    }
    
    
    function goTo(i){
    if(isAnimating || i===index) return;
    index = (i+total) % total;
    update();
    restartAutoplay();
    }
    
    
    function next(){ goTo((index+1) % total); }
    function prev(){ goTo((index-1 + total) % total); }
    
    
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    
    
    // keyboard podpora
    document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') prev();
    if(e.key === 'ArrowRight') next();
    });
    
    
    // autoplay
    function startAutoplay(){
    stopAutoplay();
    autoplayId = setInterval(()=> next(),autoplayInterval);
    }
    function stopAutoplay(){ if(autoplayId) clearInterval(autoplayId); autoplayId = null; }
    function restartAutoplay(){ stopAutoplay(); startAutoplay(); }
    
    
    // pauza na hover/fokus
    const carousel = document.querySelector('.promo-carousel');
    ['mouseenter','focusin'].forEach(ev=> carousel.addEventListener(ev, stopAutoplay));
    ['mouseleave','focusout'].forEach(ev=> carousel.addEventListener(ev, startAutoplay));
    
    
    // podpora swipu
    let startX = 0, moveX = 0, isTouching=false;
    const threshold = 40; // px
    track.addEventListener('touchstart', (e)=>{ isTouching=true; startX = e.touches[0].clientX; stopAutoplay(); }, {passive:true});
    track.addEventListener('touchmove', (e)=>{ if(!isTouching) return; moveX = e.touches[0].clientX - startX; track.style.transform = `translateX(${ -index*100 + (moveX / track.offsetWidth) * 100 }%)`; }, {passive:true});
    track.addEventListener('touchend', ()=>{
    isTouching=false;
    if(Math.abs(moveX) > threshold){ if(moveX < 0) next(); else prev(); } else { update(); }
    moveX = 0;
    startAutoplay();
    });
    
    update();
    startAutoplay();
    
    window.__promo = { goTo, next, prev };
    })();

    const container = document.querySelector('.products');
container.addEventListener('mousemove', e => {
  // Zjisti jestli je kurzor na .image-card nebo na mezere mezi nimi
  const isOnCard = e.target.classList.contains('image-card');
  
  if (isOnCard) {
    container.classList.add('hover-on-card');
    container.classList.remove('hover-on-gap');
  } else {
    container.classList.add('hover-on-gap');
    container.classList.remove('hover-on-card');
  }
});

container.addEventListener('mouseleave', () => {
  container.classList.remove('hover-on-card', 'hover-on-gap');
});