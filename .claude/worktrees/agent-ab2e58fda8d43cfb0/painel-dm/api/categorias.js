const express = require('express');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

// O arquivo data/categorias.json tem wrapper { categorias, municipios }
const FILE = 'categorias';
const KEY  = 'categorias';

router.get('/', async (_req, res) => {
  const cats = await store.read(FILE, [], KEY);
  res.json(cats);
});

router.post('/', requerePermissao('categorias'), async (req, res) => {
  const { label, cor } = req.body || {};
  if (!label) return res.status(400).json({ erro: 'Label obrigatório' });
  const slug = slugify(label);
  const cats = await store.read(FILE, [], KEY);
  if (cats.find(c => c.slug === slug)) {
    return res.status(409).json({ erro: 'Categoria já existe' });
  }
  const nova = { slug, label, cor: cor || '#999999' };
  await store.update(FILE, (lista) => [...lista, nova], [], KEY);
  res.status(201).json(nova);
});

router.put('/:slug', requerePermissao('categorias'), async (req, res) => {
  const { label, cor } = req.body || {};
  let atualizada = null;
  await store.update(FILE, (lista) => {
    const i = lista.findIndex(c => c.slug === req.params.slug);
    if (i < 0) return lista;
    lista[i] = { ...lista[i], label: label || lista[i].label, cor: cor || lista[i].cor };
    atualizada = lista[i];
    return lista;
  }, [], KEY);
  if (!atualizada) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.json(atualizada);
});

router.delete('/:slug', requerePermissao('categorias'), async (req, res) => {
  const noticias = await store.read('noticias', []);
  if (noticias.some(n => n.categoria === req.params.slug)) {
    return res.status(409).json({ erro: 'Categoria em uso por notícias' });
  }
  let removida = null;
  await store.update(FILE, (lista) => {
    const i = lista.findIndex(c => c.slug === req.params.slug);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  }, [], KEY);
  if (!removida) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
