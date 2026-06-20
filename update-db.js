const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'painel-dm/data/painel.db');
const db = new Database(dbPath);

// Atualizar ordem das categorias
const updates = [
  { slug: 'poltica', ordem: 1, label: 'Política' },
  { slug: 'policia', ordem: 2, label: 'Polícia' },
  { slug: 'economia', ordem: 3, label: 'Economia' },
  { slug: 'educacao', ordem: 4, label: 'Educação' },
  { slug: 'esporte', ordem: 5, label: 'Esporte' },
  { slug: 'cultura', ordem: 6, label: 'Cultura' },
  { slug: 'seguranca', ordem: 7, label: 'Segurança' },
  { slug: 'saude', ordem: 8, label: 'Saúde' },
  { slug: 'tecnologia', ordem: 9, label: 'Tecnologia' },
  { slug: 'meio-ambiente', ordem: 10, label: 'Meio Ambiente' },
  { slug: 'opinio', ordem: 11, label: 'Opinião' },
  { slug: 'geral', ordem: 12, label: 'Geral' }
];

updates.forEach(u => {
  try {
    const stmt = db.prepare('UPDATE categorias SET ordem = ?, nome = ? WHERE slug = ?');
    stmt.run(u.ordem, u.label, u.slug);
    console.log(`✅ ${u.label}: ordem ${u.ordem}`);
  } catch (err) {
    console.error(`❌ ${u.slug}:`, err.message);
  }
});

db.close();
console.log('\n✅ Banco de dados atualizado!');
