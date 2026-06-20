// 🎨 Sincronização de cores de categoria
(function() {
  // Lista correta de slugs
  const CATEGORIAS = [
    'política', 'policia', 'economia', 'educação', 'esportes',
    'cultura', 'segurança', 'saúde', 'tecnologia', 'meio-ambiente',
    'opinião', 'geral'
  ];

  function detectarCategoria() {
    const url = window.location.href;

    // Procurar por padrões de URL
    for (const cat of CATEGORIAS) {
      // Padrões: /categoria/, ?cat=categoria, #categoria
      if (url.includes('/' + cat + '/') ||
          url.includes('?cat=' + cat) ||
          url.includes('#' + cat) ||
          url.includes('/categoria/' + cat)) {
        return cat;
      }
    }

    return 'geral'; // fallback
  }

  function aplicarCategoria(slug) {
    console.log('[category-sync] Aplicando categoria:', slug);
    document.body.setAttribute('data-category', slug);

    // Aplicar também ao html para maior cobertura
    document.documentElement.setAttribute('data-category', slug);
  }

  // Aplicar ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      aplicarCategoria(detectarCategoria());
    });
  } else {
    aplicarCategoria(detectarCategoria());
  }

  // Observar mudanças de URL (SPA navigation)
  window.addEventListener('popstate', () => {
    setTimeout(() => aplicarCategoria(detectarCategoria()), 100);
  });

  // Detectar cliques em links de categoria
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      setTimeout(() => aplicarCategoria(detectarCategoria()), 50);
    }
  });

  // Debug: log ao window
  window.categoryDebug = {
    getCurrent: () => document.body.getAttribute('data-category'),
    getDetected: () => detectarCategoria(),
    apply: (slug) => aplicarCategoria(slug)
  };
})();
