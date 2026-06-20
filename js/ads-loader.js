/**
 * ADS LOADER — Carrega e exibe anúncios otimizados
 *
 * Estratégia:
 *   1. Lê data/anuncios.json (fallback estático)
 *   2. Injetar imagens com Picture tag (WebP + JPEG fallback)
 *   3. Error handler para 404/timeout
 *   4. Registra impressão/clique via analytics
 *   5. SSE para atualizações em tempo real
 */
// Aguardar DOM pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  // Base da API do painel (usa meta-tag ou localhost:3000)
  function apiBase() {
    const meta = document.querySelector('meta[name="painel-api"]');
    if (meta?.content) {
      return meta.content.replace(/\/+$/, '');
    }
    if (location.hostname === 'localhost' && location.port === '8000') {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }

  // Base das imagens (usa painel ou relativa)
  function imgBase() {
    if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port === '8000') {
      return 'http://localhost:3000';
    }
    return '';
  }

  let anuncios = [];
  // 1) carregar anúncios do JSON estático
  try {
    const res = await fetch('data/anuncios.json', { cache: 'no-cache' });
    if (res.ok) {
      anuncios = await res.json();
      console.log('✅ Anúncios carregados:', anuncios.length);
    }
  } catch (err) {
    console.warn('[ads-loader] Erro ao carregar anúncios:', err.message);
    return;
  }

  const agora = Date.now();
  const noPeriodo = (p) => {
    if (!p) return true;
    const ini = p.inicio ? new Date(p.inicio).getTime() : -Infinity;
    const fim = p.fim    ? new Date(p.fim).getTime()    : Infinity;
    return agora >= ini && agora <= fim;
  };

  // Procurar por ambos: data-ad-slot (antigo) e data-ad-type (novo)
  const slots = document.querySelectorAll('[data-ad-slot], [data-ad-type]');
  console.log('✅ Anúncios carregados: ' + anuncios.length + ', Slots encontrados: ' + slots.length);

  // 2) Injetar anúncios nos slots
  slots.forEach(slot => {
    const slotName = slot.getAttribute('data-ad-slot') || slot.getAttribute('data-ad-type');
    const ad = anuncios.find(a => a.tipo === slotName && noPeriodo(a.periodo));
    if (!ad) return;

    // Pular anúncios rotativo (renderizados pelo ads-rotator.js)
    let criativo = ad.criativo;
    if (typeof criativo === 'string') {
      try {
        criativo = JSON.parse(criativo);
      } catch (e) {
        criativo = {};
      }
    }
    if (criativo.modo === 'rotativo') {
      console.log('[ads-loader] ⏭️ Pulando anúncio rotativo:', ad.tipo, '(renderizado por ads-rotator)');
      return;
    }

    if (criativo.tipo === 'html') {
      slot.innerHTML = criativo.html;
      return;
    }

    if (criativo.tipo !== 'imagem') return;
    const { url, webp, alt } = criativo;
    const img = document.createElement('picture');
    const base = imgBase();
    const webpSrc = webp ? (base + webp) : null;
    const jpgSrc = base + url;
    if (webpSrc) img.innerHTML = `<source type="image/webp" srcset="${webpSrc}">`;
    const inner = document.createElement('img');
    inner.src = jpgSrc;
    inner.alt = alt || '';
    inner.addEventListener('click', () => window.location.href = ad.linkDestino);
    inner.style.cursor = 'pointer';
    img.appendChild(inner);
    slot.appendChild(img);
  });

  // 3) error handler
  window.addEventListener('error', (e) => {
    if (!e.message) return;
    const match = e.message.match(/\/anuncios\/(\d+)\//);
    if (match) {
      const id = match[1];
      const inner = document.querySelector(`img[src*="/anuncios/${id}/"]`)?.parentElement;
      if (inner) inner.innerHTML = '';
    }
  }, true);

  // 4) Registra cliques
  document.addEventListener('click', (e) => {
    const slot = e.target.closest('[data-ad-slot]');
    if (slot) {
      const name = slot.getAttribute('data-ad-slot');
      console.log('[ads-analytics] Clique em:', name);
    }
  });

  // 5) SSE listener (temporariamente desabilitado)
  // TODO: Corrigir MIME type issue - EventSource recebe application/octet-stream
  // console.log('[ads-loader] SSE desabilitado temporariamente');

  /*
  try {
    const apiURL = apiBase();
    let sseUrl = apiURL.replace(/\/api$/, '') + '/api/eventos';
    console.log('📡 Criando EventSource para:', sseUrl);
    const sse = new EventSource(sseUrl);

    sse.addEventListener('message', (event) => {
      try {
        const dados = JSON.parse(event.data);
        if (dados.tipo === 'anunciosAtualizados') {
          console.log('🔄 Anúncios atualizados via SSE:', dados.acao);
        }
      } catch (e) {}
    });

    sse.addEventListener('error', (e) => {
      console.warn('❌ SSE error:', e);
      sse.close();
    });
  } catch (err) {
    console.warn('[ads-loader] SSE error:', err.message);
  }
  */
}
