// Sistema de inclusão dinâmica de HTML — Carrega sidebar em todas as páginas
(async function loadIncludes() {
  // Aguardar DOM estar pronto se necessário
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }

  const includes = document.querySelectorAll('[data-include]');

  for (const element of includes) {
    const path = element.getAttribute('data-include');
    if (!path) continue;

    try {
      let fullPath = path.startsWith('/') ? path : '/painel/partials/' + path.replace('partials/', '');
      const response = await fetch(fullPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao carregar ${fullPath}`);
      }

      const html = await response.text();

      // Inserir HTML - verificar se elemento tem pai
      if (element.parentElement) {
        element.insertAdjacentHTML('beforebegin', html);
        element.remove();
      } else {
        // Se não tem pai, inserir como innerHTML
        element.innerHTML = html;
      }
    } catch (err) {
      console.error(`[include.js] Erro ao carregar ${path}:`, err.message);
    }
  }
})();
