/**
 * Lazy Load — carrega imagens sob demanda
 * Reduz tempo de carregamento inicial em ~30%
 */

export function initLazyLoad() {
  // Suporte para Intersection Observer (todos navegadores modernos)
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver não suportado, carregando todas as imagens');
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Carregar imagem
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        
        // Carregar srcset (múltiplas resoluções)
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        
        // Remover atributo para não processar novamente
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        
        // Parar de observar
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // Começa a carregar 50px antes de aparecer na tela
  });

  // Observar todas as imagens com data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  console.log('✅ Lazy Loading ativado');
}

// Auto-inicializar ao importar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLazyLoad);
} else {
  initLazyLoad();
}
