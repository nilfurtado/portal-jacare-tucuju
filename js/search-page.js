import { initPageShell } from './page-shell.js';
import { search } from './data.js';
import { cardNoticia, esc } from './render.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initPageShell({ route: null });

    const params = new URLSearchParams(location.search);
    const q = (params.get('palavra') || '').trim();
    const input = document.getElementById('busca-input');
    const form = document.getElementById('busca-form');

    if (input) input.value = q;
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      const url = new URL(location.href);
      if (v) url.searchParams.set('palavra', v); else url.searchParams.delete('palavra');
      location.href = url.toString();
    });

    if (q) runSearch(q);
    else showHint();
  } catch (err) {
    console.error('Erro:', err);
  }
});

function runSearch(q) {
  const results = search(q);
  const summary = document.getElementById('search-summary');
  const grid = document.getElementById('search-results-list');

  document.getElementById('busca-title').textContent = `Resultados para "${q}"`;
  document.getElementById('busca-subtitle').textContent = `${results.length} notícia${results.length === 1 ? '' : 's'} encontrada${results.length === 1 ? '' : 's'}.`;
  document.title = `"${q}" — Portal Jacaré Tucujú`;

  if (!results.length) {
    summary.innerHTML = '';
    grid.innerHTML = `
      <div class="search-empty" style="grid-column:1/-1;">
        <h3>Nenhum resultado para "${esc(q)}"</h3>
        <p>Tente outra palavra-chave, verifique a ortografia ou explore as <a href="index.html" style="color:var(--color-primary);font-weight:600;">últimas notícias</a>.</p>
      </div>
    `;
    return;
  }

  summary.innerHTML = `Mostrando <strong>${results.length}</strong> resultado${results.length === 1 ? '' : 's'} para <strong>"${esc(q)}"</strong>`;
  grid.innerHTML = results.map(n => cardNoticia(n, 'medium')).join('');
}

function showHint() {
  const grid = document.getElementById('search-results-list');
  grid.innerHTML = `
    <div class="search-empty" style="grid-column:1/-1;">
      <h3>Use o campo acima para buscar</h3>
      <p>Digite palavras-chave, nomes de autores, municípios ou tags.</p>
    </div>
  `;
}
