/* theme.js — Light/Dark toggle com persistência */

const KEY = 'painel-dm:theme';

export function initTheme() {
  const saved = localStorage.getItem(KEY) || 'dark';
  applyTheme(saved);
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(KEY, next);
  updateToggleBtn(next);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  updateToggleBtn(theme);
}

function updateToggleBtn(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = theme === 'dark';
  btn.title = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
  btn.setAttribute('aria-label', btn.title);
  btn.innerHTML = isDark ? iconSun() : iconMoon();
}

function iconSun() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>`;
}

function iconMoon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;
}
