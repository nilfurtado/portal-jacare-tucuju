const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const fullUrl = req.url;
  const url = req.url.split('?')[0];
  console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);

  // PROXY /api/* para Painel (3000)
  if (url.startsWith('/api/')) {
    console.log(`  → Proxying to Painel:3000${fullUrl}`);
    const proxyReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: fullUrl,
      method: req.method,
      headers: { ...req.headers, host: 'localhost:3000' },
    }, (proxyRes) => {
      console.log(`  ✅ ${proxyRes.statusCode}`);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.log(`  ❌ Proxy error: ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
    return;
  }

  // Servir arquivos estáticos
  let file;

  // Para /img/, /css/, /js/, /data/, /partials/ - procura em public/ PRIMEIRO
  if (url.startsWith('/img/') || url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/data/') || url.startsWith('/partials/')) {
    // Partials pode estar em public/partials ou na raiz partials
    const inPublic = path.join(ROOT, 'public', url);
    const inRoot = path.join(ROOT, url);

    // Verificar qual existe
    if (fs.existsSync(inPublic)) {
      file = inPublic;
    } else {
      file = inRoot;
    }
  } else {
    // Para outras rotas, tenta na raiz (index.html para SPA)
    file = path.join(ROOT, url === '/' ? 'index.html' : url);
  }

  // Segurança: prevenir path traversal
  const normalizedFile = path.normalize(file);
  const normalizedRoot = path.normalize(ROOT);

  if (!normalizedFile.startsWith(normalizedRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      // Se é asset e não encontrou em public/, tentar na raiz
      if (url.startsWith('/img/') || url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/data/')) {
        const fallback = path.join(ROOT, url);
        const normalizedFallback = path.normalize(fallback);

        if (normalizedFallback.startsWith(normalizedRoot)) {
          fs.readFile(fallback, (err2, data2) => {
            if (!err2) {
              const ext = path.extname(url);
              const mime = MIME[ext] || 'application/octet-stream';
              res.writeHead(200, { 'Content-Type': mime });
              res.end(data2);
              return;
            }
            // Ainda não encontrou
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          });
          return;
        }
      }

      // Se tem extensão de arquivo e não é SPA, retorna 404
      if (path.extname(url) !== '') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      // SPA fallback: serve index.html para rotas desconhecidas
      fs.readFile(path.join(ROOT, 'index.html'), (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(file);
    const mime = MIME[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };

    // Desabilitar cache para .js e .json
    if (ext === '.js' || ext === '.json') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Portal Server: http://localhost:${PORT}`);
  console.log(`📂 Root: ${ROOT}\n`);
});
