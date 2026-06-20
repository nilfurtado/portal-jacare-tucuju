const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'painel.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('\n🔍 VERIFICAÇÃO DE CAMPOS CRÍTICOS:');
  
  // Verificar notícias com autor
  const noticiasComAutor = db.prepare('SELECT COUNT(*) as cnt FROM noticias WHERE autor IS NOT NULL AND LENGTH(TRIM(autor)) > 0').get().cnt;
  const totalNoticias = db.prepare('SELECT COUNT(*) as cnt FROM noticias').get().cnt;
  console.log(`   Notícias com autor: ${noticiasComAutor}/${totalNoticias}`);
  
  // Verificar anúncios ativos
  const anunciosAtivos = db.prepare('SELECT COUNT(*) as cnt FROM anuncios WHERE ativo = 1').get().cnt;
  const totalAnuncios = db.prepare('SELECT COUNT(*) as cnt FROM anuncios').get().cnt;
  console.log(`   Anúncios ativos: ${anunciosAtivos}/${totalAnuncios}`);
  
  // Verificar usuários
  const usuarios = db.prepare('SELECT COUNT(*) as cnt FROM usuarios WHERE email IS NOT NULL').get().cnt;
  console.log(`   Usuários válidos: ${usuarios}`);
  
  // Verificar categorias
  const categorias = db.prepare('SELECT COUNT(*) as cnt FROM categorias').get().cnt;
  console.log(`   Categorias: ${categorias}`);
  
  // 5. Últimas operações
  console.log('\n⏰ ÚLTIMAS MODIFICAÇÕES:');
  const lastNews = db.prepare('SELECT titulo, criadoEm FROM noticias ORDER BY criadoEm DESC LIMIT 1').get();
  if (lastNews) {
    console.log(`   Última notícia: ${lastNews.titulo}`);
    console.log(`   Data: ${new Date(lastNews.criadoEm).toLocaleString('pt-BR')}`);
  }
  
  const lastAd = db.prepare('SELECT nome, id FROM anuncios ORDER BY id DESC LIMIT 1').get();
  if (lastAd) {
    console.log(`   Último anúncio: ${lastAd.nome}`);
  }
  
  console.log('\n✅ Verificação concluída com sucesso!\n');
  
  db.close();
  
} catch (err) {
  console.error('❌ Erro:', err.message);
}
