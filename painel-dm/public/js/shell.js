/**
 * Carrega o shell (sidebar) em qualquer página do painel.
 * Substitui <div data-include="partials/shell.html"></div> pelo HTML.
 */
import { requireAuth, logout } from './auth.js';
import { setActiveRoute, initSidebar } from './ui.js';
import { initTheme, toggleTheme } from './theme.js';
import { initPhoneMasks } from './phone-mask.js';

// Aplica tema antes do paint para evitar flash
initTheme();

// Logout - adicionar ANTES de qualquer coisa para garantir que funcione
document.addEventListener('click', (e) => {
  const logoutBtn = e.target.closest('[data-action="logout"]');
  if (logoutBtn) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚪 Botão sair clicado');
    logout();
  }
});

// Dark mode toggle - funciona em qualquer lugar da página
document.addEventListener('click', (e) => {
  const themeBtn = e.target.closest('#theme-toggle');
  if (themeBtn) {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  }
});

export async function mountShell({ route, breadcrumbs } = {}) {
  const user = requireAuth();
  if (!user) return null;

  // Shell.html já foi carregado por include.js
  // Apenas inicializar elementos do shell

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

  initSidebar();
  initPhoneMasks();
  return user;
}
