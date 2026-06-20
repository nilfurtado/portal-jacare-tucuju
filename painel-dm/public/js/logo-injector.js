/**
 * Logo Injector — Carrega logomarcas dinamicamente
 * Usa fallback local por padrão (sem dependência de API)
 */

export async function injectLogos() {
  try {
    console.log('[logo-injector] Iniciando...');
    // Usar logos locais por padrão
    const logoClara = 'img/logo-white.svg';
    const logoEscura = 'img/logo.svg';
    const faviconUrl = 'img/favicon.svg';

    console.log('[logo-injector] ✅ Logos definidos');

    // Detectar tema atual
    let isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Função para atualizar logo conforme tema
    function updateLogosForTheme(dark) {
      const logoUrl = dark ? logoEscura : logoClara;

      // Elementos de logo a atualizar
      const logoElements = ['header-logo', 'drawer-logo', 'footer-logo', 'painel-logo', 'login-logo'];
      logoElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = logoUrl;
      });
    }

    // Atualizar logo inicial
    updateLogosForTheme(isDark);

    // Injetar favicon (global em todas as páginas)
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconUrl;
    favicon.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';

    // Observar mudanças de tema e atualizar logo quando trocar
    const observer = new MutationObserver(() => {
      const newIsDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (newIsDark !== isDark) {
        isDark = newIsDark;
        updateLogosForTheme(isDark);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  } catch (err) {
    console.error('[logo-injector] ❌ Erro:', err.message, err);
    console.warn('Logo injector: falha ao carregar logos, usando fallback padrão', err);
    // Usar fallback padrão mesmo em caso de erro
    const logoElements = ['header-logo', 'drawer-logo', 'footer-logo', 'painel-logo', 'login-logo'];
    logoElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = 'img/logo-white.svg';
    });
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = 'img/favicon.svg';
  }
}

// Executar ao carregar DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLogos);
} else {
  injectLogos();
}
