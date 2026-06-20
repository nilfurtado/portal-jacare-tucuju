/**
 * Bootstrap compartilhado entre todas as páginas.
 * Carrega partials (header, footer, sidebar, breaking-news),
 * baixa os dados, inicializa UI global e popula widgets compartilhados.
 */
import { loadIncludes, setActiveRoute, fillCurrentYear, initTheme, initDrawer, initPWA } from './components.js';
import { loadAll, maisLidas, ultimas, getCategoria, tempoRelativo, getCache } from './data.js';
import { esc, rankedItem, cardClassificado } from './render.js';
import { initUI } from './ui.js';
import { initSearch } from './search.js';
import { initEnqueteSidebar } from './enquete.js';
import { initCarousel } from './carousel.js';
import { initPrevisaoTempo, initPrevisaoTempoHeader, injetarCSS as injetarCSSPrevisao } from './previsao-tempo.js';

/**
 * @param {Object} opts
 * @param {string} opts.route - chave da rota ativa (ex: 'home', 'politica', 'municipios')
 * @returns {Promise<Object>} dados carregados
 */
export async function initPageShell({ route } = {}) {
  // 1. injeta partials no DOM
  await loadIncludes();

  // 2. inicializa UI global (depende dos elementos vindos dos partials)
  initTheme();
  initDrawer();
  initUI();
  initPWA();
  fillCurrentYear();
  setActiveRoute(route);
  injetarCSSPrevisao();

  // Inicializar previsão do tempo no header (apenas Macapá)
  initPrevisaoTempoHeader();

  // 3. carrega dados (cache global)
  const data = await loadAll();

  // 4. popula widgets compartilhados que aparecem em todas as páginas
  populateNavbar();
  populateNavDropdown(data.municipios);
  populateDrawerMunicipios(data.municipios);
  populateDrawerColunas(data.colunas);
  populateFooterMunicipios(data.municipios);
  populateMaisLidas();
  populateUltimasSidebar();
  populateClassificadosCarousel(data.classificados);
  populateClassificadosCategorias(data.classificadosCategorias);
  populateBreakingNews(ultimas(10));
  initBreakingNewsControls();
  populateSidebarEnquete(data.enquetes);
  populateSocialLinks();
  populateSidebarCats();
  initPrevisaoTempo({ cidades: data.plugins?.['previsao-tempo']?.config });

  // 5. inicializa busca após carregar dados
  initSearch();

  return data;
}

function populateNavDropdown(municipios) {
  const el = document.getElementById('dropdown-municipios');
  if (!el) return;
  el.innerHTML = municipios.map(m => `
    <li><a href="municipio.html?cidade=${encodeURIComponent(m.slug)}">${esc(m.label)}</a></li>
  `).join('');
}

function populateDrawerMunicipios(municipios) {
  const el = document.getElementById('drawer-municipios');
  if (!el) return;
  const list = municipios.slice(0, 6).map(m =>
    `<a href="municipio.html?cidade=${encodeURIComponent(m.slug)}">${esc(m.label)}</a>`
  ).join('');
  el.innerHTML = list + `<a class="drawer-section__more" href="index.html#por-municipio">Ver todas <span>›</span></a>`;
}

function populateDrawerColunas(colunas) {
  const el = document.getElementById('drawer-colunas');
  if (!el || !colunas?.length) return;
  const list = colunas.slice(0, 4).map(c =>
    `<a href="#">${esc(c.colunista)}</a>`
  ).join('');
  el.innerHTML = list + `<a class="drawer-section__more" href="#">Ver todos <span>›</span></a>`;
}

function populateFooterMunicipios(municipios) {
  const el = document.getElementById('footer-municipios');
  if (!el) return;
  el.innerHTML = municipios.map(m => `
    <li><a href="municipio.html?cidade=${encodeURIComponent(m.slug)}">${esc(m.label)}</a></li>
  `).join('');
}

function populateMaisLidas() {
  const el = document.getElementById('mais-lidas');
  if (!el) return;
  el.innerHTML = maisLidas(5).map((n, i) => rankedItem(n, i)).join('');
}

function populateUltimasSidebar() {
  const el = document.getElementById('sidebar-ultimas');
  if (!el) return;
  el.innerHTML = ultimas(5).map((n, i) => rankedItem(n, i)).join('');
}

