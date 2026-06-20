/**
 * Hero carousel com rotação automática e respeito a prefers-reduced-motion.
 * Padrão: classe ES6, responsabilidade única.
 * Uso: new HeroCarousel(destaques, options) ou initHero(destaques) para compatibilidade
 */

import { esc } from './render.js';
import { getCategoria, tempoRelativo } from './data.js';

export class HeroCarousel {
  constructor(destaques = [], options = {}) {
    this.destaques = destaques;
    this.mainContainer = options.mainContainer || document.getElementById('hero-main');
    this.sideContainer = options.sideContainer || document.getElementById('hero-side');
    this.interval = options.interval || 6000;
    this.transitionDuration = options.transitionDuration || 200;
    this.forceAutoplay = options.forceAutoplay || false;

    this.index = 0;
    this.timer = null;
    this.prefersReducedMotion = false;

    if (this.destaques.length > 0 && this.mainContainer) {
      this.init();
    }
  }

  init() {
    this.prefersReducedMotion = !this.forceAutoplay &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderMain(this.destaques[0]);
    this.renderSide();
    this.attachEventListeners();

    if (this.destaques.length > 1) {
      this.start();
    }
  }

  renderMain(noticia) {
    if (!this.mainContainer) return;

    const cat = getCategoria(noticia.categoria);
    const catLabel = cat ? cat.label : noticia.categoria;

    this.mainContainer.innerHTML = `
      <a href="noticia.html?slug=${encodeURIComponent(noticia.slug)}" class="hero-card">
        <div class="hero-card__image">
          <img
            src="${esc(noticia.imagem)}"
            alt="${esc(noticia.titulo)}"
            loading="eager"
            decoding="async"
          >
        </div>
        <div class="hero-card__overlay"></div>
        <div class="hero-card__content">
          <span class="badge badge--${esc(noticia.categoria)} hero-card__badge">
            ${esc(catLabel)}
          </span>
          <h2 class="hero-card__title">
            ${esc(noticia.titulo)}
          </h2>
          <p class="hero-card__lide">
            ${esc(noticia.lide)}
          </p>
          <div class="hero-card__meta">
            <span>${esc(noticia.autor)}</span>
            <span aria-hidden="true">•</span>
            <span>${tempoRelativo(noticia.data)}</span>
          </div>
        </div>
      </a>
    `;
  }

  renderSide() {
    if (!this.sideContainer || this.destaques.length < 2) return;

    const secundarias = this.destaques.slice(1, 4);
    this.sideContainer.innerHTML = secundarias
      .map((n) => this.renderSideItem(n))
      .join('');
  }

  renderSideItem(noticia) {
    const cat = getCategoria(noticia.categoria);
    const catLabel = cat ? cat.label : noticia.categoria;

    return `
      <a href="noticia.html?slug=${encodeURIComponent(noticia.slug)}" class="hero-side-item">
        <div class="hero-side-item__image">
          <img
            src="${esc(noticia.imagem)}"
            alt="${esc(noticia.titulo)}"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="hero-side-item__body">
          <span class="hero-side-item__badge" style="color:var(--cat-${esc(noticia.categoria)});">
            ${esc(catLabel)}
          </span>
          <h3 class="hero-side-item__title">
            ${esc(noticia.titulo)}
          </h3>
          <span class="hero-side-item__time">
            ${tempoRelativo(noticia.data)}
          </span>
        </div>
      </a>
    `;
  }

  tick() {
    this.index = (this.index + 1) % this.destaques.length;
    const noticia = this.destaques[this.index];

    // Fade out
    this.mainContainer.style.opacity = '0';

    // Render após delay
    setTimeout(() => {
      this.renderMain(noticia);
      this.mainContainer.style.opacity = '1';
    }, this.transitionDuration);
  }

  start() {
    if (this.prefersReducedMotion || this.timer) return;
    this.timer = setInterval(() => this.tick(), this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  attachEventListeners() {
    if (!this.mainContainer) return;

    // Transição visual
    this.mainContainer.style.transition = `opacity ${this.transitionDuration}ms ease-out`;

    // Pause ao hover/focus
    this.mainContainer.addEventListener('mouseenter', () => this.stop());
    this.mainContainer.addEventListener('mouseleave', () => this.start());
    this.mainContainer.addEventListener('focusin', () => this.stop());
    this.mainContainer.addEventListener('focusout', () => this.start());
  }
}

/**
 * API compatível com código legado
 */
export function initHero(destaques) {
  return new HeroCarousel(destaques);
}
