/**
 * Servidor HTTP para Portal com charset UTF-8 correto
 * + Gzip, Cache HTTP e Versioning para performance
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const crypto = require('crypto');

const PORT = 8000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathName = path.join(ROOT_DIR, parsedUrl.pathname);

  // Tratamento de APIs
  if (parsedUrl.pathname === '/api/portal/bootstrap') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: {
        tema: 'light',
        idioma: 'pt-BR',
        features: {
          lazyLoad: true,
          realTime: true,
          darkMode: true,
          anuncios: true,
          videos: true,
          enquetes: true
        }
      }
    }));
    return;
  }

  if (parsedUrl.pathname === '/api/portal/config') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: {
        siteName: 'Portal Jacaré Tucujú',
        siteUrl: 'http://localhost:8000',
        maxUploadSize: '8MB',
        imageFormats: ['JPEG', 'WebP', 'PNG', 'GIF']
      }
    }));
    return;
  }

  // Se for diretório, tenta index.html
  if (fs.existsSync(pathName) && fs.statSync(pathName).isDirectory()) {
    pathName = path.join(pathName, 'index.html');
  }

  // Se arquivo não existir, tenta adicionar .html
  if (!fs.existsSync(pathName) && !pathName.endsWith('.html')) {
    const htmlPath = pathName + '.html';
    if (fs.existsSync(htmlPath)) {
      pathName = htmlPath;
    }
  }

  // Ler arquivo
  fs.readFile(pathName, (err, data) => {
    if (err) {
      // 404 Not Found
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>404 - Não Encontrado</title>
          <style>
            body { font-family: Arial; background: #1a1a1a; color: #fff; padding: 40px; }
            h1 { color: #f07e13; }
          </style>
        </head>
        <body>
          <h1>❌ 404 - Página não encontrada</h1>
          <p>Procurando: ${pathName}</p>
          <a href="/">Voltar à homepage</a>
        </body>
        </html>
      `);
      return;
    }

    // Obter tipo MIME
    const ext = path.extname(pathName).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache control baseado no tipo de arquivo
    let cacheControl = 'no-cache';
    const isImage = ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isAsset = ext.match(/\.(js|css|woff|woff2|ttf|ico)$/);
    const isHashedFile = pathName.includes('.');

    if (isHashedFile && (isImage || isAsset)) {
      // Arquivos com hash: cache 1 ano (cache busting automático)
      cacheControl = 'public, max-age=31536000, immutable';
    } else if (isAsset) {
      // Assets sem hash: cache 1 ano
      cacheControl = 'public, max-age=31536000, immutable';
    } else if (ext === '.html') {
      // HTML: cache 5 minutos (permitir atualizações)
      cacheControl = 'public, max-age=300';
    }

    // Gzip compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const headers = {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding' + (isImage ? ', Accept' : '') // WebP negotiation
    };

    // ETag para revalidação eficiente
    if (isImage || isAsset) {
      const hash = crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
      headers['ETag'] = `"${hash}"`;
    }

    if (acceptEncoding.includes('gzip') && data.length > 1024) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      zlib.gzip(data, (err, compressed) => {
        if (err) {
          res.end(data);
        } else {
          res.end(compressed);
        }
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n╔═════════════════════════════════════════════════════╗`);
  console.log(`║  🌐 Portal de Notícias - Servidor Rodando           ║`);
  console.log(`╚═════════════════════════════════════════════════════╝\n`);
  console.log(`✅ Servidor iniciado em http://localhost:${PORT}`);
  console.log(`📁 Raiz: ${ROOT_DIR}`);
  console.log(`🔤 Charset: UTF-8 ativado para todos os arquivos\n`);
});
