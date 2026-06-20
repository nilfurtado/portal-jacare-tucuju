const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'classificados';

router.get('/', async (req, res) => {
  const { q = '', categoria = '', cidade = '', page = 1, perPage = 20 } = req.query;
  let items = await store.read(FILE, []);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(c => (c.titulo || '').toLowerCase().includes(needle));
  }
  if (categoria) items = items.filter(c => c.categoria === categoria);
  if (cidade)    items = items.filter(c => (c.cidade || '').toLowerCase() === cidade.toLowerCase());

  items.sort((a, b) => (b.id || 0) - (a.id || 0));
  const total = items.length;
  const p  = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.max(1, Math.min(100, parseInt(perPage, 10) || 20));
  res.json({
    total, page: p, perPage: pp,
    totalPages: Math.ceil(total / pp),
    items: items.slice((p - 1) * pp, (p - 1) * pp + pp),
  });
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const c = findById(items, req.params.id);
  if (!c) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json(c);
});

router.post('/', requerePermissao('classificados'), async (req, res) => {
  const body = req.body || {};
  if (!body.titulo) return res.status(400).json({ erro: 'Título obrigatório' });
  const items = await store.read(FILE, []);
  const novo = {
    id: nextId(items),
    titulo: body.titulo,
    preco: Number(body.preco) || 0,
    imagem: body.imagem || '',
    cidade: body.cidade || '',
    categoria: body.categoria || '',
    telefone: body.telefone || '',
  };
  await store.update(FILE, lista => [...lista, novo]);
  res.status(201).json(novo);
});

router.put('/:id', requerePermissao('classificados'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i] = {
      ...lista[i],
      titulo:    body.titulo    ?? lista[i].titulo,
      preco:     body.preco != null ? Number(body.preco) : lista[i].preco,
      imagem:    body.imagem    ?? lista[i].imagem,
      cidade:    body.cidade    ?? lista[i].cidade,
      categoria: body.categoria ?? lista[i].categoria,
      telefone:  body.telefone  ?? lista[i].telefone,
    };
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json(atualizado);
});

router.delete('/:id', requerePermissao('classificados'), async (req, res) => {
  let removido = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