function populateClassificadosCarousel(classificados) {
  const track = document.getElementById('classif-track');
  const viewport = document.querySelector('#classif-carousel .classif-carousel__viewport');
  const dots = document.getElementById('classif-dots');
  const prevBtn = document.querySelector('[data-classif-prev]');
  const nextBtn = document.querySelector('[data-classif-next]');
  if (!track || !classificados?.length) return;

  const formatarPreco = (v) => v.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  track.innerHTML = classificados.slice(0, 6).map(c => `
    <a href="#" class="classif-carousel__slide" aria-roledescription="slide">
      <div class="classif-carousel__image">
        <img src="${esc(c.imagem)}" alt="${esc(c.titulo)}" loading="lazy">
      </div>
      <span class="classif-carousel__cat">${esc(c.categoria || 'Geral')}</span>
      <strong class="classif-carousel__preco">${formatarPreco(c.preco)}</strong>
      <span class="classif-carousel__titulo">${esc(c.titulo)}</span>
      <span class="classif-carousel__cidade">
        <svg viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
        ${esc(c.cidade || '')}
      </span>
    </a>
  `).join('');

  initCarousel({ viewport, track, dotsContainer: dots, prevBtn, nextBtn, interval: 5000 });
}

function populateClassificadosCategorias(cats) {
  const el = document.getElementById('classif-cats-grid');
  if (!el || !cats?.length) return;
  el.innerHTML = cats.map(c => `
    <a href="#" class="classif-cats__item" aria-label="${esc(c.label)}">
      <span class="classif-cats__icon" style="background:${esc(c.cor)};">
        ${c.icon}
      </span>
      <span class="classif-cats__label">${esc(c.label)}</span>
    </a>
  `).join('');
}

function populateSidebarEnquete(enquetes) {
  const ativa = enquetes.find(e => e.ativa) || enquetes[0];
  if (ativa) initEnqueteSidebar(ativa);
}

function populateBreakingNews(noticias) {
  const track = document.getElementById('breaking-news-track');
  if (!track || !noticias.length) return;

  const buildItem = (n) => {
    const cat = getCategoria(n.categoria);
    return `
      <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="bn-item">
        <span class="bn-item__editoria bn-item__editoria--${esc(n.categoria)}">${esc(cat?.label || n.categoria)}</span>
        <span>${esc(n.titulo)}</span>
      </a>
      <span class="bn-item__sep" aria-hidden="true"></span>
    `;
  };

  const oneSet = noticias.map(buildItem).join('');
  // duplica em 2 conjuntos — a animação translateX(-50%) faz loop infinito perfeito
  track.innerHTML = oneSet + oneSet;
}

function populateNavbar() {
  try {
    const navList = document.querySelector('[data-nav-list]');
    if (!navList) return;
    const cache = getCache();
    if (!cache || !cache.categorias || cache.categorias.length === 0) {
      console.warn('[populateNavbar] Cache vazio, pulando render');
      return;
    }
    const cats = cache.categorias
      .filter(c => c.destaque !== false)
      .sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

    let html = '<li class="nav__item"><a class="nav__link" href="index.html" data-route="home">Início</a></li>';

    cats.forEach(c => {
      const cor = c.cor || '#999999';
      html += `<li class="nav__item" style="--cat-color:${cor}"><a class="nav__link" href="categoria.html?cat=${encodeURIComponent(c.slug)}" data-route="${c.slug}">${esc(c.nome)}</a></li>`;
    });

    html += '<li class="nav__item" style="--cat-color:var(--cat-municipios)"><a class="nav__link" href="#" aria-haspopup="true" data-route="municipios">Municípios</a><ul class="nav__dropdown" id="dropdown-municipios"></ul></li>';
    html += '<li class="nav__item"><a class="nav__link" href="videos.html" data-route="videos">Vídeos</a></li>';
    html += '<li class="nav__item"><a class="nav__link" href="enquetes.html" data-route="enquetes">Enquetes</a></li>';
    html += '<li class="nav__item"><a class="nav__link" href="classificados.html" data-route="classificados">Classificados</a></li>';

    navList.innerHTML = html;
    console.log('[populateNavbar] ✅ Renderizado com', cats.length, 'categorias');
  } catch (err) {
    console.error('[populateNavbar] ❌ Erro:', err.message);
  }
}

