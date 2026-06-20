const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'painel.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('✅ Banco conectado com sucesso\n');
  
  // 1. Listar tabelas
  console.log('📊 TABELAS EXISTENTES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  tables.forEach(t => console.log(`   • ${t.name}`));
  
  console.log('\n📈 CONTAGEM DE REGISTROS:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table.name}`).get().cnt;
    console.log(`   ${table.name.padEnd(20)}: ${count.toString().padStart(4)} registros`);
  });
  
  // 2. Verificar integridade
  console.log('\n🔐 INTEGRIDADE DO BANCO:');
  const integrity = db.prepare('PRAGMA integrity_check').all();
  if (integrity[0].integrity_check === 'ok') {
    console.log('   ✅ Banco íntegro - sem erros detectados');
  } else {
    console.log('   ❌ ERROS ENCONTRADOS:');
    integrity.forEach(e => console.log(`      ${e.integrity_check}`));
  }
  
  // 3. Info do banco
  console.log('\n📋 INFORMAÇÕES DO BANCO:');
  const pageCount = db.prepare('PRAGMA page_count').get().page_count;
  const pageSize = db.prepare('PRAGMA page_size').get().page_size;
  const journalMode = db.prepare('PRAGMA journal_mode').get().journal_mode;
  
  console.log(`   • Modo journal: ${journalMode}`);
  console.log(`   • Tamanho página: ${pageSize} bytes`);
  console.log(`   • Total de páginas: ${pageCount}`);
  console.log(`   • Tamanho total: ~${(pageCount * pageSize / 1024 / 1024).toFixed(2)} MB`);
  
  // 4. Verificar campos críticos
  console.log('\n🔍 VERIFICAÇÃO DE CAMPOS CRÍTICOS:');
  
  // Verificar notícias com autor
  const noticiasComAutor = db.prepare('SELECT COUNT(*) as cnt FROM noticias WHERE autor IS NOT NULL AND autor != ""').get().cnt;
  const totalNoticias = db.prepare('SELECT COUNT(*) as cnt FROM noticias').get().cnt;
  console.log(`   Notícias com autor: ${noticiasComAutor}/${totalNoticias}`);
  
  // Verificar anúncios ativos
  const anunciosAtivos = db.prepare('SELECT COUNT(*) as cnt FROM anuncios WHERE ativo = 1').get().cnt;
  const totalAnuncios = db.prepare('SELECT COUNT(*) as cnt FROM anuncios').get().cnt;
  console.log(`   Anúncios ativos: ${anunciosAtivos}/${totalAnuncios}`);
  
  // Verificar usuários
  const usuarios = db.prepare('SELECT COUNT(*) as cnt FROM usuarios WHERE email IS NOT NULL').get().cnt;
  console.log(`   Usuários válidos: ${usuarios}`);
  
  // 5. Últimas operações
  console.log('\n⏰ ÚLTIMAS MODIFICAÇÕES:');
  const lastNews = db.prepare('SELECT titulo, criadoEm FROM noticias ORDER BY criadoEm DESC LIMIT 1').get();
  if (lastNews) {
    console.log(`   Última notícia: ${lastNews.titulo}`);
    console.log(`   Data: ${new Date(lastNews.criadoEm).toLocaleString('pt-BR')}`);
  }
  
  db.close();
  
} catch (err) {
  console.error('❌ Erro ao verificar banco:', err.message);
  process.exit(1);
}
