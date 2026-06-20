/**
 * api/portal.js — endpoints públicos para o portal estático.
 * Sem auth, agrega tudo que data.js precisa em 1 request.
 * Espelha a versão PHP em painel-php/api/portal.php.
 */
const express = require('express');
const store = require('../lib/store');

const router = express.Router();

function noTimeWindow(p) {
  if (!p) return true;
  const t = Date.now();
  const ini = p.inicio ? new Date(p.inicio).getTime() : -Infinity;
  const fim = p.fim    ? new Date(p.fim).getTime()    : Infinity;
  return t >= ini && t <= fim;
}

router.get('/bootstrap', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  try {
    // Ler dados com defaults e error handling individual
    let noticias = [];
    let categorias = [];
    let municipios = [];
    let enquetes = [];
    let videos = [];
    let classificados = [];
    let classCats = [];
    let colunas = [];
    let anuncios = [];
    let categoriasColunas = [];
    let config = {};

    try { noticias = await store.read('noticias', []); } catch (e) { console.warn('[bootstrap] noticias error:', e.message); }
    try {
      const cat = await store.read('categorias', []);
      // categorias.json é um array, não um objeto com propriedade .categorias
      if (Array.isArray(cat)) {
        categorias = cat;
      } else if (cat && cat.categorias) {
        categorias = cat.categorias;
      }
    } catch (e) { console.warn('[bootstrap] categorias error:', e.message); }
    try { municipios = await store.read('municipios', []); } catch (e) { console.warn('[bootstrap] municipios error:', e.message); }
    try { enquetes = await store.read('enquetes', []); } catch (e) { console.warn('[bootstrap] enquetes error:', e.message); }
    try { videos = await store.read('videos', []); } catch (e) { console.warn('[bootstrap] videos error:', e.message); }
    try { classificados = await store.read('classificados', []); } catch (e) { console.warn('[bootstrap] classificados error:', e.message); }
    try { classCats = await store.read('classificados-categorias', []); } catch (e) { console.warn('[bootstrap] classificados-categorias error:', e.message); }
    try { colunas = await store.read('colunas', []); } catch (e) { console.warn('[bootstrap] colunas error:', e.message); }
    try { anuncios = await store.read('anuncios', []); } catch (e) { console.warn('[bootstrap] anuncios error:', e.message); }
    try { categoriasColunas = await store.read('categorias-colunas', []); } catch (e) { console.warn('[bootstrap] categorias-colunas error:', e.message); }
    try { config = await store.read('config', {}); } catch (e) { console.warn('[bootstrap] config error:', e.message); }

    res.json({
      noticias: (noticias || [])
        .filter(n => n && !n.removidoEm)
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 200),
      categorias: categorias || [],
      municipios: (municipios || []).map(m => ({
        slug: m.slug,
        label: m.nome || m.label,
        populacao: m.populacao || 0,
        imagem: m.imagem || '',
        descricao: m.descricao || '',
        estado: m.estado || '',
        criadoEm: m.criadoEm
      })),
      enquetes: enquetes || [],
      videos: videos || [],
      classificados: classificados || [],
      classificadosCategorias: classCats || [],
      colunas: colunas || [],
      categoriasColunas: categoriasColunas || [],
      anuncios: (anuncios || []).filter(a => a && a.ativo && noTimeWindow(a.periodo)).slice(0, 50),
      config: config || {},
      geradoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[bootstrap] fatal error:', err);
    res.status(500).json({ erro: err.message });
  }
});

router.get('/noticia/:slug', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=120');
  const noticias = await store.read('noticias', []);
  const param = req.params.slug;

  // Normalizar slug gerado (remove acentos e especiais)
  const normalizarSlug = (s) => {
    return s.toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Tentar encontrar por slug exato
  let noticia = noticias.find(n => n.slug === param && !n.removidoEm);

  // Se não encontrou, tentar por slug normalizado
  if (!noticia) {
    const paramNorm = normalizarSlug(param);
    noticia = noticias.find(n => normalizarSlug(n.slug || '') === paramNorm && !n.removidoEm);
  }

  // Se não encontrou, tentar por ID (fallback)
  if (!noticia) {
    noticia = noticias.find(n => n.id === param && !n.removidoEm);
  }

  if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // Incrementa view
  await store.update('noticias', lista => {
    const i = lista.findIndex(n => n.id === noticia.id);
    if (i >= 0) lista[i].views = (lista[i].views || 0) + 1;
    return lista;
  });

  const refreshed = (await store.read('noticias', [])).find(n => n.id === noticia.id);
  res.json(refreshed);
});

router.post('/voto/:enqueteId/:opcaoId', async (req, res) => {
  let opcoes = null;
  await store.update('enquetes', lista => {
    const i = lista.findIndex(e => e.id === req.params.enqueteId);
    if (i < 0) return lista;
    const o = lista[i].opcoes.find(x => x.id === req.params.opcaoId);
    if (!o) return lista;
    o.votos = (o.votos || 0) + 1;
    opcoes = lista[i].opcoes;
    return lista;
  });
  if (!opcoes) return res.status(404).json({ erro: 'Enquete ou opção não encontrada' });
  res.json({ ok: true, opcoes });
});

router.get('/sync-colunas', async (_req, res) => {
  try {
    const colunas = await store.read('colunas', []);
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(__dirname, '../../data/colunas.json');
    await fs.writeFile(filePath, JSON.stringify(colunas, null, 2));
    res.json({ ok: true, sincronizadas: colunas.length });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
