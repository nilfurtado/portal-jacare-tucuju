// 🎨 Sistema de cores dinâmicas por categoria

async function carregarCoresCategorias() {
  try {
    // Carregar categorias ordenadas do painel-dm
    const res = await fetch('http://localhost:3000/api/categorias-export/json');
    const categorias = await res.json();
    
    // Criar mapa de cores
    const coresMap = {};
    categorias.forEach(cat => {
      coresMap[cat.slug] = cat.cor;
    });
    
    return coresMap;
  } catch (err) {
    console.warn('[category-colors] Erro ao carregar cores:', err.message);
    return {};
  }
}

function aplicarCorCategoria(slug, coresMap) {
  const cor = coresMap[slug] || '#FF8C00'; // fallback laranja

  // Aplicar cor ao header (classe .header)
  const header = document.querySelector('header.header') || document.querySelector('header');
  if (header) {
    header.style.borderBottomColor = cor;
    header.style.borderBottomWidth = '4px';
    console.log('[category-colors] ✅ Header border aplicado:', cor);
  } else {
    console.warn('[category-colors] ❌ Header não encontrado');
  }

  // Aplicar cor ao footer (classe .footer)
  const footer = document.querySelector('footer.footer') || document.querySelector('footer');
  if (footer) {
    footer.style.borderTopColor = cor;
    footer.style.borderTopWidth = '4px';
    console.log('[category-colors] ✅ Footer border aplicado:', cor);
  } else {
    console.warn('[category-colors] ❌ Footer não encontrado');
  }

  // Aplicar cor ao link ativo na navbar
  const navLinks = document.querySelectorAll('nav.nav a');
  navLinks.forEach(link => {
    const linkSlug = link.href.split('/categoria/')[1]?.split('/')[0] || '';
    if (linkSlug === slug) {
      link.style.borderBottomColor = cor;
      link.style.borderBottomWidth = '3px';
      link.style.color = cor;
      link.style.fontWeight = '600';
    } else {
      link.style.borderBottom = 'none';
      link.style.color = 'inherit';
      link.style.fontWeight = '400';
    }
  });

  // Aplicar CSS variável global
  document.documentElement.style.setProperty('--cat-active-color', cor);
  console.log('[category-colors] ✅ Cor de categoria aplicada:', slug, cor);
}

async function iniciarCoresDinamicas() {
  const coresMap = await carregarCoresCategorias();
  
  // Detectar categoria atual
  const url = window.location.href;
  const urlParts = url.split('/');
  const categorySlug = urlParts[urlParts.length - 2] || 'geral';
  
  aplicarCorCategoria(categorySlug, coresMap);
  
  // Observar mudanças de página
  window.addEventListener('popstate', () => {
    const novaUrl = window.location.href;
    const novaParts = novaUrl.split('/');
    const novaCategory = novaParts[novaParts.length - 2] || 'geral';
    aplicarCorCategoria(novaCategory, coresMap);
  });
}

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarCoresDinamicas);
} else {
  iniciarCoresDinamicas();
}
