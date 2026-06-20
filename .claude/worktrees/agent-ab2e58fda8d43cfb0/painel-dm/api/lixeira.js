const express = require('express');
const store = require('../lib/store');
const { findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const TIPOS = {
  noticias:    { lixeira: 'lixeira-noticias',    original: 'noticias' },
  videos:      { lixeira: 'lixeira-videos',      original: 'videos' },
  anuncios:    { lixeira: 'lixeira-anuncios',    original: 'anuncios' },
  comentarios: { lixeira: 'lixeira-comentarios', original: 'comentarios' },
  classificados: { lixeira: 'lixeira-classificados', original: 'classificados' },
};

router.get('/:tipo', requerePermissao('lixeira'), async (req, res) => {
  const tipo = TIPOS[req.params.tipo];
  if (!tipo) return res.status(404).json({ erro: 'Tipo de lixeira inválido' });
  const items = await store.read(tipo.lixeira, []);
  items.sort((a, b) => new Date(b.removidoEm || 0) - new Date(a.removidoEm || 0));
  res.json(items);
});

/** Restaura → tira da lixeira e devolve ao arquivo original */
router.post('/:tipo/:id/restaurar', requerePermissao('lixeira'), async (req, res) => {
  const tipo = TIPOS[req.params.tipo];
  if (!tipo) return res.status(404).json({ erro: 'Tipo inválido' });

  let item = null;
  await store.update(tipo.lixeira, (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    item = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!item) return res.status(404).json({ erro: 'Item não encontrado na lixeira' });

  // Limpa metadados de remoção antes de devolver
  const { removidoEm, removidoPor, ...limpo } = item;
  await store.update(tipo.original, lista => [...lista, limpo]);
  res.json({ ok: true, id: item.id });
});

/** Hard delete → remove permanentemente da lixeira */
router.delete('/:tipo/:id', requerePermissao('lixeira'), async (req, res) => {
  const tipo = TIPOS[req.params.tipo];
  if (!tipo) return res.status(404).json({ erro: 'Tipo inválido' });
  let removido = null;
  await store.update(tipo.lixeira, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Item não encontrado' });
  res.json({ ok: true, id: removido.id });
});

/** Esvazia a lixeira inteira (hard delete em lote) */
router.delete('/:tipo', requerePermissao('lixeira'), async (req, res) => {
  const tipo = TIPOS[req.params.tipo];
  if (!tipo) return res.status(404).json({ erro: 'Tipo inválido' });
  await store.write(tipo.lixeira, []);
  res.json({ ok: true });
});

module.exports = router;
