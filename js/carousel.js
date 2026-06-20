/**
 * Carousel genérico com auto-play, setas, dots, pause-on-hover e swipe touch.
 * Padrão: classe ES6, responsabilidade única.
 * Uso: new Carousel(options) ou initCarousel(options) para compatibilidade
 */

export class Carousel {
  constructor(options = {}) {
    this.viewport = options.viewport;
    this.track = options.track;
    this.dotsContainer = options.dotsContainer;
    this.prevBtn = options.prevBtn;
    this.nextBtn = options.nextBtn;
    this.interval = options.interval || 5000;
    this.forceAutoplay = options.forceAutoplay || false;

    this.index = 0;
    this.timer = null;
    this.slides = [];
    this.prefersReducedMotion = false;

    if (this.track) {
      this.init();
    }
  }

  init() {
    this.slides = Array.from(this.track.children);
    if (this.slides.length <= 0) return;

    this.prefersReducedMotion = !this.forceAutoplay &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderDots();
    this.attachEventListeners();
    this.start();
  }

  renderDots() {
    if (!this.dotsContainer || this.slides.length <= 1) return;

    this.dotsContainer.innerHTML = this.slides
      .map((_, i) => `
        <button
          type="button"
          class="carousel__dot${i === 0 ? ' is-active' : ''}"
          data-idx="${i}"
          aria-label="Ir para slide ${i + 1}"
          aria-pressed="${i === 0}"
        ></button>
      `)
      .join('');

    this.dotsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-idx]');
      if (btn) {
        this.goTo(parseInt(btn.dataset.idx));
      }
    });
  }

  update() {
    this.track.style.transform = `translateX(${-this.index * 100}%)`;

    if (this.dotsContainer) {
      this.dotsContainer.querySelectorAll('button').forEach((dot, i) => {
        const isActive = i === this.index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-pressed', isActive);
      });
    }
  }

  goTo(i) {
    this.index = ((i % this.slides.length) + this.slides.length) % this.slides.length;
    this.update();
  }

  next() {
    this.goTo(this.index + 1);
  }

  prev() {
    this.goTo(this.index - 1);
  }

  start() {
    if (this.prefersReducedMotion || this.timer) return;
    this.timer = setInterval(() => this.next(), this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  attachEventListeners() {
    // Controles de botão
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.stop();
        this.start();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.stop();
        this.start();
      });
    }

    // Pausa ao hover/focus
    if (this.viewport) {
      this.viewport.addEventListener('mouseenter', () => this.stop());
      this.viewport.addEventListener('mouseleave', () => this.start());
      this.viewport.addEventListener('focusin', () => this.stop());
      this.viewport.addEventListener('focusout', () => this.start());

      // Touch swipe
      let touchStartX = 0;
      let touchEndX = 0;

      this.viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        this.stop();
      }, { passive: true });

      this.viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) this.next();
          else this.prev();
        }
        this.start();
      }, { passive: true });

      // Teclado
      this.viewport.setAttribute('tabindex', '0');
      this.viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.prev();
          this.stop();
          this.start();
        } else if (e.key === 'ArrowRight') {
          this.next();
          this.stop();
          this.start();
        }
      });
    }

    this.update();
  }
}

/**
 * API compatível com código legado
 */
export function initCarousel(options = {}) {
  if (!options.track) return null;

  const carousel = new Carousel(options);
  return {
    next: () => carousel.next(),
    prev: () => carousel.prev(),
    goTo: (i) => carousel.goTo(i),
    stop: () => carousel.stop(),
    start: () => carousel.start()
  };
}
