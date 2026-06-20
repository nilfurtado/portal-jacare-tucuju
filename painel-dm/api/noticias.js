const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { slugify, uniqueSlug } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const { broadcast } = require('./eventos');

const router = express.Router();

// Função para extrair IP público do cliente
function obterIPPublico(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'desconhecido';
}

/** GET / — listar com filtros: q, categoria, autor, status, page, perPage (PÚBLICO) */
router.get('/', async (req, res) => {
  const { q = '', categoria = '', autor = '', status = '', page = 1, perPage = 20 } = req.query;
  const ipPublico = obterIPPublico(req);

  let items = await store.read('noticias', []);

  // Filtrar: excluir notícias deletadas (soft delete)
  items = items.filter(n => !n.removidoEm);

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(n =>
      (n.titulo || '').toLowerCase().includes(needle) ||
      (n.lide   || '').toLowerCase().includes(needle) ||
      (n.tags   || []).some(t => t.toLowerCase().includes(needle))
    );
  }
  if (categoria) items = items.filter(n => n.categoria === categoria);
  if (autor)     items = items.filter(n => (n.autor || '').toLowerCase().includes(autor.toLowerCase()));
  if (status === 'destaque') items = items.filter(n => n.destaque);
  if (status === 'normal')   items = items.filter(n => !n.destaque);

  items.sort((a, b) => new Date(b.data) - new Date(a.data));

  const total = items.length;
  const p  = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.max(1, Math.min(100, parseInt(perPage, 10) || 20));
  const start = (p - 1) * pp;
  const pageItems = items.slice(start, start + pp);

  // Adicionar IP aos itens
  pageItems.forEach(item => {
    item.ipPublico = ipPublico;
    item.dataVisualizacao = new Date().toISOString();
  });

  res.json({
    total,
    page: p,
    perPage: pp,
    totalPages: Math.ceil(total / pp),
    items: pageItems,
  });
});

/** GET /:id — detalhe */
router.get('/:id', async (req, res) => {
  const ipPublico = obterIPPublico(req);
  const noticias = await store.read('noticias', []);
  const n = findById(noticias, req.params.id);
  if (!n) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // Adicionar IP e data de visualização
  n.ipPublico = ipPublico;
  n.dataVisualizacao = new Date().toISOString();

  res.json(n);
});

// Autenticação obrigatória para modificar
router.use(authJwt);

