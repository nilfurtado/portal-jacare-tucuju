/**
 * ads-loader.js - Sistema de carregamento de anúncios
 * Carrega anúncios do /api/portal/bootstrap e injeta no DOM
 */

(async function() {
  try {
    // 1. Carregar bootstrap
    const res = await fetch('/api/portal/bootstrap');
    const data = await res.json();
    
    if (!data.anuncios || data.anuncios.length === 0) {
      console.warn('[ads-loader] Nenhum anúncio no bootstrap');
      return;
    }
    
    console.log('[ads-loader] Carregados:', data.anuncios.length, 'anúncios');
    
    // 2. Processar cada anúncio
    data.anuncios.forEach(ad => {
      if (!ad.ativo) return;
      
      // Parsear campos JSON se forem strings
      const criativo = typeof ad.criativo === 'string' ? JSON.parse(ad.criativo) : ad.criativo;
      const paginas = typeof ad.paginas === 'string' ? JSON.parse(ad.paginas) : ad.paginas;
      
      // Verificar se deve renderizar nesta página
      const pageOK = paginas.includes('*') || paginas.includes(window.location.pathname);
      if (!pageOK) return;
      
      // 3. Renderizar anúncio no slot correto
      renderAd(ad, criativo);
    });
    
  } catch (err) {
    console.error('[ads-loader] Erro ao carregar anúncios:', err);
  }
})();

function renderAd(ad, criativo) {
  try {
    // Encontrar slot baseado no tipo (data-ad-type ou data-ad-slot)
    let slot = document.querySelector(`[data-ad-type="${ad.tipo}"]`);
    if (!slot) {
      slot = document.querySelector(`[data-ad-slot="${ad.tipo}"]`);
    }
    if (!slot) {
      console.warn('[ads-loader] Slot não encontrado para tipo:', ad.tipo);
      return;
    }

    // Encontrar container dentro do slot (pode estar aninhado)
    const container = slot.querySelector('.banner-ad, .ad-popup__content, [class*="ad"]') || slot;

    // Renderizar imagem
    let html = '';
    if (criativo.imagem) {
      html = `<img src="${criativo.imagem}" alt="${criativo.titulo || 'Anúncio'}" style="max-width:100%; height:auto; display:block;">`;
    } else if (criativo.html) {
      html = criativo.html;
    }

    // Envolver em link se tiver destino
    if (ad.destino) {
      html = `<a href="${ad.destino}" target="_blank" style="display:block;">${html}</a>`;
    }

    container.innerHTML = html;

    // Ativar o slot para ficar visível
    slot.setAttribute('data-ad-active', 'true');

    console.log('[ads-loader] ✅ Anúncio renderizado:', ad.nome, 'em', ad.tipo);
    
  } catch (err) {
    console.error('[ads-loader] Erro ao renderizar:', err);
  }
}
