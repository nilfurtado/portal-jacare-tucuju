/**
 * Carrega o shell (sidebar) em qualquer página do painel.
 * Substitui <div data-include="partials/shell.html"></div> pelo HTML.
 */
import { requireAuth, logout } from './auth.js';
import { setActiveRoute, initSidebar } from './ui.js';
import { getBasePath } from './api.js';

export async function mountShell({ route, breadcrumbs } = {}) {
  const user = requireAuth();
  if (!user) return null;

  const base = getBasePath();
  const placeholder = document.querySelector('[data-include="partials/shell.html"]');
  if (placeholder) {
    const res = await fetch(`${base}/partials/shell.html`);
    const html = await res.text();
    placeholder.outerHTML = html;
  }

  // Reescreve links absolutos da sidebar para respeitar o base path
  // (ex: "/noticias.html" → "/painel-php/noticias.html")
  if (base) {
    document.querySelectorAll('.sidebar a[href^="/"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith(base + '/') && !href.startsWith('//')) {
        a.setAttribute('href', base + href);
      }
    });
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

  initSidebar();
  return user;
}
