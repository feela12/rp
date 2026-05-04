(function () {
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
})();
