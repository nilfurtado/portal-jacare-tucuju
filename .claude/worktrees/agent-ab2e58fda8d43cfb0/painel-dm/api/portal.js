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
    const [noticias, catRaw, enquetes, videos, classificados, classCats, colunas, config] = await Promise.all([
      store.read('noticias', []),
      store.read('categorias', { categorias: [], municipios: [] }),
      store.read('enquetes', []),
      store.read('videos', []),
      store.read('classificados', []),
      store.read('classificados-categorias', []),
      store.read('colunas', []),
      store.read('config', {}),
    ]);

    res.json({
      noticias: noticias
        .filter(n => !n.removidoEm)
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 200),
      categorias: catRaw.categorias || [],
      municipios: catRaw.municipios || [],
      enquetes,
      videos,
      classificados,
      classificadosCategorias: classCats,
      colunas,
      config,
      geradoEm: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/noticia/:slug', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=120');
  const noticias = await store.read('noticias', []);
  const idx = noticias.findIndex(n => n.slug === req.params.slug && !n.removidoEm);
  if (idx < 0) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // Incrementa view
  await store.update('noticias', lista => {
    const i = lista.findIndex(n => n.slug === req.params.slug);
    if (i >= 0) lista[i].views = (lista[i].views || 0) + 1;
    return lista;
  });
  const refreshed = (await store.read('noticias', [])).find(n => n.slug === req.params.slug);
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

module.exports = router;
