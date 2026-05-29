/**
 * Store: leitura e escrita atômica de JSONs em ../data/
 * Garante que escritas concorrentes não corrompem o arquivo:
 * grava em tmp e faz rename atômico.
 */
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

const locks = new Map(); // path → Promise da última operação

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

/**
 * Lê um JSON. Se houver `subkey`, retorna data[subkey] (ou fallback).
 * Suporta tanto JSON-array (noticias.json) quanto JSON-objeto com subkey (categorias.json).
 */
async function read(name, fallback = [], subkey = null) {
  const file = fullPath(name);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    if (subkey) return data?.[subkey] ?? fallback;
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function write(name, data) {
  const file = fullPath(name);
  return withLock(file, async () => {
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, file);
    return data;
  });
}

/**
 * Aplica fn ao conteúdo do JSON e regrava atomicamente.
 * Se subkey for fornecido, fn recebe e devolve apenas data[subkey].
 */
async function update(name, fn, fallback = [], subkey = null) {
  const file = fullPath(name);
  return withLock(file, async () => {
    let current;
    try {
      current = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      current = subkey ? { [subkey]: fallback } : fallback;
    }
    let next;
    if (subkey) {
      const sub = current?.[subkey] ?? fallback;
      const updatedSub = await fn(sub);
      next = { ...(current || {}), [subkey]: updatedSub };
    } else {
      next = await fn(current);
    }
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, file);
    return subkey ? next[subkey] : next;
  });
}

module.exports = { read, write, update, DATA_DIR };
