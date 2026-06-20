const express = require('express');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'classificados-categorias';

router.get('/', async (_req, res) => {
  res.json(await store.read(FILE, []));
});

router.post('/', requerePermissao('classificados'), async (req, res) => {
  const { label, cor, icon } = req.body || {};
  if (!label) return res.status(400).json({ erro: 'Label obrigatório' });
  const slug = slugify(label);
  const cats = await store.read(FILE, []);
  if (cats.find(c => c.slug === slug)) return res.status(409).json({ erro: 'Categoria já existe' });
  const nova = { slug, label, cor: cor || '#999', icon: icon || '' };
  await store.update(FILE, lista => [...lista, nova]);
  res.status(201).json(nova);
});

router.put('/:slug', requerePermissao('classificados'), async (req, res) => {
  const body = req.body || {};
  let atualizada = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(c => c.slug === req.params.slug);
    if (i < 0) return lista;
    lista[i] = { ...lista[i], label: body.label ?? lista[i].label, cor: body.cor ?? lista[i].cor, icon: body.icon ?? lista[i].icon };
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.json(atualizada);
});

router.delete('/:slug', requerePermissao('classificados'), async (req, res) => {
  let removida = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(c => c.slug === req.params.slug);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removida) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
