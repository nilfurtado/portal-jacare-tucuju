const fs = require('fs');
const path = require('path');
const DB = require('better-sqlite3');

/**
 * Sincroniza dados do SQLite para JSON
 * @param {string} dbPath - Caminho do banco SQLite
 * @param {string} table - Nome da tabela
 * @param {string} jsonPath - Caminho do arquivo JSON
 * @param {object} options - { orderBy, transform }
 */
function syncToJson(dbPath, table, jsonPath, options = {}) {
  try {
    const db = new DB(dbPath);
    
    // Ler dados do banco
    let query = `SELECT * FROM ${table}`;
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }
    
    const rows = db.prepare(query).all();
    
    // Transformar se necessário
    const data = options.transform ? rows.map(options.transform) : rows;
    
    // Garantir diretório existe
    const dir = path.dirname(jsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Salvar JSON
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    
    console.log(`[sync-db-json] ✅ ${table} → ${jsonPath} (${data.length} registros)`);
    
    db.close();
    return true;
  } catch (err) {
    console.error(`[sync-db-json] ❌ Erro ao sincronizar ${table}:`, err.message);
    return false;
  }
}

/**
 * Sincroniza todas as tabelas importantes
 */
function syncAllTables() {
  console.log('[sync-db-json] 🔄 Iniciando sincronização completa...');
  
  const dbPath = './data/painel.db';
  const tables = [
    {
      name: 'categorias',
      jsonPath: '../data/categorias.json',
      options: {
        orderBy: 'nome',
        transform: (row) => ({
          id: row.id,
          nome: row.nome,
          label: row.nome,
          slug: row.slug,
          cor: row.cor,
          descricao: row.descricao
        })
      }
    },
    {
      name: 'noticias',
      jsonPath: '../data/noticias.json',
      options: {
        orderBy: 'id DESC',
        transform: (row) => ({
          ...row,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
          capa: row.capa ? JSON.parse(row.capa) : null
        })
      }
    },
    {
      name: 'usuarios',
      jsonPath: '../data/usuarios.json',
      options: { orderBy: 'id' }
    },
    {
      name: 'anuncios',
      jsonPath: '../data/anuncios.json',
      options: { orderBy: 'id DESC' }
    }
  ];
  
  let sucessos = 0;
  for (const table of tables) {
    if (syncToJson(dbPath, table.name, table.jsonPath, table.options)) {
      sucessos++;
    }
  }
  
  console.log(`[sync-db-json] ✅ Sincronização completa: ${sucessos}/${tables.length} tabelas`);
  return sucessos === tables.length;
}

module.exports = {
  syncToJson,
  syncAllTables
};
