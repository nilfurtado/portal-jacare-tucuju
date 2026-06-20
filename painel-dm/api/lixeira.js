const express = require('express');
const store = require('../lib/store');
const { findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const { broadcast } = require('./eventos');
const { syncAnunciosToJson } = require('../lib/sync-anuncios');
const db = require('../lib/db');

const router = express.Router();
router.use(authJwt);

// ===== ROTAS ESPECIAIS PARA ANÚNCIOS (banco de dados) =====

/** GET: Listar anúncios na lixeira */
router.get('/anuncios-lixeira/lista', requerePermissao('lixeira'), async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM anuncios WHERE removidoEm IS NOT NULL ORDER BY removidoEm DESC');
    const anuncios = stmt.all();

    const parsed = anuncios.map(a => ({
      ...a,
      criativo: typeof a.criativo === 'string' ? JSON.parse(a.criativo || '{}') : a.criativo,
      periodo: typeof a.periodo === 'string' ? JSON.parse(a.periodo || '{}') : a.periodo
    }));

    res.json(parsed);
  } catch (err) {
    console.error('❌ Erro ao listar lixeira de anúncios:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

/** POST: Restaurar anúncio da lixeira */
router.post('/anuncios-lixeira/:id/restaurar', requerePermissao('lixeira'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const stmt = db.prepare('SELECT * FROM anuncios WHERE id=?');
    const anuncio = stmt.get(id);

    if (!anuncio) {
      return res.status(404).json({ success: false, erro: 'Anúncio não encontrado' });
    }

    if (!anuncio.removidoEm) {
      return res.status(400).json({ success: false, erro: 'Anúncio não está na lixeira' });
    }

    // Restaurar
    const updateStmt = db.prepare(`
      UPDATE anuncios
      SET removidoEm = NULL, removidoPor = NULL, atualizadoEm = ?
      WHERE id = ?
    `);
    updateStmt.run(new Date().toISOString(), id);

    // Sincronizar JSON
    await syncAnunciosToJson();

    // Broadcast
    broadcast({ tipo: 'anunciosAtualizados', acao: 'restaurado', id });

    res.json({ success: true, mensagem: 'Anúncio restaurado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao restaurar anúncio:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

/** DELETE: Deletar permanentemente da lixeira */
router.delete('/anuncios-lixeira/:id', requerePermissao('lixeira'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const stmt = db.prepare('SELECT * FROM anuncios WHERE id=?');
    const anuncio = stmt.get(id);

    if (!anuncio) {
      return res.status(404).json({ success: false, erro: 'Anúncio não encontrado' });
    }

    if (!anuncio.removidoEm) {
      return res.status(400).json({ success: false, erro: 'Anúncio não está na lixeira' });
    }

    // Deletar permanentemente
    const deleteStmt = db.prepare('DELETE FROM anuncios WHERE id=?');
    deleteStmt.run(id);

    // Sincronizar JSON
    await syncAnunciosToJson();

    // Broadcast
    broadcast({ tipo: 'anunciosAtualizados', acao: 'permanentemente_deletado', id });

    res.json({ success: true, mensagem: 'Anúncio deletado permanentemente' });
  } catch (err) {
    console.error('❌ Erro ao deletar permanentemente:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

// ===== ROTAS PARA MUNICÍPIOS (soft delete no JSON) =====

/** GET: Listar municípios na lixeira */
router.get('/municipios-lixeira/lista', requerePermissao('lixeira'), async (req, res) => {
  try {
    let items = await store.read('municipios', []);
    items = items.filter(m => m.removidoEm);
    items.sort((a, b) => new Date(b.removidoEm || 0) - new Date(a.removidoEm || 0));
    res.json(items);
  } catch (err) {
    console.error('❌ Erro ao listar lixeira de municípios:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

/** POST: Restaurar município da lixeira */
router.post('/municipios-lixeira/:slug/restaurar', requerePermissao('lixeira'), async (req, res) => {
  try {
    const slug = req.params.slug;
    let restaurado = null;

    await store.update('municipios', (lista) => {
      const m = lista.find(x => x.slug === slug);
      if (!m) throw new Error('Município não encontrado');
      if (!m.removidoEm) throw new Error('Município não está na lixeira');

      m.removidoEm = null;
      m.removidoPor = null;
      restaurado = m;
      return lista;
    });

    res.json({ success: true, mensagem: 'Município restaurado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao restaurar município:', err);
    res.status(400).json({ success: false, erro: err.message });
  }
});

/** DELETE: Deletar permanentemente da lixeira */
router.delete('/municipios-lixeira/:slug', requerePermissao('lixeira'), async (req, res) => {
  try {
    const slug = req.params.slug;
    let deletado = null;

    await store.update('municipios', (lista) => {
      const i = lista.findIndex(m => m.slug === slug);
      if (i < 0) throw new Error('Município não encontrado');
      if (!lista[i].removidoEm) throw new Error('Município não está na lixeira');

      deletado = lista[i];
      return [...lista.slice(0, i), ...lista.slice(i + 1)];
    });

    res.json({ success: true, mensagem: 'Município deletado permanentemente' });
  } catch (err) {
    console.error('❌ Erro ao deletar permanentemente:', err);
    res.status(400).json({ success: false, erro: err.message });
  }
});

// ===== ROTAS PARA NOTÍCIAS (soft delete no JSON) =====

/** GET: Listar notícias na lixeira */
router.get('/noticias-lixeira/lista', requerePermissao('lixeira'), async (req, res) => {
  try {
    let items = await store.read('noticias', []);
    // Filtrar: mostrar apenas deletadas
    items = items.filter(n => n.removidoEm);
    items.sort((a, b) => new Date(b.removidoEm || 0) - new Date(a.removidoEm || 0));
    res.json(items);
  } catch (err) {
    console.error('❌ Erro ao listar lixeira de notícias:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

/** POST: Restaurar notícia da lixeira */
router.post('/noticias-lixeira/:id/restaurar', requerePermissao('lixeira'), async (req, res) => {
  try {
    const id = req.params.id;
    let restaurada = null;

    await store.update('noticias', (lista) => {
      const i = indexById(lista, id);
      if (i < 0) return lista;

      if (!lista[i].removidoEm) {
        throw new Error('Notícia não está na lixeira');
      }

      // Restaurar
      lista[i].removidoEm = null;
      lista[i].removidoPor = null;
      lista[i].atualizadoEm = new Date().toISOString();
      restaurada = lista[i];
      return lista;
    });

    if (!restaurada) {
      return res.status(404).json({ success: false, erro: 'Notícia não encontrada' });
    }

    // Broadcast
    broadcast({ tipo: 'noticia-restaurada', id, titulo: restaurada.titulo });

    res.json({ success: true, mensagem: 'Notícia restaurada com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao restaurar notícia:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

/** DELETE: Deletar permanentemente da lixeira */
router.delete('/noticias-lixeira/:id', requerePermissao('lixeira'), async (req, res) => {
  try {
    const id = req.params.id;
    let deletada = null;

    await store.update('noticias', (lista) => {
      const i = indexById(lista, id);
      if (i < 0) return lista;

      if (!lista[i].removidoEm) {
        throw new Error('Notícia não está na lixeira');
      }

      deletada = lista[i];
      // Deletar permanentemente
      return [...lista.slice(0, i), ...lista.slice(i + 1)];
    });

    if (!deletada) {
      return res.status(404).json({ success: false, erro: 'Notícia não encontrada' });
    }

    // Broadcast
    broadcast({ tipo: 'noticia-deletada-permanente', id, titulo: deletada.titulo });

    res.json({ success: true, mensagem: 'Notícia deletada permanentemente' });
  } catch (err) {
    console.error('❌ Erro ao deletar permanentemente:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

// ===== ROTAS GENÉRICAS (JSON-based) =====

const TIPOS = {
  videos:      { lixeira: 'lixeira-videos',      original: 'videos' },
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

  // Sincronizar se for anúncios
  if (tipo.original === 'anuncios') {
    await syncAnunciosToJson();
  }

  // Broadcast de restauração
  broadcast({ tipo: 'restaurado', categoria: req.params.tipo, id: item.id, nome: limpo.titulo || limpo.nome });

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
