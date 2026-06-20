const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'painel.db');

// Criar diretório se não existir
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Criar tabelas
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo TEXT DEFAULT 'colaborador',
      status TEXT DEFAULT 'S',
      foto TEXT,
      telefone TEXT,
      cidade TEXT,
      estado TEXT,
      sobre TEXT,
      permissoes TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      criadoPor INTEGER,
      atualizadoEm TEXT,
      atualizadoPor INTEGER
    );

    CREATE TABLE IF NOT EXISTS noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      lide TEXT,
      conteudo TEXT,
      imagem TEXT,
      categoria TEXT,
      municipio TEXT,
      autor TEXT,
      autorAvatar TEXT,
      fonte TEXT,
      data TEXT,
      tags TEXT,
      destaque INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT,
      cor TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS municipios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      estado TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      url TEXT NOT NULL,
      descricao TEXT,
      thumbnail TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquetes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pergunta TEXT NOT NULL,
      ativa INTEGER DEFAULT 1,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquete_opcoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enqueteId INTEGER NOT NULL,
      opcao TEXT NOT NULL,
      votos INTEGER DEFAULT 0,
      FOREIGN KEY(enqueteId) REFERENCES enquetes(id)
    );

    CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      noticiaId INTEGER NOT NULL,
      autor TEXT NOT NULL,
      email TEXT,
      conteudo TEXT NOT NULL,
      aprovado INTEGER DEFAULT 0,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paginas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      conteudo TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS anuncios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      local INTEGER NOT NULL,
      paginas TEXT DEFAULT '["*"]',
      ativo INTEGER DEFAULT 1,
      criativo TEXT,
      destino TEXT,
      periodo TEXT,
      impressoes INTEGER DEFAULT 0,
      cliques INTEGER DEFAULT 0,
      historico TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria);
    CREATE INDEX IF NOT EXISTS idx_noticias_data ON noticias(data);
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_anuncios_tipo ON anuncios(tipo);
    CREATE INDEX IF NOT EXISTS idx_anuncios_local ON anuncios(local);
    CREATE INDEX IF NOT EXISTS idx_anuncios_ativo ON anuncios(ativo);
  `);
}

initDb();

module.exports = db;
