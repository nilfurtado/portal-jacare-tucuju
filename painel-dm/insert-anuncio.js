const db = require('./lib/db');

const stmt = db.prepare(\
  INSERT INTO anuncios (nome, tipo, local, paginas, ativo, criativo, destino, periodo, historico, criadoEm)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
\);

const result = stmt.run(
  'Anúncio de Teste - Portal',
  'super-banner',
  10,
  JSON.stringify(['*']),
  1,
  JSON.stringify({
    imagem: '/img/uploads/anuncio-1-principal.jpg',
    imagemWebp: null,
    html: null,
    titulo: 'Anúncio de Teste'
  }),
  'https://portal.exemplo.com.br',
  JSON.stringify({ inicio: null, fim: null }),
  JSON.stringify([{
    data: new Date().toISOString(),
    campo: 'criacao',
    antes: null,
    depois: 'Anúncio criado',
    usuario: 'admin'
  }]),
  new Date().toISOString()
);

console.log('✅ Anúncio inserido:', result.lastInsertRowid);

// Sincronizar para JSON
const { syncAnunciosToJson } = require('./lib/sync-anuncios');
syncAnunciosToJson().then(r => {
  console.log('✅ Sincronizado:', r.total, 'anúncios');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
