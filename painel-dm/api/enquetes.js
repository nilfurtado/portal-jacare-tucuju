const express = require('express');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'enquetes';

router.get('/', async (_req, res) => {
  const items = await store.read(FILE, []);
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const e = items.find(x => x.id === req.params.id);
  if (!e) return res.status(404).json({ erro: 'Enquete não encontrada' });
  res.json(e);
});

router.post('/', requerePermissao('enquetes'), async (req, res) => {
  const body = req.body || {};
  if (!body.pergunta) return res.status(400).json({ erro: 'Pergunta obrigatória' });
  if (!Array.isArray(body.opcoes) || body.opcoes.length < 2) {
    return res.status(400).json({ erro: 'Inclua pelo menos 2 opções' });
  }

  const items = await store.read(FILE, []);
  const baseId = body.id ? slugify(body.id) : slugify(body.pergunta);
  let id = baseId, n = 2;
  while (items.find(e => e.id === id)) id = `${baseId}-${n++}`;

  const nova = {
    id,
    pergunta: body.pergunta,
    opcoes: body.opcoes.map((o, i) => ({
      id: o.id ? slugify(o.id) : slugify(o.label) || `opc-${i + 1}`,
      label: o.label,
      votos: Number(o.votos) || 0,
    })),
    ativa: body.ativa !== false,
  };

  // Se essa for marcada ativa, desativa as demais
  await store.update(FILE, lista => {
    if (nova.ativa) lista.forEach(e => { e.ativa = false; });
    return [...lista, nova];
  });

  res.status(201).json(nova);
});

router.put('/:id', requerePermissao('enquetes'), async (req, res) => {
  const body = req.body || {};
  let atualizada = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(e => e.id === req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    const ativa = body.ativa ?? prev.ativa;
    if (ativa) lista.forEach((e, j) => { if (j !== i) e.ativa = false; });
    lista[i] = {
      ...prev,
      pergunta: body.pergunta ?? prev.pergunta,
      opcoes: Array.isArray(body.opcoes) ? body.opcoes.map((o, idx) => ({
        id: o.id ? slugify(o.id) : slugify(o.label) || `opc-${idx + 1}`,
        label: o.label,
        votos: Number(o.votos) || 0,
      })) : prev.opcoes,
      ativa,
    };
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Enquete não encontrada' });
  res.json(atualizada);
});

router.patch('/:id/ativar', requerePermissao('enquetes'), async (req, res) => {
  let atualizada = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(e => e.id === req.params.id);
    if (i < 0) return lista;
    const novoAtivo = !lista[i].ativa;
    if (novoAtivo) lista.forEach((e, j) => { if (j !== i) e.ativa = false; });
    lista[i].ativa = novoAtivo;
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Enquete não encontrada' });
  res.json({ id: atualizada.id, ativa: atualizada.ativa });
});

router.delete('/:id', requerePermissao('enquetes'), async (req, res) => {
  let removida = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(e => e.id === req.params.id);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removida) return res.status(404).json({ erro: 'Enquete não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
