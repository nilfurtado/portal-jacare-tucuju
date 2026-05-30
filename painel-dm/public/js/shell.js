/**
 * Carrega o shell (sidebar) em qualquer página do painel.
 * Substitui <div data-include="partials/shell.html"></div> pelo HTML.
 */
import { requireAuth, logout } from './auth.js';
import { setActiveRoute, initSidebar } from './ui.js';
import { initTheme, toggleTheme } from './theme.js';

// Aplica tema antes do paint para evitar flash
initTheme();

export async function mountShell({ route, breadcrumbs } = {}) {
  const user = requireAuth();
  if (!user) return null;

  const placeholder = document.querySelector('[data-include="partials/shell.html"]');
  if (placeholder) {
    const res = await fetch('/partials/shell.html');
    const html = await res.text();
    placeholder.outerHTML = html;
  }

  // Preenche usuário
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.nome);
  document.querySelectorAll('[data-user-role]').forEach(el => {
    el.textContent = user.tipo === 'admin' ? 'Administrador' : 'Colaborador';
  });
  document.querySelectorAll('[data-user-initial]').forEach(el => {
    el.textContent = (user.nome || '?').trim().charAt(0).toUpperCase();
  });

  // Marca rota ativa
  if (route) setActiveRoute(route);

  // Logout
  document.querySelectorAll('[data-action="logout"]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  });

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const isDark = document.documentElement.dataset.theme !== 'light';
    const label = document.getElementById('theme-label');
    if (label) label.textContent = isDark ? 'Tema claro' : 'Tema escuro';
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      const nowDark = document.documentElement.dataset.theme !== 'light';
      if (label) label.textContent = nowDark ? 'Tema claro' : 'Tema escuro';
      // Atualiza ícone
      themeBtn.querySelector('svg').outerHTML = nowDark
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    });
  }

  initSidebar();
  return user;
}
