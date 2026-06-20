// 🔄 Sincronização em tempo real: Portal ← Painel-DM
(function() {
  const PAINEL_API = 'http://localhost:3000/api/categorias-export';
  let categoriasCache = [];

  function detectarCategoriaAtiva() {
    const url = window.location.href;

    // Procurar em ordem de especificidade
    for (const cat of categoriasCache) {
      // 1. URL com barra: /categoria/
      if (url.includes('/' + cat.slug + '/')) {
        return cat.slug;
      }
      // 2. Query param: ?cat=slug
      if (url.includes('?cat=' + cat.slug)) {
        return cat.slug;
      }
      // 3. Hash: #slug
      if (url.includes('#' + cat.slug)) {
        return cat.slug;
      }
      // 4. Partial match: /categoria (última parte da URL)
      const urlParts = url.split('/').filter(p => p);
      if (urlParts[urlParts.length - 1] === cat.slug) {
        return cat.slug;
      }
    }
    return null;
  }

  function aplicarCategoriaAtiva(slug) {
    if (!slug) return;

    document.body.setAttribute('data-category', slug);
    document.documentElement.setAttribute('data-category', slug);

    // Log para debug
    console.log('[sync-categories] 🎨 Categoria ativa aplicada:', slug);

    // Trigger customEvent para outros scripts
    window.dispatchEvent(new CustomEvent('categoryChanged', { detail: { slug } }));
  }

  async function sincronizarCategoriasEmTempoReal() {
    try {
      // 1️⃣ Carregar categorias do painel-dm
      const res = await fetch(PAINEL_API + '/json');
      if (!res.ok) throw new Error('Falha ao carregar categorias do painel');

      categoriasCache = await res.json();

      // 2️⃣ Detectar e aplicar categoria ativa
      const catAtiva = detectarCategoriaAtiva();
      if (catAtiva) {
        aplicarCategoriaAtiva(catAtiva);
      }

      // 3️⃣ Criar variáveis CSS dinâmicas
      let css = ':root {\n';
      categoriasCache.forEach((cat) => {
        css += `  --cat-${cat.slug}: ${cat.cor};\n`;
      });
      css += '}';

      // Injetar CSS dinâmico (fallback se não carregar do painel)
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);

      console.log('[sync-categories] ✅ Categorias sincronizadas:', categoriasCache.length);

      // 4️⃣ Sincronizar a cada 30 segundos (detectar mudanças)
      setInterval(() => sincronizarCategoriasEmTempoReal(), 30000);
    } catch (err) {
      console.warn('[sync-categories] ⚠️ Erro:', err.message);
      console.log('[sync-categories] Usando categorias estáticas do arquivo JSON');
    }
  }

  // Iniciar sincronização ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sincronizarCategoriasEmTempoReal);
  } else {
    sincronizarCategoriasEmTempoReal();
  }

  // 🎯 Detectar cliques em links de categoria IMEDIATAMENTE
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Extrair slug da URL do link
    const href = link.getAttribute('href') || '';
    for (const cat of categoriasCache) {
      if (href.includes('/' + cat.slug + '/') || href.includes('?cat=' + cat.slug)) {
        // Aplicar imediatamente (antes da navegação completar)
        aplicarCategoriaAtiva(cat.slug);
        console.log('[sync-categories] 🔗 Clique em link de categoria:', cat.slug);
        break;
      }
    }

    // Sincronizar depois que a página carregar
    setTimeout(sincronizarCategoriasEmTempoReal, 100);
  });

  // Sincronizar quando navegação ocorre (botão voltar/avançar)
  window.addEventListener('popstate', () => {
    setTimeout(sincronizarCategoriasEmTempoReal, 50);
  });

  // Sincronizar a cada 30 segundos para detectar mudanças no painel
  setInterval(sincronizarCategoriasEmTempoReal, 30000);

  // Debug
  window.syncDebug = {
    forceSync: sincronizarCategoriasEmTempoReal,
    getActive: () => document.body.getAttribute('data-category'),
    getDetected: detectarCategoriaAtiva,
    getCategorias: () => categoriasCache
  };
})();
