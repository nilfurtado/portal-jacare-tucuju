/**
 * SINCRONIZAÇÃO MASTER: Todas as seções SQLite → JSON
 * Sincroniza: notícias, videos, classificados, categorias, municipios, páginas, comentários
 */
const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');
const { syncEnquetes } = require('./sync-enquetes');
const { syncAnunciosToJson } = require('./sync-anuncios');

async function syncNoticias() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const rows = db.prepare('SELECT * FROM noticias ORDER BY id DESC').all();

    // Aplicar transform para parsear capa e tags
    const noticias = rows.map(row => ({
      ...row,
      destaque: row.destaque === 1,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags,
      capa: row.capa ? JSON.parse(row.capa) : null
    }));

    const jsonPath = path.join(__dirname, '..', '..', 'data', 'noticias.json');
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização noticias: ${noticias.length} notícias exportadas`);
    return { success: true, total: noticias.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar noticias:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncVideos() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const videos = db.prepare('SELECT id, titulo, url, descricao, criadoEm FROM videos ORDER BY id DESC').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'videos.json');
    await fs.writeFile(jsonPath, JSON.stringify(videos, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização videos: ${videos.length} vídeos exportados`);
    return { success: true, total: videos.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar videos:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncClassificados() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    // Procurar tabela de classificados se existir
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%classif%'").all();

    if (tables.length === 0) {
      console.log('⚠️  Tabela classificados não encontrada no SQLite');
      return { success: true, total: 0 };
    }

    const classificados = db.prepare('SELECT * FROM classificados ORDER BY id DESC').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'classificados.json');
    await fs.writeFile(jsonPath, JSON.stringify(classificados, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização classificados: ${classificados.length} classificados exportados`);
    return { success: true, total: classificados.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar classificados:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncCategorias() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const categorias = db.prepare('SELECT id, slug, nome, descricao, cor, ordem, criadoEm FROM categorias ORDER BY ordem ASC').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'categorias.json');
    await fs.writeFile(jsonPath, JSON.stringify(categorias, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização categorias: ${categorias.length} categorias exportadas`);
    return { success: true, total: categorias.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar categorias:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncMunicipios() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const municipios = db.prepare('SELECT id, slug, nome, estado, criadoEm FROM municipios ORDER BY nome').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'municipios.json');
    await fs.writeFile(jsonPath, JSON.stringify(municipios, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização municipios: ${municipios.length} municípios exportados`);
    return { success: true, total: municipios.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar municipios:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncPaginas() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const paginas = db.prepare('SELECT id, slug, titulo, conteudo, criadoEm FROM paginas ORDER BY id').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'paginas.json');
    await fs.writeFile(jsonPath, JSON.stringify(paginas, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização paginas: ${paginas.length} páginas exportadas`);
    return { success: true, total: paginas.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar paginas:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncComentarios() {
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    const comentarios = db.prepare('SELECT id, noticiaId, autor, email, conteudo, aprovado, criadoEm FROM comentarios ORDER BY id DESC').all();
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'comentarios.json');
    await fs.writeFile(jsonPath, JSON.stringify(comentarios, null, 2), 'utf-8');

    db.close();
    console.log(`✅ Sincronização comentarios: ${comentarios.length} comentários exportados`);
    return { success: true, total: comentarios.length };
  } catch (err) {
    console.error('❌ Erro ao sincronizar comentarios:', err.message);
    return { success: false, erro: err.message };
  }
}

async function syncAll() {
  console.log('🔄 Iniciando sincronização master de TODAS as seções...');
  console.log('');

  const results = await Promise.all([
    syncNoticias(),      // Notícias (com transform correto para capa parseada)
    syncEnquetes(),      // Enquetes
    syncAnunciosToJson(),// Anúncios
    syncVideos(),        // Vídeos
    syncCategorias(),    // Categorias
    syncMunicipios(),    // Municípios
    syncPaginas(),       // Páginas
    syncComentarios(),   // Comentários
    syncClassificados()  // Classificados
  ]);

  const successCount = results.filter(r => r.success).length;
  const totalItems = results.reduce((sum, r) => sum + (r.total || 0), 0);

  console.log('');
  console.log(`✅ Sincronização completa: ${successCount}/9 seções sincronizadas, ${totalItems} itens exportados`);

  return { success: true, syncedSections: successCount, totalItems };
}

module.exports = { syncAll, syncVideos, syncClassificados, syncCategorias, syncMunicipios, syncPaginas, syncComentarios };
