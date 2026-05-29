import { initPageShell } from './page-shell.js';
import { destaques, ultimas, byCategoria, getCategoria, tempoRelativo } from './data.js';
import { cardNoticia, cardVideo, cardClassificado, sectionHeader, esc } from './render.js';
import { initMunicipiosTabs } from './municipios-tabs.js';
import { initEnqueteGrande } from './enquete.js';
import { initCarousel } from './carousel.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await initPageShell({ route: 'home' });
    renderHeroMosaic(destaques(5), ultimas(6));
    renderUltimas(ultimas(6));
    renderCatSection('politica', data);
    renderCatSection('policia', data);
    renderCatSection('economia', data);
    renderCatSection('esportes', data);
    renderColunistas(data.colunas);
    initMunicipiosTabs(data.municipios);
    renderVideos(data.videos.slice(0, 4));
    const ativa = data.enquetes.find(e => e.ativa) || data.enquetes[0];
    if (ativa) initEnqueteGrande(ativa);
    renderClassificados(data.classificados.slice(0, 4));
  } catch (err) {
    console.error('Erro ao iniciar página:', err);
    showFatalError();
  }
});

function renderHeroMosaic(destaqueList, ultimasList) {
  const track = document.getElementById('hero-featured-track');
  const viewport = document.querySelector('.hero-featured-carousel__viewport');
  const dots = document.getElementById('hero-featured-dots');
  const prevBtn = document.querySelector('[data-featured-prev]');
  const nextBtn = document.querySelector('[data-featured-next]');
  const secondary = document.getElementById('hero-secondary');
  if (!track || !secondary || !destaqueList.length) return;

  // Carrossel rolante das notícias em destaque
  track.innerHTML = destaqueList.slice(0, 5).map(n => {
    const cat = getCategoria(n.categoria);
    return `
      <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="hero-card" aria-roledescription="slide">
        <div class="hero-card__image">
          <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}">
        </div>
        <div class="hero-card__overlay"></div>
        <div class="hero-card__content">
          <span class="badge badge--${esc(n.categoria)} hero-card__badge">${esc(cat?.label || n.categoria)}</span>
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
  }).join('');

  initCarousel({ viewport, track, dotsContainer: dots, prevBtn, nextBtn, interval: 5500, forceAutoplay: true });

  // Grade 2×2 — 4 cards laterais
  const minis = ultimasList.slice(0, 4);
  secondary.innerHTML = minis.map(n => {
    const cat = getCategoria(n.categoria);
    return `
      <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="story-card">
        <div class="story-card__image">
          <img src="${esc(n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">
          <span class="story-card__cat story-card__cat--${esc(n.categoria)}">${esc(cat?.label || n.categoria)}</span>
        </div>
        <div class="story-card__body">
          <h3 class="story-card__title">${esc(n.titulo)}</h3>
          <span class="story-card__date">${tempoRelativo(n.data)}</span>
        </div>
      </a>
    `;
  }).join('');
}

function renderUltimas(noticias) {
  const el = document.getElementById('ultimas-list');
  if (!el) return;
  const item = n => `
    <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="ultima-item">
      <span class="ultima-item__time">${tempoRelativo(n.data)}</span>
      <span class="ultima-item__dot" aria-hidden="true"></span>
      <span class="ultima-item__title">${esc(n.titulo)}</span>
    </a>
  `;
  const html = noticias.map(item).join('');
  el.innerHTML = html + html; // duplica para scroll infinito
}

function renderCatSection(catSlug, data) {
  const el = document.getElementById(`section-${catSlug}`);
  if (!el) return;
  const cat = getCategoria(catSlug);
  const noticias = byCategoria(catSlug, 3);
  if (!noticias.length) { el.style.display = 'none'; return; }
  el.innerHTML = `
    ${sectionHeader(cat.label, catSlug, `categoria.html?cat=${catSlug}`)}
    <div class="cards-grid cards-grid--3">
      ${noticias.map(n => cardNoticia(n, 'medium')).join('')}
    </div>
  `;
}

function renderColunistas(colunas) {
  const el = document.getElementById('section-colunistas');
  if (!el || !colunas?.length) { if (el) el.style.display = 'none'; return; }
  el.innerHTML = `
    ${sectionHeader('Colunistas', null, '#')}
    <div class="colunistas-grid">
      ${colunas.slice(0, 4).map(c => `
        <a href="#" class="colunista-card">
          <div class="colunista-card__avatar">
            <img src="${esc(c.avatar)}" alt="${esc(c.colunista)}" loading="lazy">
          </div>
          <div class="colunista-card__body">
            <span class="colunista-card__nome">${esc(c.colunista)}</span>
            <h4 class="colunista-card__titulo">${esc(c.titulo)}</h4>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderVideos(videos) {
  const el = document.getElementById('videos-grid');
  if (!el) return;
  el.innerHTML = videos.map(cardVideo).join('');
}

function renderClassificados(items) {
  const el = document.getElementById('classificados-grid');
  if (!el) return;
  el.innerHTML = items.map(cardClassificado).join('');
}

function showFatalError() {
  document.body.insertAdjacentHTML('beforeend', `
    <div style="position:fixed;bottom:1rem;left:1rem;right:1rem;background:#fee;border:1px solid #c8102e;padding:1rem;border-radius:8px;z-index:9999;max-width:520px;margin:0 auto;color:#700;">
      <strong>Erro:</strong> Não foi possível carregar os dados.
      Abra o site via servidor local (Live Server ou <code>python -m http.server</code>),
      não direto pelo arquivo (<code>file://</code>).
    </div>
  `);
}
