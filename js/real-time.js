/**
 * Real-Time Updates — Recebe notificações do Painel DM via SSE
 */

export function initRealTime() {
  const apiBase = getApiBase();
  const eventSource = new EventSource(`${apiBase}/eventos`);

  console.log('📡 Conectando a atualizações em tempo real...');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data.tipo) return;

      console.log(`🔔 Evento: ${data.tipo}`, data);

      // Mapear eventos para tipos
      const isNoticia = data.tipo.includes('noticia') || data.tipo.includes('destaque') || data.tipo.includes('noticias-importadas');
      const isAnuncio = data.tipo.includes('anuncio');

      // Notificar UI sobre mudanças
      if (isNoticia) {
        document.dispatchEvent(new CustomEvent('noticia:atualizada', { detail: data }));
      } else if (isAnuncio) {
        document.dispatchEvent(new CustomEvent('anuncio:atualizado', { detail: data }));
      }

      // Recarregar página para mostrar notícias importadas
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Erro ao processar evento:', err);
    }
  };

  eventSource.onerror = () => {
    console.warn('⚠️ Conexão SSE perdida, reconectando...');
    eventSource.close();
    // Reconectar em 5 segundos
    setTimeout(initRealTime, 5000);
  };

  return eventSource;
}

// Obter URL base da API (mesmo do data.js)
function getApiBase() {
  const meta = document.querySelector('meta[name="painel-api"]');
  if (meta?.content) {
    const v = meta.content.replace(/\/+$/, '');
    return v;
  }
  if (location.hostname === 'localhost' && location.port === '8000') {
    return 'http://localhost:3000/api';
  }
  return '/api';
}

// ⚠️ SSE desabilitado — Endpoint /eventos não disponível
// Será implementado em versão futura
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', initRealTime);
// } else {
//   initRealTime();
// }
