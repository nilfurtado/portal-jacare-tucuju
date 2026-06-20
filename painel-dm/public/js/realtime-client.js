/**
 * Cliente Socket.io para comunicação em tempo real
 */

// Detectar porta dinâmica
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.hostname;
const port = window.location.port;
const socketUrl = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;

// Conectar ao servidor
const socket = io(socketUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Eventos de conexão
socket.on('connect', () => {
  console.log('[realtime] ✅ Conectado ao servidor em tempo real');
  document.body.classList.add('online');
  
  // Entrar na sala padrão
  const room = document.body.dataset.room || 'painel';
  socket.emit('join-room', room);
});

socket.on('disconnect', () => {
  console.log('[realtime] ❌ Desconectado do servidor');
  document.body.classList.remove('online');
});

socket.on('connect_error', (error) => {
  console.error('[realtime] ⚠️ Erro de conexão:', error);
});

// Ping-pong para manter conexão viva
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000);

socket.on('pong', () => {
  console.log('[realtime] 💓 Pong recebido');
});

// Eventos de atualização em tempo real
socket.on('categorias-updated', (data) => {
  console.log('[realtime] 📢 Categorias atualizadas!', data);
  // Recarregar categorias se houver select
  const catSel = document.getElementById('categoria');
  if (catSel) {
    location.reload();
  }
});

socket.on('noticia-new', (data) => {
  console.log('[realtime] 📰 Nova notícia criada!', data);
  // Notificar usuário
  if (typeof toast === 'function') {
    toast('Nova notícia publicada! 📰', 'info');
  }
});

socket.on('noticia-updated', (data) => {
  console.log('[realtime] ✏️ Notícia alterada!', data);
  // Notificar usuário
  if (typeof toast === 'function') {
    toast('Notícia atualizada! ✏️', 'info');
  }
});

socket.on('noticia-deleted', (data) => {
  console.log('[realtime] 🗑️ Notícia deletada!', data);
  // Notificar usuário
  if (typeof toast === 'function') {
    toast('Notícia removida! 🗑️', 'info');
  }
});

// Status de conexão na interface
socket.on('user-count', (data) => {
  const statusEl = document.getElementById('realtime-status');
  if (statusEl) {
    statusEl.textContent = `${data.count} usuário(s) online`;
  }
});

console.log('[realtime] 🚀 Cliente de tempo real carregado');
