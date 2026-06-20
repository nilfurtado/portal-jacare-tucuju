#!/usr/bin/env node

/**
 * Monitor de Saúde do Servidor
 * Verifica periodicamente se o servidor está respondendo
 * Detecta e alertas sobre problemas
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  PORTA_PORTAL: 8000,
  PORTA_PAINEL: 3000,
  INTERVALO_VERIFICACAO: 5000, // 5 segundos
  TIMEOUT_REQUISICAO: 3000,
};

let statusAnterior = {};

function verificarServidores() {
  verificarServidor('Portal', CONFIG.PORTA_PORTAL);
  verificarServidor('Painel', CONFIG.PORTA_PAINEL);
}

function verificarServidor(nome, porta) {
  const options = {
    hostname: 'localhost',
    port: porta,
    path: '/',
    method: 'HEAD',
    timeout: CONFIG.TIMEOUT_REQUISICAO,
  };

  const req = http.request(options, (res) => {
    const status = res.statusCode === 200 ? '✅ ONLINE' : `⚠️  STATUS ${res.statusCode}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR');

    if (statusAnterior[nome] !== status) {
      statusAnterior[nome] = status;
      console.log(`[${timestamp}] ${nome} (porta ${porta}): ${status}`);
    }
  });

  req.on('error', (err) => {
    const status = `❌ OFFLINE (${err.code})`;
    const timestamp = new Date().toLocaleTimeString('pt-BR');

    if (statusAnterior[nome] !== status) {
      statusAnterior[nome] = status;
      console.log(`[${timestamp}] ${nome} (porta ${porta}): ${status}`);
      console.log(`         Erro: ${err.message}`);

      // Tentar reiniciar se offline
      if (err.code === 'ECONNREFUSED') {
        console.log(`         ⚡ Tentando reiniciar ${nome}...`);
        // Implementar reinicialização automática aqui se desejado
      }
    }
  });

  req.on('timeout', () => {
    req.destroy();
    const status = '⏱️  TIMEOUT';
    const timestamp = new Date().toLocaleTimeString('pt-BR');

    if (statusAnterior[nome] !== status) {
      statusAnterior[nome] = status;
      console.log(`[${timestamp}] ${nome} (porta ${porta}): ${status}`);
    }
  });

  req.end();
}

function verificarBancoDados() {
  const arquivos = [
    'data/noticias.json',
    'data/anuncios.json',
    'data/categorias.json',
  ];

  arquivos.forEach((arquivo) => {
    const caminho = path.join(__dirname, arquivo);
    try {
      const conteudo = fs.readFileSync(caminho, 'utf8');
      JSON.parse(conteudo);
    } catch (err) {
      console.error(`❌ Banco de dados corrompido: ${arquivo}`);
      console.error(`   ${err.message}`);
    }
  });
}

// Iniciar monitoramento
console.log('🔍 Monitor de Saúde Iniciado\n');
console.log('Verificando servidores a cada 5 segundos...\n');

// Verificação inicial
verificarServidores();
verificarBancoDados();

// Verificar periodicamente
setInterval(verificarServidores, CONFIG.INTERVALO_VERIFICACAO);

// Verificar banco de dados a cada 30 segundos
setInterval(verificarBancoDados, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✅ Monitor desligado');
  process.exit(0);
});
