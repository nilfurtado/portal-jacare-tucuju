/**
 * Service Worker — Portal Jacaré Tucujú
 *
 * Estratégias:
 *   - HTML / JSON (dados):  network-first com fallback ao cache
 *   - CSS / JS / SVG:       cache-first com revalidação em background
 *   - Imagens:              cache-first
 *   - Cross-origin (fontes, picsum): apenas cache opportunistic
 */

const VERSION = 'v1.1.0-orange';
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// Recursos críticos pre-cacheados na instalação
const PRECACHE_URLS = [
  './',
  'index.html',
  'busca.html',
  'noticia.html',
  'categoria.html',
  'municipio.html',
  'enquetes.html',
  'videos.html',
  'sobre.html',
  'contato.html',
  'privacidade.html',
  'termos.html',
  '404.html',
  'manifest.json',
  'css/tokens.css',
  'css/reset.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/breaking-news.css',
  'css/drawer.css',
  'css/carousel.css',
  'css/home.css',
  'css/article.css',
  'css/static-page.css',
  'css/audio-reader.css',
  'css/responsive.css',
  'img/logo.svg',
  'img/logo-white.svg',
  'img/favicon.svg',
  'partials/breaking-news.html',
  'partials/header.html',
  'partials/sidebar.html',
  'partials/footer.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(err => console.warn('Pre-cache parcial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cross-origin (fontes, picsum, pravatar): cache opportunistic
  if (url.origin !== location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // HTML e JSON: network-first
  if (req.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Imagens, CSS, JS: cache-first
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req) || await caches.match(req);
    if (cached) return cached;
    // fallback final
    if (req.destination === 'document') {
      const fallback = await caches.match('404.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) {
    // revalida em background
    fetch(req).then(fresh => {
      if (fresh && fresh.status === 200) {
        caches.open(RUNTIME_CACHE).then(c => c.put(req, fresh));
      }
    }).catch(() => { /* offline ok */ });
    return cached;
  }
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (err) {
    if (req.destination === 'image') {
      // imagem fallback minimalista (SVG 1x1 cinza)
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#e1e4e8"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw err;
  }
}

// Message handler — permite atualização manual
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
