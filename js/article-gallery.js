/**
 * Galeria de imagens dentro do artigo.
 * Recebe array [{ src, caption }] e renderiza slider + lightbox.
 */
import { esc } from './render.js';

export function galleryTemplate(images) {
  if (!images || !images.length) return '';
  return `
    <section class="article-gallery" data-gallery>
      <header class="article-gallery__header">
        <span class="article-gallery__title">Galeria de fotos</span>
        <span class="article-gallery__count"><span data-gal-cur>1</span> / ${images.length}</span>
      </header>
      <div class="article-gallery__viewport">
        <button class="article-gallery__arrow article-gallery__arrow--prev" type="button" data-gal-prev aria-label="Foto anterior">
          <svg viewBox="0 0 24 24"><path d="M15.4 16.6L10.8 12l4.6-4.6L14 6l-6 6 6 6z"/></svg>
        </button>
        <div class="article-gallery__track" data-gal-track>
          ${images.map((img, i) => `
            <div class="article-gallery__slide">
              <img src="${esc(img.src)}" alt="${esc(img.caption || `Imagem ${i + 1}`)}" loading="lazy" data-gal-zoom data-idx="${i}">
              ${img.caption ? `<div class="article-gallery__caption">${esc(img.caption)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <button class="article-gallery__arrow article-gallery__arrow--next" type="button" data-gal-next aria-label="Próxima foto">
          <svg viewBox="0 0 24 24"><path d="M8.6 16.6L13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>
        </button>
      </div>
      <div class="article-gallery__dots" data-gal-dots></div>
    </section>
  `;
}

export function initGallery(rootSelector = '[data-gallery]', images = []) {
  const root = typeof rootSelector === 'string' ? document.querySelector(rootSelector) : rootSelector;
  if (!root || !images.length) return;

  const track = root.querySelector('[data-gal-track]');
  const dots = root.querySelector('[data-gal-dots]');
  const prev = root.querySelector('[data-gal-prev]');
  const next = root.querySelector('[data-gal-next]');
  const cur = root.querySelector('[data-gal-cur]');

  let idx = 0;
  const total = images.length;

  dots.innerHTML = images.map((_, i) =>
    `<button class="article-gallery__dot${i === 0 ? ' is-active' : ''}" type="button" data-i="${i}" aria-label="Ir para foto ${i + 1}"></button>`
  ).join('');

  function go(i) {
    idx = ((i % total) + total) % total;
    track.style.transform = `translateX(${-idx * 100}%)`;
    cur.textContent = idx + 1;
    dots.querySelectorAll('button').forEach((d, k) => d.classList.toggle('is-active', k === idx));
  }

  prev.addEventListener('click', () => go(idx - 1));
  next.addEventListener('click', () => go(idx + 1));
  dots.querySelectorAll('button').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.i))));

  // teclado quando focado
  root.setAttribute('tabindex', '0');
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(idx - 1);
    else if (e.key === 'ArrowRight') go(idx + 1);
  });

  // swipe touch
  let sx = 0, ex = 0;
  track.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend', e => {
    ex = e.changedTouches[0].screenX;
    const d = sx - ex;
    if (Math.abs(d) > 40) go(idx + (d > 0 ? 1 : -1));
  }, { passive: true });

  // Lightbox
  root.querySelectorAll('[data-gal-zoom]').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });
}

function openLightbox(src, alt) {
  let lb = document.querySelector('.lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" type="button" aria-label="Fechar">
        <svg viewBox="0 0 24 24"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>
      </button>
      <img class="lightbox__img" alt="">
    `;
    document.body.appendChild(lb);
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }
  lb.querySelector('.lightbox__img').src = src;
  lb.querySelector('.lightbox__img').alt = alt;
  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
