import { initPageShell } from './page-shell.js';
import { cardClassificado, esc } from './render.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await initPageShell({ route: 'classificados' });
    initFiltros(data.classificados, data.classificadosCategorias);
  } catch (err) {
    console.error('Erro:', err);
  }
});

function initFiltros(items, cats) {
  const grid = document.getElementById('classificados-lista');
  const btns = document.querySelectorAll('[data-filter]');
  if (!grid) return;

  function render(filtro) {
    const lista = filtro === 'todos' ? items : items.filter(c => c.categoria === filtro);
    if (!lista.length) {
      grid.innerHTML = '<p style="text-align:center;padding:3rem 0;color:var(--color-text-muted);">Nenhum anúncio nesta categoria.</p>';
      return;
    }
    grid.innerHTML = lista.map(cardClassificado).join('');
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      render(btn.dataset.filter);
    });
  });

  render('todos');
}
