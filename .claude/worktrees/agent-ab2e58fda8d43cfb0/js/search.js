import { search, getCategoria } from './data.js';
import { esc } from './render.js';

export function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  const wrap = input.closest('.header__search');
  const trigger = wrap?.querySelector('button');

  let timer = null;

  function close() {
    results.classList.remove('is-open');
    results.innerHTML = '';
  }

  function closeWrap() {
    wrap?.classList.remove('is-open');
    input.value = '';
    close();
  }

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = wrap.classList.toggle('is-open');
    if (open) {
      requestAnimationFrame(() => input.focus());
    } else {
      input.value = '';
      close();
    }
  });

  function render(query) {
    const matches = search(query).slice(0, 8);
    if (!matches.length) {
      results.innerHTML = `<div class="search-result__empty">Nenhum resultado para "${esc(query)}".</div>`;
      results.classList.add('is-open');
      return;
    }
    results.innerHTML = matches.map(n => {
      const cat = getCategoria(n.categoria);
      return `
        <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="search-result">
          <span class="badge badge--${esc(n.categoria)}" style="flex-shrink:0;">${esc(cat?.label || n.categoria)}</span>
          <span class="search-result__title">${esc(n.titulo)}</span>
        </a>
      `;
    }).join('');
    results.classList.add('is-open');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) {
      close();
      return;
    }
    timer = setTimeout(() => render(q), 250);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWrap();
      input.blur();
    }
  });

  document.addEventListener('click', (e) => {
    if (wrap?.contains(e.target) || results.contains(e.target)) return;
    closeWrap();
  });

  // Lupa da topbar abre o campo de busca do header
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#topbar-search-btn');
    if (!btn) return;
    e.preventDefault();
    wrap?.classList.add('is-open');
    requestAnimationFrame(() => input.focus());
    btn.blur();
  });
}
