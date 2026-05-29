import { initPageShell } from './page-shell.js';
import { byCategoria, byMunicipio, getCategoria, getMunicipio } from './data.js';
import { cardNoticia, esc } from './render.js';

const PAGE_SIZE = 12;
let state = { items: [], shown: 0, sort: 'recentes' };

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const page = document.body.dataset.page;
    await initPageShell({ route: page === 'municipio' ? 'municipios' : null });

    const params = new URLSearchParams(location.search);
    if (page === 'categoria') initCategoriaPage(params);
    else if (page === 'municipio') initMunicipioPage(params);

    initSortControl();
  } catch (err) {
    console.error('Erro:', err);
    const grid = document.getElementById('listing-grid');
    if (grid) grid.innerHTML = '<p class="listing-empty">Erro ao carregar. Abra via servidor local (Live Server ou <code>python -m http.server</code>).</p>';
  }
});

function initCategoriaPage(params) {
  const slug = params.get('cat');
  const cat = getCategoria(slug);
  if (!cat) {
    showNotFound('Editoria não encontrada');
    return;
  }

  // marca link ativo no nav + aplica cor da editoria na página inteira
  document.querySelectorAll(`[data-route="${slug}"]`).forEach(a => a.classList.add('is-active'));
  document.body.setAttribute('data-editoria', slug);

  // atualiza theme-color da barra do navegador
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', cat.cor);

  document.title = `${cat.label} — Portal Jacaré Tucujú`;
  document.getElementById('listing-label').textContent = 'Editoria';
  document.getElementById('listing-title').textContent = cat.label;
  document.getElementById('listing-desc').textContent = `Últimas notícias da editoria ${cat.label} no Amapá.`;

  const hero = document.getElementById('listing-hero');
  if (hero) hero.style.background = `linear-gradient(135deg, ${cat.cor} 0%, var(--color-bg-dark) 100%)`;

  state.items = byCategoria(slug);
  document.getElementById('listing-stats').innerHTML = `
    <span><strong>${state.items.length}</strong> notícias</span>
    <span><strong>${state.items.reduce((a, n) => a + (n.views || 0), 0).toLocaleString('pt-BR')}</strong> visualizações totais</span>
  `;
  applySortAndRender();
}

function initMunicipioPage(params) {
  const slug = params.get('cidade');
  const mun = getMunicipio(slug);
  if (!mun) {
    showNotFound('Município não encontrado');
    return;
  }

  document.title = `${mun.label} — Portal Jacaré Tucujú`;
  document.getElementById('listing-label').textContent = 'Município';
  document.getElementById('listing-title').textContent = mun.label;
  document.getElementById('listing-desc').textContent = mun.descricao || '';

  const hero = document.getElementById('listing-hero');
  if (hero && mun.imagem) {
    hero.style.background = `url('${mun.imagem}') center/cover no-repeat`;
  }

  state.items = byMunicipio(slug);
  document.getElementById('listing-stats').innerHTML = `
    <span>População: <strong>${(mun.populacao || 0).toLocaleString('pt-BR')}</strong></span>
    <span><strong>${state.items.length}</strong> notícias publicadas</span>
  `;
  applySortAndRender();
}

function initSortControl() {
  const sel = document.getElementById('sort-select');
  if (!sel) return;
  sel.addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.shown = 0;
    applySortAndRender();
  });
}

function applySortAndRender() {
  if (state.sort === 'lidas') {
    state.items.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else {
    state.items.sort((a, b) => new Date(b.data) - new Date(a.data));
  }
  state.shown = 0;
  renderMore();
}

function renderMore() {
  const grid = document.getElementById('listing-grid');
  const wrap = document.getElementById('listing-load-more-wrap');
  if (!grid) return;

  if (!state.items.length) {
    grid.innerHTML = '<p class="listing-empty">Nenhuma notícia encontrada nesta seção ainda.</p>';
    wrap.innerHTML = '';
    return;
  }

  if (state.shown === 0) grid.innerHTML = '';

  const next = state.items.slice(state.shown, state.shown + PAGE_SIZE);
  grid.insertAdjacentHTML('beforeend', next.map(n => cardNoticia(n, 'medium')).join(''));
  state.shown += next.length;

  if (state.shown >= state.items.length) {
    wrap.innerHTML = `<p class="text-muted">Você viu todas as ${state.items.length} notícias desta seção.</p>`;
  } else {
    wrap.innerHTML = `<button class="btn btn--primary" id="load-more">Carregar mais ${Math.min(PAGE_SIZE, state.items.length - state.shown)}</button>`;
    document.getElementById('load-more').addEventListener('click', renderMore);
  }
}

function showNotFound(msg) {
  document.getElementById('listing-title').textContent = '404';
  document.getElementById('listing-desc').textContent = msg;
  const grid = document.getElementById('listing-grid');
  if (grid) grid.innerHTML = `<p class="listing-empty">${esc(msg)}. <a href="index.html" style="color:var(--color-primary);font-weight:600;">Voltar ao início</a></p>`;
}
