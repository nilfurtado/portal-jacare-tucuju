import { esc } from './render.js';
import { getCategoria, tempoRelativo } from './data.js';

export function initHero(destaques) {
  const main = document.getElementById('hero-main');
  const side = document.getElementById('hero-side');
  if (!main || !side || !destaques.length) return;

  const principal = destaques[0];
  const secundarias = destaques.slice(1, 4);

  renderMain(main, principal);
  side.innerHTML = secundarias.map(renderSideItem).join('');

  // Auto-rotate apenas se houver mais de 1 destaque e respeitar reduced-motion
  if (destaques.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let index = 0;
  let timer = null;

  function tick() {
    index = (index + 1) % destaques.length;
    const noticia = destaques[index];
    main.style.opacity = '0';
    setTimeout(() => {
      renderMain(main, noticia);
      main.style.opacity = '1';
    }, 200);
  }

  function start() { timer = setInterval(tick, 6000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  main.style.transition = 'opacity 200ms ease-out';
  start();
  main.addEventListener('mouseenter', stop);
  main.addEventListener('mouseleave', start);
  main.addEventListener('focusin', stop);
  main.addEventListener('focusout', start);
}

function renderMain(container, n) {
  const cat = getCategoria(n.categoria);
  const catLabel = cat ? cat.label : n.categoria;
  container.innerHTML = `
    <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="hero-card">
      <div class="hero-card__image">
        <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}">
      </div>
      <div class="hero-card__overlay"></div>
      <div class="hero-card__content">
        <span class="badge badge--${esc(n.categoria)} hero-card__badge">${esc(catLabel)}</span>
        <h2 class="hero-card__title">${esc(n.titulo)}</h2>
        <p class="hero-card__lide">${esc(n.lide)}</p>
        <div class="hero-card__meta">
          <span>${esc(n.autor)}</span>
          <span aria-hidden="true">•</span>
          <span>${tempoRelativo(n.data)}</span>
        </div>
      </div>
    </a>
  `;
}

function renderSideItem(n) {
  const cat = getCategoria(n.categoria);
  const catLabel = cat ? cat.label : n.categoria;
  return `
    <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="hero-side-item">
      <div class="hero-side-item__image">
        <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">
      </div>
      <div class="hero-side-item__body">
        <span class="hero-side-item__badge" style="color:var(--cat-${esc(n.categoria)});">${esc(catLabel)}</span>
        <h3 class="hero-side-item__title">${esc(n.titulo)}</h3>
        <span class="hero-side-item__time">${tempoRelativo(n.data)}</span>
      </div>
    </a>
  `;
}
