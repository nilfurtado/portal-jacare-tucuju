import { getCategoria, getMunicipio, tempoRelativo, formatarData } from './data.js';

// ═══════════════════════════════════════════════════
// URL AMIGÁVEIS — HELPERS
// ═══════════════════════════════════════════════════

export function urlNoticia(slug) {
  return `/noticias/${encodeURIComponent(slug)}/`;
}

export function urlCategoria(slug) {
  return `/categoria/${encodeURIComponent(slug)}/`;
}

export function urlMunicipio(slug) {
  return `/municipio/${encodeURIComponent(slug)}/`;
}

export function urlBusca(q) {
  return `/busca/?q=${encodeURIComponent(q)}`;
}

// ═══════════════════════════════════════════════════

export function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function cardNoticia(n, variant = 'medium') {
  const cat = getCategoria(n.categoria);
  const catLabel = cat ? cat.label : n.categoria;
  const link = `urlNoticia(n.slug)`;
  const showLide = variant === 'large' || variant === 'medium';
  const imgClass = variant === 'horizontal' ? 'card--horizontal' : '';

  return `
    <a href="${link}" class="card card--${variant} ${imgClass}">
      <div class="card__image">
        <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">
      </div>
      <div class="card__body">
        ${variant !== 'horizontal' ? `<span class="card__cat card__cat--${esc(n.categoria)}">${esc(catLabel)}</span>` : ''}
        <h3 class="card__title">${esc(n.titulo)}</h3>
        ${showLide ? `<p class="card__lide">${esc(n.lide)}</p>` : ''}
        <div class="card__meta">
          <span>${variant === 'horizontal' ? tempoRelativo(n.data) : esc(n.autor)}</span>
          ${variant !== 'horizontal' ? `<span>${tempoRelativo(n.data)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

export function rankedItem(n, idx) {
  const cat = getCategoria(n.categoria);
  const catLabel = cat ? cat.label : n.categoria;
  const link = `urlNoticia(n.slug)`;
  const views = n.views ? n.views.toLocaleString('pt-BR') : '0';
  return `
    <a href="${link}" class="ranked-item">
      <span class="ranked-item__number">${String(idx + 1).padStart(2, '0')}</span>
      <div class="ranked-item__thumb">
        <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">
      </div>
      <div class="ranked-item__body">
        <span class="ranked-item__cat ranked-item__cat--${esc(n.categoria)}">${esc(catLabel)}</span>
        <span class="ranked-item__title">${esc(n.titulo)}</span>
        <span class="ranked-item__views">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
          ${views} visualizações
        </span>
      </div>
    </a>
  `;
}

export function cardVideo(v) {
  return `
    <a href="#" class="card-video">
      <div class="card-video__thumb">
        <img src="${esc(v.thumb)}" alt="${esc(v.titulo)}" loading="lazy">
        <span class="card-video__play" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </span>
        <span class="card-video__duracao">${esc(v.duracao)}</span>
      </div>
      <h4 class="card-video__title">${esc(v.titulo)}</h4>
    </a>
  `;
}

export function cardClassificado(c) {
  const preco = c.preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `
    <a href="#" class="card-class">
      <div class="card-class__image">
        <img src="${esc(c.imagem)}" alt="${esc(c.titulo)}" loading="lazy">
      </div>
      <div class="card-class__body">
        <span class="card-class__categoria">${esc(c.categoria)}</span>
        <h4 class="card-class__title">${esc(c.titulo)}</h4>
        <strong class="card-class__preco">${preco}</strong>
        <span class="card-class__cidade"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="margin-right:3px;vertical-align:middle;"><path d="M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>${esc(c.cidade)}</span>
      </div>
    </a>
  `;
}

export function sectionHeader(titulo, slug, link) {
  const slugClass = slug ? `cat-${slug}` : '';
  return `
    <div class="section-header ${slugClass}">
      <div class="bar"></div>
      <h2>${esc(titulo)}</h2>
      ${link ? `<a href="${link}" class="section-header__link" style="margin-left:auto;font-size:0.875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:var(--color-text-muted);">Ver tudo →</a>` : ''}
    </div>
  `;
}
