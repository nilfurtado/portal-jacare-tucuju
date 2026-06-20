const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'colunas';

router.get('/', async (_req, res) => {
  const items = await store.read(FILE, []);
  items.sort((a, b) => new Date(b.data) - new Date(a.data));
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const c = findById(items, req.params.id);
  if (!c) return res.status(404).json({ erro: 'Coluna não encontrada' });
  res.json(c);
});

router.post('/', requerePermissao('colunas'), async (req, res) => {
  const body = req.body || {};
  if (!body.colunista || !body.titulo) {
    return res.status(400).json({ erro: 'Informe colunista e título' });
  }
  const items = await store.read(FILE, []);
  const slug = slugify(`${body.colunista}-${body.titulo}`);
  const novo = {
    id: nextId(items),
    colunista: body.colunista,
    avatar: body.avatar || '',
    titulo: body.titulo,
    slug,
    data: body.data || new Date().toISOString(),
  };
  await store.update(FILE, lista => [...lista, novo]);
  res.status(201).json(novo);
});

router.put('/:id', requerePermissao('colunas'), async (req, res) => {
  const body = req.body || {};
  let atualizada = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    lista[i] = {
      ...prev,
      colunista: body.colunista ?? prev.colunista,
      avatar:    body.avatar    ?? prev.avatar,
      titulo:    body.titulo    ?? prev.titulo,
      data:      body.data      ?? prev.data,
      slug:      body.titulo ? slugify(`${body.colunista || prev.colunista}-${body.titulo}`) : prev.slug,
    };
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Coluna não encontrada' });
  res.json(atualizada);
});

router.delete('/:id', requerePermissao('colunas'), async (req, res) => {
  let removida = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removida) return res.status(404).json({ erro: 'Coluna não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
