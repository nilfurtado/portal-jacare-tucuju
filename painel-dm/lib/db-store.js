/**
 * Store: leitura e escrita usando SQLite em vez de JSON
 * Interface compatível com JSON store anterior
 */
const db = require('./db');

/**
 * Mapeia nome do JSON para tabela SQLite
 */
function getTable(name) {
  const tables = {
    'usuarios': 'usuarios',
    'noticias': 'noticias',
    'categorias': 'categorias',
    'municipios': 'municipios',
    'videos': 'videos',
    'enquetes': 'enquetes',
    'paginas': 'paginas',
    'comentarios': 'comentarios',
  };
  return tables[name.replace('.json', '')] || null;
}

/**
 * Lê todos os registros de uma tabela
 */
async function read(name, fallback = []) {
  const table = getTable(name);
  if (!table) return fallback;

  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();

    // Desserializa campos JSON
    return rows.map(row => {
      if (row.tags && typeof row.tags === 'string') {
        try { row.tags = JSON.parse(row.tags); } catch { }
      }
      if (row.permissoes && typeof row.permissoes === 'string') {
        try { row.permissoes = JSON.parse(row.permissoes); } catch { }
      }
      return row;
    });
  } catch (err) {
    console.error(`Erro ao ler ${table}:`, err.message);
    return fallback;
  }
}

/**
 * Escreve/substitui todos os registros de uma tabela
 * Nota: Para compatibilidade com store JSON, isso limpa e reinsere
 */
async function write(name, data) {
  const table = getTable(name);
  if (!table) return data;

  try {
    // Limpa tabela
    db.prepare(`DELETE FROM ${table}`).run();

    // Reinsere dados
    if (!Array.isArray(data)) data = [data];

    for (const item of data) {
      insertOrUpdate(table, item);
    }
    return data;
  } catch (err) {
    console.error(`Erro ao escrever ${table}:`, err.message);
    throw err;
  }
}

/**
 * Atualiza com função (compatível com store JSON)
 */
async function update(name, fn, fallback = []) {
  const table = getTable(name);
  if (!table) return fallback;

  try {
    const current = await read(name, fallback);
    const next = await fn(current);
    return await write(name, next);
  } catch (err) {
    console.error(`Erro ao atualizar ${table}:`, err.message);
    throw err;
  }
}

/**
 * Helper para inserir ou atualizar registro
 */
function insertOrUpdate(table, item) {
  if (!item.id) item.id = null; // deixa auto-increment decidir

  // Serializa campos JSON
  const record = { ...item };
  if (record.tags && typeof record.tags === 'object') {
    record.tags = JSON.stringify(record.tags);
  }
  if (record.permissoes && typeof record.permissoes === 'object') {
    record.permissoes = JSON.stringify(record.permissoes);
  }

  const cols = Object.keys(record);
  const vals = cols.map(() => '?').join(',');
  const placeholders = cols.join(',');

  const sql = `INSERT OR REPLACE INTO ${table} (${placeholders}) VALUES (${vals})`;
  const stmt = db.prepare(sql);
  stmt.run(...Object.values(record));
}

/**
 * Queries diretas (helpers específicas)
 */
const queries = {
  /**
   * Busca usuário por email (case-insensitive)
   */
  findUserByEmail(email) {
    const row = db.prepare(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)`).get(email);
    if (row && row.permissoes) {
      try { row.permissoes = JSON.parse(row.permissoes); } catch { }
    }
    return row;
  },

  /**
   * Busca usuário por nome (case-insensitive)
   */
  findUserByName(name) {
    const row = db.prepare(`SELECT * FROM usuarios WHERE LOWER(nome) = LOWER(?)`).get(name);
    if (row && row.permissoes) {
      try { row.permissoes = JSON.parse(row.permissoes); } catch { }
    }
    return row;
  },

  /**
   * Busca notícia por slug
   */
  findNewsBySlug(slug) {
    const row = db.prepare(`SELECT * FROM noticias WHERE slug = ?`).get(slug);
    if (row && row.tags) {
      try { row.tags = JSON.parse(row.tags); } catch { }
    }
    return row;
  },

  /**
   * Conta registros de uma tabela
   */
  count(table) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    return row?.count || 0;
  },
};

module.exports = { read, write, update, queries, db };
