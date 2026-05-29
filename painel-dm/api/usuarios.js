const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

/** Remove campo senha antes de devolver para o cliente */
function sanitize(u) {
  if (!u) return u;
  const { senha, ...rest } = u;
  return rest;
}

router.get('/', requerePermissao('usuarios'), async (_req, res) => {
  const items = await store.read('usuarios', []);
  res.json(items.map(sanitize));
});

router.get('/:id', requerePermissao('usuarios'), async (req, res) => {
  const items = await store.read('usuarios', []);
  const u = findById(items, req.params.id);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(sanitize(u));
});

router.post('/', requerePermissao('usuarios'), async (req, res) => {
  const body = req.body || {};
  if (!body.nome || !body.email || !body.senha) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha' });
  }
  if (body.senha.length < 8) {
    return res.status(400).json({ erro: 'Senha mínima de 8 caracteres' });
  }
  const items = await store.read('usuarios', []);
  if (items.find(u => u.email?.toLowerCase() === body.email.toLowerCase())) {
    return res.status(409).json({ erro: 'E-mail já cadastrado' });
  }
  const hash = await bcrypt.hash(body.senha, 10);
  const novo = {
    id: nextId(items),
    nome: body.nome,
    email: body.email,
    senha: hash,
    tipo: body.tipo === 'colaborador' ? 'colaborador' : 'admin',
    status: body.status === 'N' ? 'N' : 'S',
    foto: body.foto || null,
    telefone: body.telefone || '',
    cidade: body.cidade || '',
    estado: body.estado || '',
    sobre: body.sobre || '',
    permissoes: body.permissoes || {
      paginas: [], categorias: [], municipios: [],
      colunas: [], anuncios: [], destinos: [],
      veiculacaoAds: false,
    },
    criadoEm: new Date().toISOString(),
    criadoPor: req.user.sub,
  };
  await store.update('usuarios', lista => [...lista, novo]);
  res.status(201).json(sanitize(novo));
});

router.put('/:id', requerePermissao('usuarios'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update('usuarios', async (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    const novaSenha = body.senha && body.senha.length >= 8
      ? await bcrypt.hash(body.senha, 10)
      : prev.senha;
    lista[i] = {
      ...prev,
      nome:       body.nome       ?? prev.nome,
      email:      body.email      ?? prev.email,
      senha:      novaSenha,
      tipo:       body.tipo       ?? prev.tipo,
      status:     body.status     ?? prev.status,
      foto:       body.foto       ?? prev.foto,
      telefone:   body.telefone   ?? prev.telefone,
      cidade:     body.cidade     ?? prev.cidade,
      estado:     body.estado     ?? prev.estado,
      sobre:      body.sobre      ?? prev.sobre,
      permissoes: body.permissoes ?? prev.permissoes,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: req.user.sub,
    };
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(sanitize(atualizado));
});

router.patch('/:id/status', requerePermissao('usuarios'), async (req, res) => {
  let atualizado = null;
  await store.update('usuarios', lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].status = lista[i].status === 'S' ? 'N' : 'S';
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json({ id: atualizado.id, status: atualizado.status });
});

router.delete('/:id', requerePermissao('usuarios'), async (req, res) => {
  if (Number(req.params.id) === Number(req.user.sub)) {
    return res.status(400).json({ erro: 'Você não pode remover a si mesmo' });
  }
  let removido = null;
  await store.update('usuarios', lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
