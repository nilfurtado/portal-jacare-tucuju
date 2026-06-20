console.log('[main.js] INICIANDO...');

import { injectLogos } from './logo-injector.js';
import { initPageShell } from './page-shell.js';
import { destaques, ultimas, byCategoria, getCategoria, tempoRelativo } from './data.js';
import { cardNoticia, cardVideo, cardClassificado, sectionHeader, esc, renderCapaImg } from './render.js';
import { initMunicipiosTabs } from './municipios-tabs.js';
import { initEnqueteGrande } from './enquete.js';
import { initCarousel } from './carousel.js';
import './lazy-load.js';
import './real-time.js';

console.log('[main.js] ✅ Imports completados');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('[main.js] DOMContentLoaded iniciado');
    const data = await initPageShell({ route: 'home' });
    console.log('[main.js] initPageShell completado, renderizando...');
    const dest = destaques(5);
    const ult = ultimas(6);
    console.log('[main.js] destaques:', dest.length, 'ultimas:', ult.length);
    renderHeroMosaic(dest, ult);
    renderUltimas(ultimas(6));

    // Renderizar TODAS as categorias na home
    if (data.categorias && Array.isArray(data.categorias)) {
      console.log(`[main.js] Renderizando ${data.categorias.length} categorias...`);
      const catsOrdenadas = [...data.categorias].sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
      catsOrdenadas.forEach(cat => {
        try {
          renderCatSection(cat.slug, data, 4);  // 4 notícias por categoria
          console.log(`[main.js] ✅ Seção ${cat.slug} renderizada`);
        } catch (err) {
          console.error(`[main.js] ❌ Erro ao renderizar ${cat.slug}:`, err);
        }
      });
    } else {
      console.error('[main.js] ❌ data.categorias não é array:', data.categorias);
    }

    // renderColunistas(data.colunas, data.categoriasColunas);
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
  console.log('[renderHeroMosaic] Iniciando...');
  const track = document.getElementById('hero-featured-track');
  const viewport = document.querySelector('.hero-featured-carousel__viewport');
  const dots = document.getElementById('hero-featured-dots');
  const prevBtn = document.querySelector('[data-featured-prev]');
  const nextBtn = document.querySelector('[data-featured-next]');
  const secondary = document.getElementById('hero-secondary');
  console.log('[renderHeroMosaic] track:', track ? 'OK' : 'NULL', 'secondary:', secondary ? 'OK' : 'NULL', 'destaques:', destaqueList.length);
  if (!track || !secondary || !destaqueList.length) {
    console.log('[renderHeroMosaic] ❌ Retornando (faltam elementos)');
    return;
  }
  console.log('[renderHeroMosaic] ✅ Elementos encontrados, renderizando...');

  // Carrossel rolante das notícias em destaque
  try {
    track.innerHTML = destaqueList.slice(0, 5).map(n => {
      const cat = getCategoria(n.categoria);
      const img = renderCapaImg(n, 'principal', false);
      console.log('[renderHeroMosaic] renderCapaImg retornou:', img.substring(0, 80));
      return `
        <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="hero-card" aria-roledescription="slide">
          <div class="hero-card__image">
            ${img}
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
    console.log('[renderHeroMosaic] ✅ track.innerHTML setado');
  } catch (err) {
    console.error('[renderHeroMosaic] ❌ Erro ao renderizar:', err);
    return;
  }

  try {
    initCarousel({ viewport, track, dotsContainer: dots, prevBtn, nextBtn, interval: 5500, forceAutoplay: true });
    console.log('[renderHeroMosaic] ✅ Carrossel iniciado');
  } catch (err) {
    console.error('[renderHeroMosaic] ❌ Erro ao init carousel:', err);
  }

  // Grade 2×2 — 4 cards laterais
  const minis = ultimasList.slice(0, 4);
  secondary.innerHTML = minis.map(n => {
    const cat = getCategoria(n.categoria);
    return `
      <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="story-card">
        <div class="story-card__image">
          ${renderCapaImg(n, 'homepage')}
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

function renderCatSection(catSlug, data, limit = 3) {
  const el = document.getElementById(`section-${catSlug}`);
  if (!el) return;
  const cat = getCategoria(catSlug);
  const noticias = byCategoria(catSlug, limit);

  // Ocultar seção se não tiver notícias
  if (noticias.length === 0) {
    el.style.display = 'none';
    return;
  }

  // Renderizar seção com notícias
  const catLabel = cat?.label || catSlug.charAt(0).toUpperCase() + catSlug.slice(1);
  const catCor = cat?.cor || '#999'; // Cor padrão cinza

  el.innerHTML = `
    ${sectionHeader(catLabel, catSlug, `categoria.html?cat=${catSlug}`, catCor)}
    <div class="cards-grid cards-grid--4">
      ${noticias.map(n => cardNoticia(n, 'medium')).join('')}
    </div>
  `;
}

function renderColunistas(colunas, categoriasColunas = []) {
  const el = document.getElementById('section-colunistas');
  if (!el || !colunas?.length) { if (el) el.style.display = 'none'; return; }

  // Agrupar por colunista único
  const colunistasUnicos = [];
  const vistos = new Set();
  colunas.forEach(c => {
    if (!vistos.has(c.colunista)) {
      vistos.add(c.colunista);
      colunistasUnicos.push(c);
    }
  });

  el.innerHTML = `
    ${sectionHeader('Colunistas', null, 'colunista.html')}
    <div class="colunistas-grid">
      ${colunistasUnicos.slice(0, 4).map(c => {
        const slug = c.colunista.toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, '-');

        // Encontrar categoria da coluna
        const categoria = categoriasColunas.find(cat => cat.slug === c.categoriaColuna);
        const nomeCategoria = categoria?.nome || '';

        // Contar quantas colunas este colunista tem
        const totalColunas = colunas.filter(col => col.colunista === c.colunista).length;

        return `
          <a href="colunista.html?slug=${encodeURIComponent(slug)}" class="colunista-card">
            <div class="colunista-card__avatar">
              <img src="${esc(c.avatar)}" alt="${esc(c.colunista)}" loading="lazy">
            </div>
            <div class="colunista-card__body">
              <span class="colunista-card__nome">${esc(c.colunista)}</span>
              <h4 class="colunista-card__titulo">${esc(c.titulo)}</h4>
              <span class="colunista-card__meta">${totalColunas} ${totalColunas === 1 ? 'coluna' : 'colunas'}</span>
            </div>
          </a>
        `;
      }).join('')}
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
