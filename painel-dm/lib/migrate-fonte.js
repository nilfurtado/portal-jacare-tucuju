const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
  const db = new Database(dbPath);

  // Verificar se coluna já existe
  const columns = db.pragma('table_info(noticias)');
  const hasFont = columns.some(c => c.name === 'fonte');

  if (!hasFont) {
    console.log('✅ Adicionando coluna "fonte" à tabela noticias...');
    db.exec(`ALTER TABLE noticias ADD COLUMN fonte TEXT`);
    console.log('✅ Coluna adicionada com sucesso!');
  } else {
    console.log('✅ Coluna "fonte" já existe!');
  }

  db.close();
  process.exit(0);
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
