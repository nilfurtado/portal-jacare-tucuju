/**
 * Server-Sent Events — Notifica Portal sobre mudanças em tempo real
 */

const express = require('express');
const router = express.Router();

// Clientes conectados ao SSE
const clientes = new Set();

// Armazenar último evento para novos clientes
let ultimoEvento = null;

/**
 * GET /eventos — Conectar ao stream de eventos
 * Cliente se conecta e recebe notificações em tempo real
 */
router.get('/', (req, res) => {
  // Headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Adicionar cliente à lista
  clientes.add(res);
  console.log(`📡 Cliente SSE conectado. Total: ${clientes.size}`);

  // Enviar último evento se existir
  if (ultimoEvento) {
    res.write(`data: ${JSON.stringify(ultimoEvento)}\n\n`);
  }

  // Heartbeat para manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Remover cliente ao desconectar
  req.on('close', () => {
    clientes.delete(res);
    clearInterval(heartbeat);
    console.log(`❌ Cliente SSE desconectado. Total: ${clientes.size}`);
  });
});

/**
 * Broadcast de evento para todos os clientes
 */
function broadcast(evento) {
  ultimoEvento = evento;
  const dados = `data: ${JSON.stringify(evento)}\n\n`;

  clientes.forEach(cliente => {
    try {
      cliente.write(dados);
    } catch (err) {
      clientes.delete(cliente);
    }
  });

  console.log(`📢 Evento broadcast: ${evento.tipo} (${clientes.size} clientes)`);
}

module.exports = router;
module.exports.broadcast = broadcast;
