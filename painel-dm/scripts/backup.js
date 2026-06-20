#!/usr/bin/env node

const {
  criarBackup,
  listarBackups,
  restaurarBackup,
  deletarBackup,
  limparBackupsAntigos,
  agendarBackupAutomatico
} = require('../lib/backup');

const command = process.argv[2];
const arg = process.argv[3];

async function executar() {
  try {
    switch (command) {
      case 'criar':
        console.log('📦 Criando backup...');
        const arquivo = await criarBackup();
        limparBackupsAntigos(10);
        console.log(`✅ Backup criado: ${arquivo}`);
        break;

      case 'listar':
        const backups = listarBackups();
        console.log('\n📋 Backups disponíveis:\n');
        backups.forEach((b, i) => {
          const data = new Date(b.data).toLocaleString('pt-BR');
          console.log(`${i + 1}. ${b.nome}`);
          console.log(`   Tamanho: ${b.tamanho}`);
          console.log(`   Data: ${data}\n`);
        });
        console.log(`Total: ${backups.length} backup(s)`);
        break;

      case 'restaurar':
        if (!arg) {
          console.error('❌ Informe o nome do backup: backup.js restaurar <arquivo>');
          process.exit(1);
        }
        console.log(`🔄 Restaurando ${arg}...`);
        const backupPath = require('path').join(
          require('path').dirname(__dirname),
          'backups',
          arg
        );
        await restaurarBackup(backupPath);
        console.log('✅ Backup restaurado com sucesso');
        break;

      case 'deletar':
        if (!arg) {
          console.error('❌ Informe o nome do backup: backup.js deletar <arquivo>');
          process.exit(1);
        }
        const delPath = require('path').join(
          require('path').dirname(__dirname),
          'backups',
          arg
        );
        deletarBackup(delPath);
        console.log('✅ Backup deletado');
        break;

      case 'limpar':
        const keep = arg ? parseInt(arg) : 10;
        console.log(`🧹 Limpando backups antigos (mantendo ${keep})...`);
        limparBackupsAntigos(keep);
        console.log('✅ Limpeza concluída');
        break;

      case 'agendar':
        const horas = arg ? parseInt(arg) : 24;
        agendarBackupAutomatico(horas);
        console.log(`📅 Backup automático iniciado (a cada ${horas} hora(s))`);
        // Manter o processo rodando
        setInterval(() => {}, 1000);
        break;

      default:
        console.log(`
📦 Sistema de Backup - Painel DM

Comandos:
  criar              Criar novo backup
  listar             Listar backups disponíveis
  restaurar <arq>    Restaurar backup
  deletar <arq>      Deletar backup
  limpar [qtd]       Limpar backups antigos (padrão: manter 10)
  agendar [horas]    Agendar backup automático (padrão: 24 horas)

Exemplos:
  node backup.js criar
  node backup.js listar
  node backup.js restaurar backup-2026-06-10T12-30-45-123Z.zip
  node backup.js deletar backup-2026-06-10T12-30-45-123Z.zip
  node backup.js limpar 5
  node backup.js agendar 24
        `);
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

executar();