function populateSidebarCats() {
  const el = document.getElementById('sidebar-cats');
  if (!el) return;
  const cats = (getCache().categorias || [])
    .filter(c => c.destaque !== false)  // Todas as categorias
    .sort((a, b) => (a.ordem || 999) - (b.ordem || 999));  // Ordenar por campo ordem
  el.innerHTML = cats.map(c => `
    <a href="categoria.html?cat=${encodeURIComponent(c.slug)}"
       class="sidebar-cat sidebar-cat--${esc(c.slug)}"
       style="color: ${c.cor || '#666'}"
       aria-label="${esc(c.nome)}">
      <span class="sidebar-cat__dot" style="background-color: ${c.cor || '#666'}"></span>
      ${esc(c.nome)}
    </a>
  `).join('');
}

function populateSocialLinks() {
  const config = getCache().config || {};
  const redes = config.redes || {};
  const wa = config.whatsapp?.grupo || '';

  const defs = [
    {
      href: redes.facebook, cls: 'social-tile--fb', label: 'Facebook',
      icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5v1.8H16l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" fill="currentColor"/></svg>',
    },
    {
      href: redes.instagram, cls: 'social-tile--ig', label: 'Instagram',
      icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.7 1.7 4.8 4.8.1 1.3.1 1.6.1 4.9 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.7-4.8 4.8-1.3.1-1.6.1-4.8.1-3.2 0-3.6 0-4.8-.1-3.2-.1-4.7-1.7-4.8-4.8C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.7.1-2.2.1-3.2 1.1-3.3 3.3C4 8.5 4 8.8 4 12s0 3.5.1 4.7c.1 2.2 1.1 3.2 3.3 3.3 1.2.1 1.5.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3.2-1.1 3.3-3.3.1-1.2.1-1.5.1-4.7s0-3.5-.1-4.7c-.1-2.2-1.1-3.2-3.3-3.3C15.5 4 15.2 4 12 4zm0 3a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-.9a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" fill="currentColor"/></svg>',
    },
    {
      href: redes.youtube, cls: 'social-tile--yt', label: 'YouTube',
      icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M23 7.4s-.2-1.6-.9-2.3c-.9-.9-1.8-.9-2.3-1-3.2-.2-7.9-.2-7.9-.2s-4.8 0-7.9.2c-.5.1-1.5.1-2.3 1C.9 5.8.7 7.4.7 7.4S.5 9.3.5 11.2v1.6c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.9.2 7.9.2s4.8 0 7.9-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.6c0-1.9-.2-3.8-.2-3.8zM9.7 15.1V8.4l6.2 3.4-6.2 3.3z" fill="currentColor"/></svg>',
    },
    {
      href: wa, cls: 'social-tile--wa', label: 'WhatsApp',
      icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" fill="currentColor"/></svg>',
    },
  ].filter(d => d.href && d.href.trim() !== '');

  // Preencher sidebar
  const sidebarEl = document.getElementById('social-sidebar-grid');
  if (sidebarEl) {
    sidebarEl.innerHTML = defs.map(d => `
      <a href="${esc(d.href)}" class="social-tile ${esc(d.cls)}" target="_blank" rel="noopener" aria-label="${esc(d.label)}">
        ${d.icon}
        <span>${esc(d.label)}</span>
      </a>
    `).join('');
  }

  // Preencher topbar (header)
  const topbarEl = document.querySelector('.topbar__social');
  if (topbarEl) {
    topbarEl.innerHTML = defs.map(d => {
      const svgMatch = d.icon.match(/<svg[^>]*>(.*?)<\/svg>/);
      const svgContent = svgMatch ? svgMatch[1] : '';
      return `
      <a href="${esc(d.href)}" aria-label="${esc(d.label)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">${svgContent}</svg>
      </a>
    `;
    }).join('');
  }

  // Preencher drawer
  const drawerEl = document.querySelector('.drawer__social');
  if (drawerEl) {
    drawerEl.innerHTML = defs.map(d => `
      <a href="${esc(d.href)}" class="drawer__social-link" aria-label="${esc(d.label)}" target="_blank" rel="noopener">
        ${d.icon}
      </a>
    `).join('');
  }
}

function initBreakingNewsControls() {
  const bn = document.querySelector('.breaking-news');
  const btn = bn?.querySelector('[data-bn-toggle]');
  if (!bn || !btn) return;
  btn.addEventListener('click', () => {
    const paused = bn.getAttribute('data-paused') === 'true';
    bn.setAttribute('data-paused', String(!paused));
    btn.setAttribute('aria-label', paused ? 'Pausar' : 'Retomar');
  });
}
