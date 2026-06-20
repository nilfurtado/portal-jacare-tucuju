require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const http = require('http');
const { initRealtime } = require('./lib/realtime');
const { initRSSImporter } = require('./lib/rss-importer');
const { agendarBackupAutomatico } = require('./lib/backup');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORTAL_DIR = path.resolve(__dirname, '..'); // site de noticias/
const PAINEL_PHP_DIR = path.join(PORTAL_DIR, 'painel-php', 'public');

// 🚀 Otimizações de Performance
app.use(compression()); // Ativa gzip
app.use((req, res, next) => {
  // Cache agressivo para assets (1 ano)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // SEM cache para HTML (development)
  else if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  // Sem cache para API
  else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API
app.use('/api/auth', require('./api/auth'));
// ⚠️ SSE TEMPORARIAMENTE DESABILIDO - Causando crash do servidor
// app.use('/api/eventos', require('./api/eventos')); // SSE para notificações em tempo real

// Endpoint SSE dummy para evitar 404
app.get('/api/eventos', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.write(': SSE desabilido\n\n');
  setTimeout(() => res.end(), 1000);
});

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
app.use('/api/noticias-capa', require('./api/noticias-capa'));
app.use('/api/backup', require('./api/backup'));
app.use('/api/anuncios-capa', require('./api/anuncios-capa'));
app.use('/api/lixeira', require('./api/lixeira'));
app.use('/api/tema', require('./api/tema'));
app.use('/api/acessos', require('./api/acessos'));
app.use('/api/plugins', require('./api/plugins'));
app.use('/api/portal', require('./api/portal'));
app.use('/api/rss-feeds', require('./api/rss-feeds'));
app.use('/api/categorias-export', require('./api/categorias-export'));
try {
  app.use('/api/auto-post', require('./api/auto-post'));
  console.log('✅ Auto Post API carregada com sucesso');
} catch (err) {
  console.error('❌ Erro ao carregar Auto Post API:', err.message);
}

// RSS Feed PÚBLICO (ANTES de autenticação)
const store = require('./lib/store');
const axios = require('axios');
const { slugify } = require('./lib/slugify');
const { nextId } = require('./lib/ids');

// Rota para forçar sincronização de feed
app.post('/api/rss/sincronizar/:feedId', async (req, res) => {
  try {
    const { feedId } = req.params;

    // Ler feeds do arquivo
    const fs = require('fs');
    const feedsPath = path.join(__dirname, 'data', 'auto-post-feeds.json');
    const feedsJson = fs.readFileSync(feedsPath, 'utf8');
    const feeds = JSON.parse(feedsJson);

    console.log(`[RSS Sync] Buscando feed: ${feedId}`);
    console.log(`[RSS Sync] Feeds disponíveis:`, feeds.map(f => f.id));

    const feed = feeds.find(f => f.id === feedId);

    if (!feed) {
      console.log(`[RSS Sync] Feed não encontrado para ID: ${feedId}`);
      return res.status(404).json({ erro: 'Feed não encontrado' });
    }

    console.log(`[RSS Sync] Feed encontrado:`, feed.nome);

    // Buscar conteúdo do feed
    const response = await axios.get(feed.url, { timeout: 10000 });
    const parseString = require('xml2js').parseString;

    parseString(response.data, async (err, result) => {
      if (err) {
        return res.status(400).json({ erro: 'Feed RSS inválido', detalhes: err.message });
      }

      const items = result.rss?.channel?.[0]?.item || [];
      const noticias = await store.read('noticias', []);
      let importadas = 0;

      for (const item of items.slice(0, 10)) {
        try {
          const titulo = item.title?.[0] || 'Sem título';
          const link = item.link?.[0] || '';
          const jaExiste = noticias.some(n => n.autoPostLink === link);

          if (jaExiste) continue;

          const novaNotizia = {
            id: nextId(noticias),
            slug: slugify(titulo),
            titulo,
            lide: (item.description?.[0] || item.summary?.[0] || '').substring(0, 200),
            conteudo: `${item.description?.[0] || item.summary?.[0] || ''}\n\n<hr/>\n<p><em>Fonte: <a href="${link}" target="_blank">${feed.nome}</a></em></p>`,
            categoria: feed.categoria,
            autor: feed.nome,
            autorAvatar: '',
            data: item.pubDate?.[0] || new Date().toISOString(),
            tags: [feed.nome, 'rss-import', feed.categoria],
            destaque: false,
            views: 0,
            autoPostLink: link,
            capa: {}
          };

          noticias.push(novaNotizia);
          importadas++;
        } catch (e) {
          console.error('[RSS Sync] Erro ao processar item:', e.message);
        }
      }

      if (importadas > 0) {
        await store.write('noticias', noticias);
      }

      res.json({
        ok: true,
        feed: feed.nome,
        importadas,
        total: items.length
      });
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/rss/noticias.xml', async (req, res) => {
  try {
    const noticias = await store.read('noticias', []);
    const items = noticias
      .slice(0, 20)
      .map(n => `
        <item>
          <title>${escapeXml(n.titulo)}</title>
          <link>http://localhost:8000/noticia/${n.slug}/</link>
          <description>${escapeXml(n.lide || '')}</description>
          <pubDate>${new Date(n.data).toUTCString()}</pubDate>
          <author>${escapeXml(n.autor || 'Portal')}</author>
          <category>${escapeXml(n.categoria || 'geral')}</category>
          <guid>${n.id}</guid>
        </item>
      `).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Portal Jacaré Tucujú - Notícias</title>
    <link>http://localhost:8000</link>
    <description>Notícias do Amapá</description>
    <language>pt-br</language>
    ${items}
  </channel>
</rss>`;

    res.type('application/xml').send(rss);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/[<>&'"]/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[c]));
}

// Teste simples ANTES de tudo
app.post('/test-simple', (req, res) => {
  res.json({ ok: true, message: 'Simple test OK' });
});

// Serve Painel DM em /painel/
app.use('/painel', express.static(PUBLIC_DIR));

// Serve Painel PHP em /painel-php/
app.use('/painel-php', express.static(PAINEL_PHP_DIR));

// Redirecionar / para /painel/
app.get('/', (req, res) => {
  res.redirect('/painel/');
});

// Serve uploads do painel DM (noticias e anuncios) - ANTES de /img genérico
app.use('/img/uploads', express.static(path.join(__dirname, 'public', 'img', 'uploads')));

// Serve uploads do portal (para preview de imagens já existentes)
app.use('/img', express.static(path.join(PORTAL_DIR, 'img')));

// Serve data da raiz do projeto (municipios, etc)
app.use('/data', express.static(path.join(__dirname, '..', 'data')));

// Fallback: data do portal se não encontrar na raiz
app.use('/data', express.static(path.join(PORTAL_DIR, 'data')));

// ═══════════════════════════════════════════════════
// MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
// ═══════════════════════════════════════════════════

// Rotas públicas (sem autenticação necessária)
const publicRoutes = ['/painel/login/', '/test.html', '/debug.html'];

// Middleware: verificar autenticação para rotas protegidas
app.use((req, res, next) => {
  // API não precisa desse middleware (tem seu próprio)
  if (req.path.startsWith('/api/')) return next();

  // Rotas públicas sempre permitem
  if (publicRoutes.includes(req.path)) return next();

  // Se tenta acessar /painel/* (exceto login), pode servir a página
  // A verificação de token fica no JavaScript do navegador
  next();
});

// ═══════════════════════════════════════════════════
// ROTAS DE ASSETS ESTÁTICOS EXPLÍCITAS
// ═══════════════════════════════════════════════════

// Servir include.js explicitamente
app.get('/js/include.js', (req, res) => {
  const filePath = path.join(PUBLIC_DIR, 'js', 'include.js');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
});

// ═══════════════════════════════════════════════════
// URL AMIGÁVEIS — MAPEAMENTO DE ROTAS
// ═══════════════════════════════════════════════════

const ROUTE_MAP = {
  '/painel/': 'index.html',
  '/painel/login/': 'login.html',
  '/painel/noticias/': 'noticias-lista.html',
  '/painel/noticias/nova/': 'noticias.html',
  '/painel/noticias/importadas/': 'noticias-importadas.html',
  '/painel/categorias/': 'categorias.html',
  '/painel/anuncios/': 'anuncios.html',
  '/painel/anuncios/novo': 'anuncios/novo.html',
  '/painel/anuncios/novo/': 'anuncios/novo.html',
  '/painel/anuncios/editar': 'anuncios/editar.html',
  '/painel/anuncios/editar/': 'anuncios/editar.html',
  '/painel/anuncios/dashboard': 'anuncios/dashboard.html',
  '/painel/anuncios/dashboard/': 'anuncios/dashboard.html',
  '/painel/anuncios/dashboard.html': 'anuncios/dashboard.html',
  '/painel/municipios/': 'municipios.html',
  '/painel/usuarios/': 'usuarios.html',
  '/painel/videos/': 'videos/lista.html',
  '/painel/videos/nova/': 'videos/nova.html',
  '/painel/comentarios/': 'comentarios.html',
  '/painel/classificados/': 'classificados.html',
  '/painel/classificados-categorias/': 'classificados-categorias.html',
  '/painel/enquetes/': 'enquetes/lista.html',
  '/painel/enquetes/nova/': 'enquetes/nova.html',
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
app.get(/^\/painel\//, (req, res, next) => {
  // Tenta com a rota exata (com ou sem barra final)
  let file = ROUTE_MAP[req.path];

  // Se não encontrou, tenta adicionar barra final
  if (!file && !req.path.endsWith('/')) {
    file = ROUTE_MAP[req.path + '/'];
  }

  // Se não encontrou, tenta remover barra final
  if (!file && req.path.endsWith('/')) {
    file = ROUTE_MAP[req.path.slice(0, -1)];
  }

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
app.get(/.*/, (req, res, next) => {
  // Não redirecionar assets estáticos
  if (req.path.startsWith('/api/') ||
      req.path.startsWith('/js/') ||
      req.path.startsWith('/css/') ||
      req.path.startsWith('/img/') ||
      req.path.startsWith('/data/') ||
      req.path.startsWith('/partials/')) {
    return next();
  }

  // API: retorna 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ erro: 'Endpoint não encontrado' });
  }

  // SPA: redireciona para login
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERR]', err);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno' });
});

// Sincronizar SQLite → JSON ao iniciar
const { syncAll } = require('./lib/sync-all');
// DESABILITADO: JSON é a fonte de verdade, não sobrescrever
// syncAll().catch(err => console.error('Erro na sincronização master:', err));

// Endpoint para sincronizar sob demanda
app.post('/api/sync-noticias', async (req, res) => {
  const result = await syncDbToJson();
  if (result.success) {
    res.json({ success: true, total: result.total, mensagem: `${result.total} notícias sincronizadas` });
  } else {
    res.status(500).json({ erro: result.erro });
  }
});

app.post('/api/sync-all', async (req, res) => {
  const result = await syncAll();
  if (result.success) {
    res.json({
      success: true,
      syncedSections: result.syncedSections,
      totalItems: result.totalItems,
      mensagem: `${result.syncedSections} seções sincronizadas, ${result.totalItems} itens exportados`
    });
  } else {
    res.status(500).json({ erro: 'Erro ao sincronizar' });
  }
});

app.post('/api/sync-anuncios', async (req, res) => {
  const result = await syncAnunciosToJson();
  if (result.success) {
    res.json({ success: true, total: result.total, mensagem: `${result.total} anúncios sincronizados` });
  } else {
    res.status(500).json({ erro: result.erro });
  }
});

// Inicializar Socket.io para comunicação em tempo real
const io = initRealtime(server);
global.io = io; // Disponibilizar globalmente para os routers

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Painel DM rodando em http://localhost:${PORT}`);
  console.log(`  Acesso externo: http://0.0.0.0:${PORT}`);
  console.log(`  WebSocket (tempo real): ws://localhost:${PORT}\n`);

  // Inicializar importador de RSS
  console.log('🔄 Iniciando importador de RSS...');
  initRSSImporter();

  // 📦 Backup automático a cada 3 dias
  console.log('  ✅ Backup automático agendado (a cada 3 dias)');
  agendarBackupAutomatico(72);

  // Sincronização automática periódica DESABILIDA
  // (JSON é fonte de verdade, não sobrescrever)
  // setInterval(() => {
  //   syncAll().catch(err => console.error('Erro na sincronização periódica:', err));
  // }, 5 * 60 * 1000);
});
