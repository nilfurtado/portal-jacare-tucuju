/**
 * Sincronização: SQLite → JSON
 * Exporta enquetes do SQLite para JSON do Portal
 */
const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');

async function syncEnquetes() {
  try {
    // Conectar ao SQLite
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    // Ler enquetes do SQLite
    const enquetesStmt = db.prepare(`
      SELECT
        id, pergunta, ativa,
        criadoEm
      FROM enquetes
      ORDER BY id DESC
    `);

    const enquetes = enquetesStmt.all();

    // Ler opções de cada enquete
    const opcoesStmt = db.prepare(`
      SELECT id, opcao as label, votos
      FROM enquete_opcoes
      WHERE enqueteId = ?
      ORDER BY id
    `);

    // Processar enquetes com suas opções
    const enquetesFormatadas = enquetes.map(e => {
      const opcoes = opcoesStmt.all(e.id);
      return {
        id: String(e.id),
        pergunta: e.pergunta,
        ativa: Boolean(e.ativa),
        opcoes: opcoes.map(opt => ({
          id: String(opt.id),
          label: opt.label,
          votos: opt.votos || 0
        })),
        criadoEm: e.criadoEm || new Date().toISOString()
      };
    });

    // Salvar em JSON
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'enquetes.json');
    await fs.writeFile(jsonPath, JSON.stringify(enquetesFormatadas, null, 2), 'utf-8');

    db.close();

    console.log(`✅ Sincronização enquetes: ${enquetesFormatadas.length} enquetes exportadas`);
    return { success: true, total: enquetesFormatadas.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar enquetes:', err.message);
    return { success: false, erro: err.message };
  }
}

module.exports = { syncEnquetes };
