/**
 * Migração: JSON → SQLite
 * Executa: node scripts/migrate-to-sqlite.js
 */
const db = require('../lib/db');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log('\n📦 Iniciando migração de dados...\n');

  try {
    // Usuarios
    const usuariosPath = path.join(__dirname, '..', '..', 'data', 'usuarios.json');
    if (fs.existsSync(usuariosPath)) {
      const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO usuarios
        (id, nome, email, senha, tipo, status, foto, telefone, cidade, estado, sobre, permissoes, criadoEm, criadoPor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of usuarios) {
        stmt.run(
          u.id, u.nome, u.email, u.senha, u.tipo, u.status, u.foto,
          u.telefone, u.cidade, u.estado, u.sobre,
          JSON.stringify(u.permissoes || {}), u.criadoEm, u.criadoPor
        );
      }
      console.log(`✅ ${usuarios.length} usuários migrados`);
    }

    // Noticias
    const noticiasPath = path.join(__dirname, '..', '..', 'data', 'noticias.json');
    if (fs.existsSync(noticiasPath)) {
      const noticias = JSON.parse(fs.readFileSync(noticiasPath, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO noticias
        (id, slug, titulo, lide, conteudo, imagem, categoria, municipio, autor, autorAvatar, data, tags, destaque, views, criadoEm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of noticias) {
        stmt.run(
          n.id, n.slug, n.titulo, n.lide, n.conteudo, n.imagem,
          n.categoria, n.municipio, n.autor, n.autorAvatar, n.data,
          Array.isArray(n.tags) ? JSON.stringify(n.tags) : '[]',
          n.destaque ? 1 : 0, n.views, n.criadoEm
        );
      }
      console.log(`✅ ${noticias.length} notícias migradas`);
    }

    // Categorias
    const categoriasPath = path.join(__dirname, '..', '..', 'data', 'categorias.json');
    if (fs.existsSync(categoriasPath)) {
      const data = JSON.parse(fs.readFileSync(categoriasPath, 'utf8'));
      const categorias = data.categorias || data;
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO categorias (slug, nome, cor, criadoEm)
        VALUES (?, ?, ?, ?)
      `);
      for (const c of categorias) {
        stmt.run(c.slug, c.label || c.nome, c.cor, new Date().toISOString());
      }
      console.log(`✅ ${categorias.length} categorias migradas`);
    }

    // Municipios
    const municipiosPath = path.join(__dirname, '..', '..', 'data', 'municipios.json');
    if (fs.existsSync(municipiosPath)) {
      const municipios = JSON.parse(fs.readFileSync(municipiosPath, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO municipios (id, slug, nome, estado, criadoEm)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const m of municipios) {
        stmt.run(m.id, m.slug, m.nome, m.estado, m.criadoEm);
      }
      console.log(`✅ ${municipios.length} municípios migrados`);
    }

    console.log('\n✅ Migração concluída com sucesso!\n');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  }
}

migrate();
