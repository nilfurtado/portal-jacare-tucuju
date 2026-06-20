import { initPageShell } from './page-shell.js';
import { cardVideo, esc } from './render.js';

let allVideos = [];
let activeFilter = 'todos';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await initPageShell({ route: 'videos' });
    allVideos = data.videos;
    renderFilters(allVideos);
    renderGallery();
  } catch (err) {
    console.error('Erro:', err);
  }
});

function renderFilters(videos) {
  const el = document.getElementById('videos-filters');
  if (!el) return;
  const categorias = [...new Set(videos.map(v => v.categoria))];
  el.innerHTML = `
    <button class="video-filter is-active" data-cat="todos">Todos</button>
    ${categorias.map(c => `
      <button class="video-filter" data-cat="${esc(c)}">${esc(capitalize(c))}</button>
    `).join('')}
  `;
  el.querySelectorAll('.video-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.video-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.cat;
      renderGallery();
    });
  });
}

function renderGallery() {
  const el = document.getElementById('videos-gallery');
  if (!el) return;
  const filtered = activeFilter === 'todos' ? allVideos : allVideos.filter(v => v.categoria === activeFilter);
  if (!filtered.length) {
    el.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--color-text-muted);">Nenhum vídeo nesta categoria.</p>';
    return;
  }
  el.innerHTML = filtered.map(cardVideo).join('');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
