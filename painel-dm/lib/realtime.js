const { Server } = require('socket.io');

/**
 * Inicializa comunicação em tempo real com Socket.io
 */
function initRealtime(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Conexão de clientes
  io.on('connection', (socket) => {
    console.log(`[realtime] 🔌 Cliente conectado: ${socket.id}`);

    // Quando um cliente se junta a uma sala (ex: painel, portal)
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`[realtime] ✅ Cliente entrou na sala: ${room}`);
      io.to(room).emit('user-count', { count: io.sockets.adapter.rooms.get(room)?.size || 0 });
    });

    // Notificar alterações em categorias
    socket.on('update-categorias', (data) => {
      io.emit('categorias-updated', data);
      console.log(`[realtime] 📢 Categorias atualizadas`);
    });

    // Notificar nova notícia criada
    socket.on('noticia-criada', (data) => {
      io.emit('noticia-new', data);
      console.log(`[realtime] 📰 Nova notícia: ${data.titulo}`);
    });

    // Notificar alteração em notícia
    socket.on('noticia-alterada', (data) => {
      io.emit('noticia-updated', data);
      console.log(`[realtime] ✏️ Notícia alterada: ${data.id}`);
    });

    // Notificar exclusão de notícia
    socket.on('noticia-deletada', (data) => {
      io.emit('noticia-deleted', data);
      console.log(`[realtime] 🗑️ Notícia deletada: ${data.id}`);
    });

    // Ping-Pong para manter conexão viva
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Desconexão
    socket.on('disconnect', () => {
      console.log(`[realtime] ❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emite evento em tempo real para todos os clientes
 */
function emitToAll(io, event, data) {
  io.emit(event, data);
}

/**
 * Emite evento para uma sala específica
 */
function emitToRoom(io, room, event, data) {
  io.to(room).emit(event, data);
}

module.exports = {
  initRealtime,
  emitToAll,
  emitToRoom
};
