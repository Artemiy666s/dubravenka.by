(function () {
  'use strict';

  const INTERVAL_MS = 5500;
  const SWIPE_THRESHOLD = 36;
  const RESUME_DELAY_MS = 4000;

  let timer = null;
  let resumeTimer = null;
  let current = 0;
  let slides = [];
  let dots = [];
  let touchStartX = 0;
  let touchStartY = 0;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function buildDots(container, count) {
    container.innerHTML = '';
    dots = [];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'about-gallery__dot' + (i === 0 ? ' about-gallery__dot--active' : '');
      dot.setAttribute('aria-label', `Фото ${i + 1}`);
      dot.addEventListener('click', () => {
        show(i);
        scheduleResume();
      });
      container.appendChild(dot);
      dots.push(dot);
    }
  }

  function show(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('about-gallery__slide--active', i === current);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('about-gallery__dot--active', i === current);
    });
  }

  function next() {
    show(current + 1);
  }

  function prev() {
    show(current - 1);
  }

  function start() {
    stop();
    if (slides.length < 2 || prefersReducedMotion()) return;
    timer = setInterval(next, INTERVAL_MS);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function scheduleResume() {
    stop();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(start, RESUME_DELAY_MS);
  }

  function onTouchStart(e) {
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    stop();
  }

  function onTouchEnd(e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) next();
      else prev();
    }

    scheduleResume();
  }

  function init() {
    const gallery = document.getElementById('about-gallery');
    if (!gallery) return;

    slides = [...gallery.querySelectorAll('.about-gallery__slide')];
    const dotsContainer = document.getElementById('about-gallery-dots');
    if (!slides.length || !dotsContainer) return;

    buildDots(dotsContainer, slides.length);
    show(0);

    if (!gallery.dataset.ready) {
      gallery.dataset.ready = '1';
      gallery.addEventListener('mouseenter', stop);
      gallery.addEventListener('mouseleave', start);
      gallery.addEventListener('touchstart', onTouchStart, { passive: true });
      gallery.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    start();
  }

  window.DubravenkaGallery = { init, start, stop };
})();