/** POST / — criar */
router.post('/', requerePermissao('noticias'), async (req, res) => {
  const body = req.body || {};
  const ipPublico = obterIPPublico(req);
  if (!body.titulo) return res.status(400).json({ erro: 'Título obrigatório' });

  // Validação de capa: obrigatória para admin/colaborador, opcional para colunista/autor
  const isColunista = req.user && (req.user.tipo === 'colunista' || req.user.tipo === 'autor');
  if (!isColunista && (!body.capa || typeof body.capa !== 'object')) {
    return res.status(400).json({
      erro: 'Capa obrigatória. Faça upload via POST /api/noticias-capa/upload primeiro.'
    });
  }

  const noticias = await store.read('noticias', []);
  const slugs = noticias.map(n => n.slug);
  const slug = body.slug ? slugify(body.slug) : uniqueSlug(body.titulo, slugs);
  if (slugs.includes(slug)) {
    return res.status(409).json({ erro: 'Já existe notícia com esse slug' });
  }

  const novo = {
    id: nextId(noticias),
    slug,
    titulo: body.titulo,
    lide: body.lide || '',
    conteudo: body.conteudo || '',
    capa: body.capa, // Nova estrutura expandida
    imagem: body.capa?.principal || '', // Reversa-compatibilidade
    categoria: body.categoria || 'politica',
    colunista: body.colunista || '', // Campo para colunistas
    municipio: body.municipio || '',
    autor: body.autor || (req.user?.nome || 'Anônimo'),
    autorAvatar: body.autorAvatar || '',
    data: body.data || new Date().toISOString(),
    tags: Array.isArray(body.tags) ? body.tags : [],
    destaque: !!body.destaque,
    views: Number(body.views) || 0,
    tempoLeitura: Number(body.tempoLeitura) || estimarTempoLeitura(body.conteudo),
    criadoEm: new Date().toISOString(),
    criadoPor: req.user?.sub || 0,
    ipPublico: ipPublico,
    ipCriacao: ipPublico,
  };

  await store.update('noticias', (lista) => {
    lista.push(novo);
    return lista;
  });

  // Sincronizar JSON após criar notícia
  try {
    const { syncDbToJson } = require('../lib/sync-db-to-json');
    await syncDbToJson();
  } catch (err) {
    console.warn('⚠️ Erro ao sincronizar JSON:', err.message);
  }

  // Broadcast para Portal em tempo real
  broadcast({
    tipo: 'noticia-criada',
    id: novo.id,
    titulo: novo.titulo,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(novo);
});

/** PUT /:id — editar */
router.put('/:id', requerePermissao('noticias'), async (req, res) => {
  const body = req.body || {};
  const ipPublico = obterIPPublico(req);
  let atualizada = null;
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    const slug = body.slug ? slugify(body.slug) : prev.slug;
    if (slug !== prev.slug && lista.some(n => n.slug === slug)) {
      throw Object.assign(new Error('Slug já existe'), { status: 409 });
    }
    atualizada = {
      ...prev,
      ...body,
      id: prev.id,
      slug,
      tags: Array.isArray(body.tags) ? body.tags : prev.tags,
      tempoLeitura: body.conteudo ? estimarTempoLeitura(body.conteudo) : prev.tempoLeitura,
      // Se atualizar capa, atualizar também imagem para reversa-compatibilidade
      imagem: body.capa?.principal || prev.imagem,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: req.user.sub,
      ipEdicao: ipPublico,
    };
    lista[i] = atualizada;
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // Sincronizar JSON após atualização
  try {
    const { syncDbToJson } = require('../lib/sync-db-to-json');
    await syncDbToJson();
  } catch (err) {
    console.warn('⚠️ Erro ao sincronizar JSON:', err.message);
  }

  // Broadcast para Portal em tempo real
  broadcast({
    tipo: 'noticia-atualizada',
    id: atualizada.id,
    titulo: atualizada.titulo,
    timestamp: new Date().toISOString()
  });

  res.json(atualizada);
});

/** PATCH /:id/destaque — alternar destaque */
router.patch('/:id/destaque', requerePermissao('noticias'), async (req, res) => {
  let atualizada = null;
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].destaque = !lista[i].destaque;
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // Sincronizar JSON após alteração de destaque
  try {
    const { syncDbToJson } = require('../lib/sync-db-to-json');
    await syncDbToJson();
  } catch (err) {
    console.warn('⚠️ Erro ao sincronizar JSON:', err.message);
  }

  // Broadcast para Portal em tempo real
  broadcast({
    tipo: 'destaque-alterado',
    id: atualizada.id,
    destaque: atualizada.destaque,
    timestamp: new Date().toISOString()
  });

  res.json({ id: atualizada.id, destaque: atualizada.destaque });
});

/** DELETE /:id — soft delete → move para lixeira */
router.delete('/:id', requerePermissao('noticias'), async (req, res) => {
  let removida = null;
  const agora = new Date().toISOString();

  // Soft delete: marcar como removida em vez de deletar permanentemente
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removida = lista[i];
    // Marcar como removida
    lista[i].removidoEm = agora;
    lista[i].removidoPor = req.user.sub;
    lista[i].atualizadoEm = agora;
    return lista;
  });

  if (!removida) return res.status(404).json({ erro: 'Notícia não encontrada' });

  // JSON é sincronizado automaticamente via store.update() → writeNoticias()

  // Broadcast para Portal em tempo real
  broadcast({
    tipo: 'noticia-deletada',
    id: removida.id,
    titulo: removida.titulo,
    timestamp: agora
  });

  res.json({ ok: true, id: removida.id, mensagem: 'Notícia movida para lixeira' });
});

function estimarTempoLeitura(html) {
  const texto = String(html || '').replace(/<[^>]+>/g, ' ');
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 220));
}

module.exports = router;
