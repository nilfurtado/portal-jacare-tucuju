const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { slugify, uniqueSlug } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'paginas';

router.get('/', async (_req, res) => {
  const items = await store.read(FILE, []);
  items.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const p = findById(items, req.params.id);
  if (!p) return res.status(404).json({ erro: 'Página não encontrada' });
  res.json(p);
});

router.post('/', requerePermissao('paginas'), async (req, res) => {
  const body = req.body || {};
  if (!body.titulo) return res.status(400).json({ erro: 'Título obrigatório' });
  const items = await store.read(FILE, []);
  const slug = uniqueSlug(body.slug || body.titulo, items.map(i => i.slug));
  const novo = {
    id: nextId(items),
    slug,
    titulo: body.titulo,
    conteudo: body.conteudo || '',
    visivelMenu: !!body.visivelMenu,
    ordem: Number(body.ordem) || (items.length + 1),
    atualizadoEm: new Date().toISOString(),
  };
  await store.update(FILE, lista => [...lista, novo]);
  res.status(201).json(novo);
});

router.put('/:id', requerePermissao('paginas'), async (req, res) => {
  const body = req.body || {};
  let atualizada = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    lista[i] = {
      ...prev,
      titulo:      body.titulo      ?? prev.titulo,
      conteudo:    body.conteudo    ?? prev.conteudo,
      slug:        body.slug ? slugify(body.slug) : prev.slug,
      visivelMenu: body.visivelMenu != null ? !!body.visivelMenu : prev.visivelMenu,
      ordem:       body.ordem != null ? Number(body.ordem) : prev.ordem,
      atualizadoEm: new Date().toISOString(),
    };
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Página não encontrada' });
  res.json(atualizada);
});

router.delete('/:id', requerePermissao('paginas'), async (req, res) => {
  let removida = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removida) return res.status(404).json({ erro: 'Página não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
