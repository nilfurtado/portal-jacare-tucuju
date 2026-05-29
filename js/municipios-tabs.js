import { byMunicipio, getMunicipio } from './data.js';
import { cardNoticia, esc } from './render.js';

const STORAGE_KEY = 'portal_amapa_last_municipio';

export function initMunicipiosTabs(municipios) {
  const tabsEl = document.getElementById('municipios-tabs');
  const contentEl = document.getElementById('municipios-content');
  if (!tabsEl || !contentEl || !municipios.length) return;

  const last = localStorage.getItem(STORAGE_KEY);
  const ativo = municipios.find(m => m.slug === last) || municipios[0];

  tabsEl.innerHTML = municipios.map(m => `
    <button class="tab ${m.slug === ativo.slug ? 'is-active' : ''}" data-municipio="${esc(m.slug)}" role="tab" aria-selected="${m.slug === ativo.slug}">
      ${esc(m.label)}
    </button>
  `).join('');

  render(ativo.slug);

  tabsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-municipio]');
    if (!btn) return;
    const slug = btn.dataset.municipio;
    tabsEl.querySelectorAll('.tab').forEach(t => {
      const active = t.dataset.municipio === slug;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    localStorage.setItem(STORAGE_KEY, slug);
    render(slug);
  });

  function render(slug) {
    const noticias = byMunicipio(slug, 3);
    const mun = getMunicipio(slug);
    if (!noticias.length) {
      contentEl.innerHTML = `<p class="text-muted" style="grid-column:1/-1;padding:var(--sp-6);text-align:center;">Nenhuma notícia recente em ${esc(mun?.label || slug)}.</p>`;
      return;
    }
    contentEl.innerHTML = noticias.map(n => cardNoticia(n, 'medium')).join('');
  }
}
