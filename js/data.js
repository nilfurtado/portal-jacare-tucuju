/**
 * data.js — Loader unificado para o portal.
 *
 * Estratégia em camadas:
 *  1. Tenta carregar do backend (painel-php) via /api/portal/bootstrap
 *  2. Cacheia em localStorage com TTL de 60s para UX rápida
 *  3. Se backend offline ou falhar, usa fallback para data/*.json estáticos
 *
 * Mantém a API original (loadAll, getCache, destaques, etc.) para que
 * nenhum outro arquivo do portal precise mudar.
 */

let cache = null;

// URL base do backend. Pode ser sobrescrita por <meta name="painel-api" content="...">
function getApiBase() {
  const meta = document.querySelector('meta[name="painel-api"]');
  if (meta?.content) {
    const v = meta.content.replace(/\/+$/, '');
    // Em desenvolvimento local (portal em :8000, painel em :3000),
    // se a meta apontar para path relativo e estamos em localhost:8000,
    // assume painel-dm Node rodando em :3000.
    if (v.startsWith('/') && location.hostname === 'localhost' && location.port === '8000') {
      return 'http://localhost:3000/api';
    }
    return v;
  }
  return '/painel/api'; // padrão: mesmo domínio + subpath
}

const TTL_MS    = 60_000;        // 60s
const STORAGE_K = 'jt:bootstrap';

async function tentarBackend() {
  const base = getApiBase();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4_000);
  try {
    const r = await fetch(`${base}/portal/bootstrap`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fallbackJSONs() {
  console.warn('[data.js] backend indisponível, lendo data/*.json estáticos');
  const [noticias, enquetes, videos, classificados, meta, colunas, classCats, config] = await Promise.all([
    fetch('data/noticias.json').then(r => r.json()),
    fetch('data/enquetes.json').then(r => r.json()),
    fetch('data/videos.json').then(r => r.json()),
    fetch('data/classificados.json').then(r => r.json()),
    fetch('data/categorias.json').then(r => r.json()),
    fetch('data/colunas.json').then(r => r.json()).catch(() => []),
    fetch('data/classificados-categorias.json').then(r => r.json()).catch(() => []),
    fetch('data/config.json').then(r => r.json()).catch(() => ({})),
  ]);
  return {
    noticias,
    enquetes,
    videos,
    classificados,
    classificadosCategorias: classCats,
    colunas,
    categorias: meta.categorias,
    municipios: meta.municipios,
    config,
  };
}

function lerCacheLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_K);
    if (!raw) return null;
    const pkg = JSON.parse(raw);
    if (!pkg.expiraEm || Date.now() > pkg.expiraEm) {
      localStorage.removeItem(STORAGE_K);
      return null;
    }
    return pkg.dados;
  } catch { return null; }
}

function gravarCacheLocal(dados) {
  try {
    localStorage.setItem(STORAGE_K, JSON.stringify({
      dados, expiraEm: Date.now() + TTL_MS,
    }));
  } catch {/* localStorage cheio ou desabilitado — segue sem cachear */}
}

export async function loadAll() {
  if (cache) return cache;

  // 1) cache local (serve rápido + revalida em background)
  const local = lerCacheLocal();
  if (local) {
    cache = local;
    tentarBackend().then(d => { gravarCacheLocal(d); cache = d; }).catch(() => {});
    return cache;
  }

  // 2) backend
  try {
    const dados = await tentarBackend();
    cache = dados;
    gravarCacheLocal(dados);
    return cache;
  } catch (err) {
    console.warn('[data.js] backend falhou:', err.message);
  }

  // 3) fallback JSONs
  cache = await fallbackJSONs();
  return cache;
}

export function getCache() {
  if (!cache) throw new Error('Dados ainda não carregados. Chame loadAll() primeiro.');
  return cache;
}

/** Força recarregamento do backend ignorando cache local. */
export async function reload() {
  cache = null;
  try { localStorage.removeItem(STORAGE_K); } catch {}
  return loadAll();
}

// ---------- Funções derivadas (mesma assinatura de antes) ----------

export const byCategoria = (cat, limit = Infinity) =>
  getCache().noticias.filter(n => n.categoria === cat).slice(0, limit);

export const byMunicipio = (mun, limit = Infinity) =>
  getCache().noticias.filter(n => n.municipio === mun).slice(0, limit);

export const bySlug = (slug) =>
  getCache().noticias.find(n => n.slug === slug);

export const destaques = (n = 4) =>
  getCache().noticias.filter(x => x.destaque).slice(0, n);

export const maisLidas = (n = 5) =>
  [...getCache().noticias].sort((a, b) => b.views - a.views).slice(0, n);

export const ultimas = (n = 6) =>
  [...getCache().noticias].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, n);

export const relacionadas = (noticia, n = 3) =>
  getCache().noticias
    .filter(x => x.id !== noticia.id && (x.categoria === noticia.categoria || x.municipio === noticia.municipio))
    .slice(0, n);

export function search(query) {
  if (!query) return [];
  const t = query.toLowerCase().trim();
  return getCache().noticias.filter(n =>
    n.titulo.toLowerCase().includes(t) ||
    (n.lide || '').toLowerCase().includes(t) ||
    (n.tags || []).some(tag => tag.toLowerCase().includes(t))
  );
}

export function getCategoria(slug) {
  return getCache().categorias.find(c => c.slug === slug);
}

export function getMunicipio(slug) {
  return getCache().municipios.find(m => m.slug === slug);
}

export function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function tempoRelativo(iso) {
  const agora = Date.now();
  const data = new Date(iso).getTime();
  const diff = agora - data;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return formatarData(iso);
}

/**
 * Busca notícia individual com conteúdo completo.
 * Tenta o endpoint público (que incrementa views) e cai pro cache se offline.
 */
export async function fetchNoticiaCompleta(slug) {
  try {
    const r = await fetch(`${getApiBase()}/portal/noticia/${encodeURIComponent(slug)}`);
    if (r.ok) return await r.json();
  } catch { /* fallback */ }
  return bySlug(slug);
}

/**
 * Registra voto em enquete. Retorna { ok, opcoes } com placar atualizado.
 */
export async function votarEnquete(enqueteId, opcaoId) {
  const r = await fetch(
    `${getApiBase()}/portal/voto/${encodeURIComponent(enqueteId)}/${encodeURIComponent(opcaoId)}`,
    { method: 'POST' }
  );
  if (!r.ok) throw new Error('Falha ao registrar voto');
  return r.json();
}
