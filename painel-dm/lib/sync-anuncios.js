/**
 * Sincronização: SQLite → JSON para Anúncios
 * + Renomeação de imagens temp-id → id real
 * + Reconstrução de objeto criativo estruturado
 */
const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');
const { syncAnunciosImages } = require('./sync-anuncios-images');

async function syncAnunciosToJson() {
  try {
    // Conectar ao SQLite
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    // Ler anúncios do SQLite
    const stmt = db.prepare(`
      SELECT
        id, nome, tipo, local, paginas, ativo, criativo,
        destino, periodo, impressoes, cliques, historico,
        criadoEm, atualizadoEm
      FROM anuncios
      ORDER BY id DESC
    `);

    const anunciosRaw = stmt.all();

    // Processar dados
    const anuncios = anunciosRaw.map(a => ({
      id: a.id,
      nome: a.nome,
      tipo: a.tipo,
      local: a.local,
      paginas: typeof a.paginas === 'string' ? JSON.parse(a.paginas || '["*"]') : a.paginas || ['*'],
      ativo: Boolean(a.ativo),
      criativo: typeof a.criativo === 'string' ? JSON.parse(a.criativo || '{}') : a.criativo || {},
      destino: a.destino || null,
      periodo: typeof a.periodo === 'string' ? JSON.parse(a.periodo || '{"inicio":null,"fim":null}') : a.periodo || { inicio: null, fim: null },
      impressoes: Number(a.impressoes) || 0,
      cliques: Number(a.cliques) || 0,
      historico: typeof a.historico === 'string' ? JSON.parse(a.historico || '[]') : a.historico || [],
      criadoEm: a.criadoEm || new Date().toISOString(),
      atualizadoEm: a.atualizadoEm
    }));

    console.log(`📝 Sincronizando ${anuncios.length} anúncios...`);

    // Sincronizar imagens PRIMEIRO (renomear temp-ids para ids reais)
    console.log(`🔄 Renomeando imagens temp-id...`);
    await syncAnunciosImages(anuncios);

    // Reconstruir objeto criativo com estrutura correta para o portal
    const anunciosFormatados = anuncios.map(a => {
      const criativoReconstruido = a.criativo || {};

      // Garantir estrutura correta do criativo
      if (criativoReconstruido.imagem) {
        criativoReconstruido.imagem = criativoReconstruido.imagem;
      }
      if (criativoReconstruido.imagemWebp) {
        criativoReconstruido.imagemWebp = criativoReconstruido.imagemWebp;
      }
      criativoReconstruido.titulo = criativoReconstruido.titulo || a.nome;
      criativoReconstruido.html = criativoReconstruido.html || null;

      return {
        id: a.id,
        nome: a.nome,
        tipo: a.tipo,
        local: a.local,
        paginas: a.paginas,
        ativo: a.ativo,
        criativo: criativoReconstruido,
        destino: a.destino,
        periodo: a.periodo,
        impressoes: a.impressoes,
        cliques: a.cliques,
        criadoEm: a.criadoEm,
        atualizadoEm: a.atualizadoEm
      };
    });

    // Salvar em JSON
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'anuncios.json');
    await fs.writeFile(jsonPath, JSON.stringify(anunciosFormatados, null, 2), 'utf-8');

    db.close();

    console.log(`✅ Sincronização anúncios: ${anunciosFormatados.length} exportados para JSON`);
    console.log(`   📁 Arquivo: ${jsonPath}`);
    return { success: true, total: anunciosFormatados.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar anúncios:', err.message);
    return { success: false, erro: err.message };
  }
}

module.exports = { syncAnunciosToJson };
