require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORTAL_DIR = path.resolve(__dirname, '..'); // site de noticias/

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api/auth', require('./api/auth'));
app.use('/api/noticias', require('./api/noticias'));
app.use('/api/categorias', require('./api/categorias'));
app.use('/api/anuncios', require('./api/anuncios'));
app.use('/api/municipios', require('./api/municipios'));
app.use('/api/config', require('./api/config'));
app.use('/api/videos', require('./api/videos'));
app.use('/api/enquetes', require('./api/enquetes'));
app.use('/api/classificados', require('./api/classificados'));
app.use('/api/classificados-categorias', require('./api/classificados-categorias'));
app.use('/api/colunas', require('./api/colunas'));
app.use('/api/comentarios', require('./api/comentarios'));
app.use('/api/paginas', require('./api/paginas'));
app.use('/api/usuarios', require('./api/usuarios'));
app.use('/api/upload', require('./api/upload'));
app.use('/api/lixeira', require('./api/lixeira'));
app.use('/api/tema', require('./api/tema'));
app.use('/api/acessos', require('./api/acessos'));
app.use('/api/plugins', require('./api/plugins'));
app.use('/api/portal', require('./api/portal'));

// Serve uploads do portal (para preview de imagens já existentes)
app.use('/img', express.static(path.join(PORTAL_DIR, 'img')));
app.use('/data', express.static(path.join(PORTAL_DIR, 'data')));

// ═══════════════════════════════════════════════════
// URL AMIGÁVEIS — MAPEAMENTO DE ROTAS
// ═══════════════════════════════════════════════════

const ROUTE_MAP = {
  '/painel/': 'index.html',
  '/painel/login/': 'login.html',
  '/painel/noticias/': 'noticias-lista.html',
  '/painel/noticias/nova/': 'noticias.html',
  '/painel/categorias/': 'categorias.html',
  '/painel/anuncios/': 'anuncios.html',
  '/painel/municipios/': 'municipios.html',
  '/painel/usuarios/': 'usuarios.html',
  '/painel/videos/': 'videos.html',
  '/painel/comentarios/': 'comentarios.html',
  '/painel/classificados/': 'classificados.html',
  '/painel/classificados-categorias/': 'classificados-categorias.html',
  '/painel/enquetes/': 'enquetes.html',
  '/painel/colunas/': 'colunas.html',
  '/painel/paginas/': 'paginas.html',
  '/painel/acessos/': 'acessos.html',
  '/painel/plugins/': 'plugins.html',
  '/painel/configuracoes/': 'configuracoes.html',
  '/painel/temas/': 'temas.html',
  '/painel/layout/': 'layout.html',
  '/painel/logomarca/': 'logomarca.html',
  '/painel/lixeira/': 'lixeira.html'
};

// Middleware para rotas amigáveis do painel
app.get(/^\/painel\/.*\/$/, (req, res, next) => {
  const file = ROUTE_MAP[req.path];
  if (file) {
    return res.sendFile(path.join(PUBLIC_DIR, file));
  }
  // Se não encontrar, tenta padrão /painel/resource/id/editar/
  const match = req.path.match(/^\/painel\/(\w+)\/(\w+)\/editar\/?$/);
  if (match) {
    const resource = match[1];
    // Mapeia para a página correspondente (ex: /painel/noticias/123/editar/ → noticias.html)
    const editFile = {
      'noticias': 'noticias.html',
      'videos': 'videos.html',
      'usuarios': 'usuarios.html',
      'paginas': 'paginas.html'
    }[resource];
    if (editFile) {
      return res.sendFile(path.join(PUBLIC_DIR, editFile));
    }
  }
  next();
});

// Frontend do painel — arquivos estáticos
app.use('/', express.static(PUBLIC_DIR));

// SPA fallback: redireciona rotas desconhecidas para login
app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ erro: 'Endpoint não encontrado' });
  }
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERR]', err);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`\n  Painel DM rodando em http://localhost:${PORT}\n`);
});
