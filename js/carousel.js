/**
 * Carousel simples com auto-play, setas, dots, pause-on-hover e swipe touch.
 * Uso:
 *   initCarousel({
 *     viewport: el,    // .classif-carousel__viewport
 *     track: el,       // .classif-carousel__track
 *     dotsContainer: el, // .classif-carousel__dots
 *     prevBtn, nextBtn,
 *     interval: 5000
 *   });
 */
export function initCarousel({ viewport, track, dotsContainer, prevBtn, nextBtn, interval = 5000, forceAutoplay = false }) {
  if (!track) return null;
  const slides = Array.from(track.children);
  if (slides.length <= 1) return null;

  let index = 0;
  let timer = null;
  const reduced = !forceAutoplay && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // gera dots
  if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, i) =>
      `<button type="button" class="classif-carousel__dot${i === 0 ? ' is-active' : ''}" data-idx="${i}" aria-label="Ir para slide ${i + 1}"></button>`
    ).join('');
    dotsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => goTo(Number(btn.dataset.idx)));
    });
  }

  function update() {
    track.style.transform = `translateX(${-index * 100}%)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('button').forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
      });
    }
  }

  function goTo(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    update();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function start() {
    if (reduced || timer) return;
    timer = setInterval(next, interval);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // controles
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); stop(); start(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); stop(); start(); });

  // pausa no hover/focus
  if (viewport) {
    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);
    viewport.addEventListener('focusin', stop);
    viewport.addEventListener('focusout', start);

    // swipe touch
    let touchStartX = 0;
    let touchEndX = 0;
    viewport.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      stop();
    }, { passive: true });
    viewport.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) (diff > 0 ? next : prev)();
      start();
    }, { passive: true });
  }

  // keyboard
  if (viewport) {
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { prev(); stop(); start(); }
      else if (e.key === 'ArrowRight') { next(); stop(); start(); }
    });
  }

  update();
  start();

  return { next, prev, goTo, stop, start };
}
