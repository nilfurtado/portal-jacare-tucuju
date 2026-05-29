const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

/** GET / — listar todos */
router.get('/', async (_req, res) => {
  const ads = await store.read('anuncios', []);
  res.json(ads);
});

/** GET /:id — detalhe */
router.get('/:id', async (req, res) => {
  const ads = await store.read('anuncios', []);
  const ad = findById(ads, req.params.id);
  if (!ad) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json(ad);
});

/** POST / — criar novo slot (uso administrativo) */
router.post('/', requerePermissao('anuncios'), async (req, res) => {
  const body = req.body || {};
  if (!body.nome || !body.tamanho || !body.tipo) {
    return res.status(400).json({ erro: 'Informe nome, tipo e tamanho' });
  }
  const ads = await store.read('anuncios', []);
  const novo = {
    id: nextId(ads),
    nome: body.nome,
    tipo: body.tipo,
    tamanho: body.tamanho,
    posicao: body.posicao || '',
    paginas: Array.isArray(body.paginas) ? body.paginas : [],
    ativo: !!body.ativo,
    criativo: body.criativo || { imagem: '', html: '', titulo: '' },
    destino: body.destino || '',
    periodo: body.periodo || { inicio: null, fim: null },
    impressoes: 0,
    cliques: 0,
  };
  await store.update('anuncios', (lista) => [...lista, novo]);
  res.status(201).json(novo);
});

/** PUT /:id — editar slot */
router.put('/:id', requerePermissao('anuncios'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update('anuncios', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    atualizado = {
      ...prev,
      ...body,
      id: prev.id,
      criativo: { ...prev.criativo, ...(body.criativo || {}) },
      periodo:  { ...prev.periodo,  ...(body.periodo  || {}) },
      paginas:  Array.isArray(body.paginas) ? body.paginas : prev.paginas,
    };
    lista[i] = atualizado;
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json(atualizado);
});

/** PATCH /:id/ativar — toggle on/off */
router.patch('/:id/ativar', requerePermissao('anuncios'), async (req, res) => {
  let atualizado = null;
  await store.update('anuncios', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].ativo = !lista[i].ativo;
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json({ id: atualizado.id, ativo: atualizado.ativo });
});

/** DELETE /:id — remover slot */
router.delete('/:id', requerePermissao('anuncios'), async (req, res) => {
  let removido = null;
  await store.update('anuncios', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Anúncio não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
