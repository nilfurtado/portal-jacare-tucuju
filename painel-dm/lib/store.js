/**
 * Store: Armazenamento Híbrido (SQLite + JSON)
 *
 * SQLITE: noticias (performance + transações)
 * JSON: categorias, municipios, etc (simples)
 *
 * Mantém compatibilidade com API JSON original.
 */
const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_PATH = path.resolve(__dirname, '..', 'data', 'painel.db');

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

const locks = new Map();

async function withLock(file, fn) {
  const prev = locks.get(file) || Promise.resolve();
  let release;
  const next = new Promise(r => (release = r));
  locks.set(file, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(file) === next) locks.delete(file);
  }
}

function fullPath(name) {
  if (!name.endsWith('.json')) name += '.json';
  return path.join(DATA_DIR, name);
}

// ═══════════════════════════════════════════════════════
// SQLITE: noticias
// ═══════════════════════════════════════════════════════

async function readNoticias(fallback = []) {
  try {
    // Ler do JSON (que tem todos os campos incluindo capa)
    const jsonPath = fullPath('noticias');
    const data = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler noticias do JSON:', err.message);
    return fallback;
  }
}

async function writeNoticias(noticias) {
  try {
    // PASSO 1: Salvar JSON PRIMEIRO (é a fonte de verdade)
    const jsonPath = fullPath('noticias');
    const tmp = jsonPath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(noticias, null, 2), 'utf8');
    await fs.rename(tmp, jsonPath);
    console.log('[store] ✅ Notícias salvas em JSON:', noticias.length);

    // PASSO 2: Sincronizar para SQLite
    const database = getDb();
    database.exec('DELETE FROM noticias');

    const stmt = database.prepare(`
      INSERT INTO noticias (
        id, slug, titulo, lide, conteudo, categoria, municipio,
        autor, data, tags, destaque, views, criadoEm, imagem, autorAvatar, capa, fonte
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const art of noticias) {
      stmt.run(
        art.id,
        art.slug,
        art.titulo,
        art.lide || '',
        art.conteudo || '',
        art.categoria || '',
        art.municipio || '',
        art.autor || '',
        art.data || new Date().toISOString(),
        JSON.stringify(art.tags || []),
        art.destaque ? 1 : 0,
        art.views || 0,
        art.criadoEm || art.data || new Date().toISOString(),
        art.imagem || '',
        art.autorAvatar || '',
        art.capa ? JSON.stringify(art.capa) : null,
        art.fonte || 'Redação'
      );
    }
    console.log('[store] ✅ Notícias sincronizadas com SQLite');

    return noticias;
  } catch (err) {
    console.error('❌ Erro ao escrever noticias:', err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════
// JSON: outros dados (categorias, etc)
// ═══════════════════════════════════════════════════════

async function readJson(name, fallback = []) {
  const file = fullPath(name);
  try {
    const raw = await fs.readFile(file, 'utf8');
    if (!raw || raw.trim().length === 0) {
      console.log(`[store] ${name} é vazio, usando fallback`);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (name === 'categorias') {
      console.log(`[store] ${name} lido do arquivo, primeira categoria:`, parsed[0]);
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`[store] ${name} não existe, usando fallback`);
      return fallback;
    }
    // JSON parse error ou outro erro - usar fallback
    console.warn(`[store] erro ao ler ${name}:`, err.message, '- usando fallback');
    return fallback;
  }
}

async function writeJson(name, data) {
  const file = fullPath(name);
  return withLock(file, async () => {
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, file);
    return data;
  });
}

async function updateJson(name, fn, fallback = []) {
  const file = fullPath(name);
  return withLock(file, async () => {
    let current;
    try {
      current = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      current = fallback;
    }
    const next = await fn(current);
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, file);
    return next;
  });
}

// ═══════════════════════════════════════════════════════
// API UNIFICADA (compatível com versão anterior)
// ═══════════════════════════════════════════════════════

async function read(name, fallback = [], subkey = null) {
  if (name === 'noticias') {
    // Ler do JSON sincronizado (tem capa com imagens corretas)
    // Fallback para SQLite apenas se JSON não existir
    try {
      return await readJson(name, null);
    } catch {
      return await readNoticias(fallback);
    }
  }

  const data = await readJson(name, fallback);
  if (subkey) return data?.[subkey] ?? fallback;
  return data;
}

async function write(name, data) {
  if (name === 'noticias') {
    return await writeNoticias(data);
  }
  return await writeJson(name, data);
}

async function update(name, fn, fallback = [], subkey = null) {
  if (name === 'noticias') {
    const current = await readNoticias(fallback);
    const next = await fn(current);
    return await writeNoticias(next);
  }

  return await updateJson(name, async (current) => {
    if (subkey) {
      const sub = current?.[subkey] ?? fallback;
      const updatedSub = await fn(sub);
      return { ...(current || {}), [subkey]: updatedSub };
    } else {
      return await fn(current);
    }
  });
}

module.exports = { read, write, update, DATA_DIR, getDb };
