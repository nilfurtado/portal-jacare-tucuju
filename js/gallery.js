/**
 * Galeria de imagens modular com slider, lightbox e acessibilidade.
 * Padrão: classe ES6 com responsabilidade única.
 * Uso: new Gallery(container, imagesArray, options)
 */

import { esc } from './render.js';

export class Gallery {
  constructor(container, images = [], options = {}) {
    this.container = container;
    this.images = images;
    this.currentIndex = 0;
    this.options = {
      autoplay: false,
      interval: 5000,
      showTitle: true,
      ...options
    };
    this.lightboxInstance = null;

    if (container && images.length > 0) {
      this.init();
    }
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const html = this.template();
    this.container.innerHTML = html;
  }

  template() {
    if (!this.images.length) return '';

    const { showTitle } = this.options;

    return `
      <section class="article-gallery" data-gallery>
        ${showTitle ? `
          <header class="article-gallery__header">
            <span class="article-gallery__title">Galeria de fotos</span>
            <span class="article-gallery__count">
              <span data-gal-cur>1</span> / ${this.images.length}
            </span>
          </header>
        ` : ''}

        <div class="article-gallery__viewport">
          <button
            class="article-gallery__arrow article-gallery__arrow--prev"
            type="button"
            data-gal-prev
            aria-label="Foto anterior"
            ${this.images.length <= 1 ? 'disabled' : ''}
          >
            <svg viewBox="0 0 24 24">
              <path d="M15.4 16.6L10.8 12l4.6-4.6L14 6l-6 6 6 6z"/>
            </svg>
          </button>

          <div class="article-gallery__track" data-gal-track>
            ${this.images.map((img, i) => `
              <div class="article-gallery__slide">
                <img
                  src="${esc(img.src)}"
                  alt="${esc(img.alt || img.caption || `Imagem ${i + 1}`)}"
                  loading="lazy"
                  data-gal-zoom
                  data-idx="${i}"
                  style="cursor: zoom-in;"
                >
                ${img.caption ? `
                  <div class="article-gallery__caption">
                    ${esc(img.caption)}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <button
            class="article-gallery__arrow article-gallery__arrow--next"
            type="button"
            data-gal-next
            aria-label="Próxima foto"
            ${this.images.length <= 1 ? 'disabled' : ''}
          >
            <svg viewBox="0 0 24 24">
              <path d="M8.6 16.6L13.2 12 8.6 7.4 10 6l6 6-6 6z"/>
            </svg>
          </button>
        </div>

        ${this.images.length > 1 ? `
          <div class="article-gallery__dots" data-gal-dots></div>
        ` : ''}
      </section>
    `;
  }

  attachEvents() {
    const root = this.container.querySelector('[data-gallery]');
    if (!root) return;

    const track = root.querySelector('[data-gal-track]');
    const dots = root.querySelector('[data-gal-dots]');
    const btnPrev = root.querySelector('[data-gal-prev]');
    const btnNext = root.querySelector('[data-gal-next]');
    const counter = root.querySelector('[data-gal-cur]');

    // Inicializar dots
    if (dots && this.images.length > 1) {
      this.renderDots(dots);
      dots.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-i]');
        if (btn) this.goTo(parseInt(btn.dataset.i));
      });
    }

    // Botões de navegação
    if (btnPrev) btnPrev.addEventListener('click', () => this.prev());
    if (btnNext) btnNext.addEventListener('click', () => this.next());

    // Teclado
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Touch/swipe
    let startX = 0;
    let endX = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].screenX;
      const diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Lightbox
    root.querySelectorAll('[data-gal-zoom]').forEach((img) => {
      img.addEventListener('click', () => {
        this.openLightbox(img.src, img.alt);
      });
    });

    // Atualizar contador
    this.updateUI(root, counter);
  }

  renderDots(container) {
    container.innerHTML = this.images
      .map((_, i) => `
        <button
          class="article-gallery__dot${i === 0 ? ' is-active' : ''}"
          type="button"
          data-i="${i}"
          aria-label="Ir para foto ${i + 1}"
          aria-pressed="${i === 0}"
        ></button>
      `)
      .join('');
  }

  goTo(index) {
    this.currentIndex = ((index % this.images.length) + this.images.length) % this.images.length;
    this.updateUI(this.container.querySelector('[data-gallery]'));
  }

  next() {
    this.goTo(this.currentIndex + 1);
  }

  prev() {
    this.goTo(this.currentIndex - 1);
  }

  updateUI(root, counter = null) {
    if (!root) return;

    const track = root.querySelector('[data-gal-track]');
    const dots = root.querySelector('[data-gal-dots]');

    if (track) {
      track.style.transform = `translateX(${-this.currentIndex * 100}%)`;
    }

    if (dots) {
      dots.querySelectorAll('button').forEach((btn, i) => {
        const isActive = i === this.currentIndex;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive);
      });
    }

    if (counter) {
      counter.textContent = this.currentIndex + 1;
    }
  }

  openLightbox(src, alt = '') {
    if (!this.lightboxInstance) {
      this.lightboxInstance = new Lightbox();
    }
    this.lightboxInstance.open(src, alt);
  }
}

/**
 * Lightbox reutilizável (Singleton pattern)
 */
class Lightbox {
  constructor() {
    this.element = null;
    this.create();
  }

  create() {
    if (document.querySelector('.lightbox')) {
      this.element = document.querySelector('.lightbox');
      return;
    }

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" type="button" aria-label="Fechar lightbox">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/>
        </svg>
      </button>
      <img class="lightbox__img" alt="">
    `;

    document.body.appendChild(lb);
    this.element = lb;

    // Event listeners
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.closest('.lightbox__close')) {
        this.close();
      }
    });

    lb.querySelector('.lightbox__close').addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) {
        this.close();
      }
    });
  }

  open(src, alt = '') {
    if (!this.element) return;
    this.element.querySelector('.lightbox__img').src = src;
    this.element.querySelector('.lightbox__img').alt = alt;
    this.element.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.element) return;
    this.element.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

/**
 * API compatível com código legado
 * Exporta funções antigas para não quebrar imports existentes
 */
export function galleryTemplate(images) {
  const gallery = new Gallery(null, images, { showTitle: true });
  return gallery.template();
}

export function initGallery(rootSelector = '[data-gallery]', images = []) {
  const root = typeof rootSelector === 'string'
    ? document.querySelector(rootSelector)
    : rootSelector;

  if (!root) return null;

  const gallery = new Gallery(root, images, { showTitle: true });
  return gallery;
}
