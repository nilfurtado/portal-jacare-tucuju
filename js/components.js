/**
 * Loader de partials: encontra elementos <div data-include="caminho.html">
 * e injeta o conteúdo do partial. Funciona para qualquer página estática.
 *
 * Uso no HTML:
 *   <div data-include="partials/header.html"></div>
 *   <div data-include="partials/footer.html"></div>
 *
 * Retorna uma Promise que resolve quando todos os includes terminam,
 * para que outros módulos possam consultar/manipular o DOM depois.
 */

const cache = new Map();

async function fetchPartial(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
  const html = await res.text();
  cache.set(path, html);
  return html;
}

export async function loadIncludes(root = document) {
  const placeholders = root.querySelectorAll('[data-include]');
  await Promise.all(Array.from(placeholders).map(async el => {
    const path = el.getAttribute('data-include');
    try {
      const html = await fetchPartial(path);
      // Preserva o elemento se for <aside> ou tiver classe sidebar — evita
      // que widgets soltos virem filhos do grid pai (quebra de layout).
      const keepWrapper = el.tagName === 'ASIDE' || el.classList.contains('sidebar');
      if (keepWrapper) {
        el.innerHTML = html;
      } else {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        el.replaceWith(...tpl.content.childNodes);
      }
    } catch (err) {
      console.error(err);
      el.innerHTML = `<div style="padding:1rem;background:#fee;color:#900;border-radius:6px;">Erro ao carregar componente: ${path}</div>`;
    }
  }));
}

/** Marca o link ativo da navegação com base na rota indicada. */
export function setActiveRoute(routeKey) {
  if (!routeKey) return;
  document.querySelectorAll('[data-nav-list] [data-route]').forEach(a => {
    a.classList.toggle('is-active', a.dataset.route === routeKey);
  });
}

/** Preenche o ano atual em qualquer elemento [data-current-year]. */
export function fillCurrentYear() {
  const yr = new Date().getFullYear();
  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = String(yr);
  });
}

/** Abre/fecha o drawer lateral (menu hamburger estruturado). */
export function initDrawer() {
  const drawer = document.getElementById('drawer');
  if (!drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('[data-drawer-open]').forEach(b => b.setAttribute('aria-expanded', 'true'));
  };
  const close = () => {
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    document.querySelectorAll('[data-drawer-open]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  };

  document.querySelectorAll('[data-drawer-open]').forEach(btn => {
    btn.addEventListener('click', open);
  });
  document.querySelectorAll('[data-drawer-close]').forEach(btn => {
    btn.addEventListener('click', close);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
}

/** Registra o service worker (PWA) e expõe botão "Instalar app" no header. */
export function initPWA() {
  if (!('serviceWorker' in navigator)) return;

  // Registra apenas em ambiente servidor (file:// é bloqueado)
  if (location.protocol === 'file:') return;

  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  return;

  navigator.serviceWorker.register('sw.js').catch(err => {
    console.warn('SW registration failed:', err);
  });

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('.pwa-install').forEach(btn => {
      btn.classList.add('is-available');
      btn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          document.querySelectorAll('.pwa-install').forEach(b => b.classList.remove('is-available'));
        }
        deferredPrompt = null;
      }, { once: false });
    });
  });

  window.addEventListener('appinstalled', () => {
    document.querySelectorAll('.pwa-install').forEach(b => b.classList.remove('is-available'));
  });
}

/** Toggle de tema (claro/escuro) com persistência em localStorage. */
export function initTheme() {
  const STORAGE_KEY = 'portal-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(STORAGE_KEY);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initial);

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') || 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  });
}
