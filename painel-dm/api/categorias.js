const express = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
console.log('[categorias.js] Módulo carregado');
router.use(authJwt);

// 🔄 Sincronizar automaticamente com portal (categorias.json e dados.json)
const sincronizarComPortal = async () => {
  try {
    const cats = getCategorias();

    // Sincronizar categorias.json
    const portalPath = path.resolve(__dirname, '../../data/categorias.json');
    fs.writeFileSync(portalPath, JSON.stringify(cats, null, 2), 'utf8');
    console.log('[categorias] ✅ categorias.json sincronizado');

    // Sincronizar dados.json (cache do portal)
    try {
      const dadosPath = path.resolve(__dirname, '../../data/dados.json');
      if (fs.existsSync(dadosPath)) {
        const dadosContent = fs.readFileSync(dadosPath, 'utf8');
        const dados = JSON.parse(dadosContent);

        // Atualizar categorias em dados.json
        if (dados.categorias && Array.isArray(dados.categorias)) {
          dados.categorias = cats;
          fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2), 'utf8');
          console.log('[categorias] ✅ dados.json sincronizado com', cats.length, 'categorias');
        }
      }
    } catch (e) {
      console.warn('[categorias] ⚠️ Não foi possível sincronizar dados.json:', e.message);
    }

    return true;
  } catch (err) {
    console.error('[categorias] ❌ Erro ao sincronizar:', err.message);
    return false;
  }
};

// 🎨 Sincronizar cores em tokens.css
const sincronizarTokensCSS = async () => {
  try {
    const cats = getCategorias();
    const tokensPath = path.resolve(__dirname, '../../css/tokens.css');

    // Ler o arquivo tokens.css completo
    let content = fs.readFileSync(tokensPath, 'utf8');

    // Criar bloco de cores atualizado
    const colorLines = cats.map(c => `  --cat-${c.slug}: ${c.cor};`).join('\n');

    // Padrão para encontrar a seção de categorias (entre comentário /* Categorias... */ e --cat-municipios)
    const pattern = /\/\* Categorias[\s\S]*?\*\/\s*\n([\s\S]*?)(  --cat-municipios:[^;]+;)/;

    const newContent = content.replace(
      pattern,
      `/* Categorias (sincronizadas com /data/categorias.json) */\n${colorLines}\n  --cat-municipios: #1565C0;`
    );

    fs.writeFileSync(tokensPath, newContent, 'utf8');
    console.log('[categorias] ✅ tokens.css atualizado com', cats.length, 'cores de categorias');
    return true;
  } catch (err) {
    console.error('[categorias] ❌ Erro ao sincronizar tokens.css:', err.message);
    return false;
  }
};

// Ler do arquivo JSON sincronizado (fonte de verdade)
const getCategorias = () => {
  console.log('[DEBUG] getCategorias() chamado');
  try {
    const file = path.resolve(__dirname, '../data/categorias.json');
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      console.log('[DEBUG] Retornando', data.length, 'categorias do JSON');
      return data;
    }
  } catch (err) {
    console.error('[categorias] ❌ Erro ao ler JSON:', err.message);
  }
  // Fallback para banco se JSON falhar
  try {
    const dbPath = path.resolve(__dirname, '../data/painel.db');
    const db = new Database(dbPath);
    const data = db.prepare('SELECT * FROM categorias ORDER BY ordem ASC').all();
    db.close();
    console.log('[DEBUG] Retornando', data.length, 'categorias do banco (fallback)');
    return data;
  } catch (e) {
    console.error('[categorias] ❌ Erro no fallback banco:', e.message);
  }
  return [];
};

router.get('/', async (_req, res) => {
  console.log('[CATEGORIAS-GET] Rota chamada!');
  const cats = getCategorias();

  // Incluir count de notícias por categoria
  const noticias = await store.read('noticias', []);
  const catsComCount = cats.map(c => ({
    ...c,
    noticiasCount: noticias.filter(n => n.categoria === c.slug).length,
    ultimaAtualizacao: noticias
      .filter(n => n.categoria === c.slug)
      .sort((a, b) => new Date(b.data) - new Date(a.data))[0]?.data || null
  }));

  res.json(catsComCount);
});

router.post('/', requerePermissao('categorias'), async (req, res) => {
  const { label, cor } = req.body || {};
  if (!label) {
    return res.status(400).json({ erro: 'Label obrigatório' });
  }
  const slug = slugify(label);
  const cats = getCategorias();
  if (cats.find(c => c.slug === slug)) {
    return res.status(409).json({ erro: 'Categoria já existe' });
  }
  const novaOrdem = (cats.length > 0 ? Math.max(...cats.map(c => c.ordem || 0)) : 0) + 1;
  const nova = { slug, label, nome: label, cor: cor || '#999999', ordem: novaOrdem };
  const catsNova = [...cats, nova];
  const file = path.resolve(__dirname, '../data/categorias.json');
  fs.writeFileSync(file, JSON.stringify(catsNova, null, 2), 'utf8');
  console.log('[categorias] ✅ Nova categoria criada:', slug);

  // 🎨 Sincronizar cores em tokens.css
  await sincronizarTokensCSS();

  res.status(201).json(nova);
});

router.put('/:slug', requerePermissao('categorias'), async (req, res) => {
  const { label, nome, cor, descricao, ordem, destaque } = req.body || {};

  try {
    const dbPath = path.resolve(__dirname, '../data/painel.db');
    const db = new Database(dbPath);

    // Preparar statement de update
    const updates = [];
    const values = [];

    if (label) { updates.push('nome = ?'); values.push(label); }
    if (nome) { updates.push('nome = ?'); values.push(nome); }
    if (cor) { updates.push('cor = ?'); values.push(cor); }
    if (descricao !== undefined) { updates.push('descricao = ?'); values.push(descricao); }
    if (ordem !== undefined) { updates.push('ordem = ?'); values.push(ordem); }
    if (destaque !== undefined) { updates.push('destaque = ?'); values.push(destaque ? 1 : 0); }

    values.push(req.params.slug);

    if (updates.length > 0) {
      const sql = `UPDATE categorias SET ${updates.join(', ')} WHERE slug = ?`;
      db.prepare(sql).run(...values);
      console.log('[categorias.put] ✅ Banco atualizado:', req.params.slug);
    }

    // IMPORTANTE: Ler do banco DEPOIS de atualizar para pegar os dados corretos
    const todasAtualizadas = db.prepare('SELECT * FROM categorias ORDER BY ordem ASC').all();
    db.close();

    // Estruturar e salvar no JSON
    const estruturado = todasAtualizadas.map(c => ({
      id: c.id,
      slug: c.slug,
      nome: c.nome,
      descricao: c.descricao,
      cor: c.cor,
      ordem: c.ordem,
      criadoEm: c.criadoEm
    }));

    const jsonPath = path.resolve(__dirname, '../data/categorias.json');
    fs.writeFileSync(jsonPath, JSON.stringify(estruturado, null, 2), 'utf8');

    // Retornar a categoria atualizada
    const atualizada = estruturado.find(c => c.slug === req.params.slug);
    if (!atualizada) {
      return res.status(404).json({ erro: 'Categoria não encontrada após atualização' });
    }

    console.log('[categorias.put] ✅ JSON sincronizado -', atualizada.nome, '- cor:', atualizada.cor);

    // 🔄 Sincronizar automaticamente com portal
    await sincronizarComPortal();

    // 🎨 Sincronizar cores em tokens.css
    await sincronizarTokensCSS();

    const noticias = await store.read('noticias', []);
    const resultado = {
      ...atualizada,
      noticiasCount: noticias.filter(n => n.categoria === atualizada.slug).length
    };

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao salvar categorias:', err);
    res.status(500).json({ erro: err.message });
  }
});

router.patch('/:slug/ordem', requerePermissao('categorias'), async (req, res) => {
  const { novaOrdem } = req.body || {};
  if (novaOrdem === undefined) return res.status(400).json({ erro: 'Ordem obrigatória' });

  try {
    const dbPath = path.resolve(__dirname, '../data/painel.db');
    const db = new Database(dbPath);
    db.prepare('UPDATE categorias SET ordem = ? WHERE slug = ?').run(novaOrdem, req.params.slug);

    // IMPORTANTE: Ler do banco DEPOIS de atualizar
    const todasAtualizadas = db.prepare('SELECT * FROM categorias ORDER BY ordem ASC').all();
    db.close();

    // Estruturar e salvar no JSON
    const estruturado = todasAtualizadas.map(c => ({
      id: c.id,
      slug: c.slug,
      nome: c.nome,
      descricao: c.descricao,
      cor: c.cor,
      ordem: c.ordem,
      criadoEm: c.criadoEm
    }));

    const jsonPath = path.resolve(__dirname, '../data/categorias.json');
    fs.writeFileSync(jsonPath, JSON.stringify(estruturado, null, 2), 'utf8');
    console.log('[categorias.patch] ✅ Ordem sincronizada:', req.params.slug, '→', novaOrdem);

    // 🔄 Sincronizar automaticamente com portal
    await sincronizarComPortal();

    // 🎨 Sincronizar cores em tokens.css
    await sincronizarTokensCSS();

    const atualizada = estruturado.find(c => c.slug === req.params.slug);
    res.json(atualizada);
  } catch (err) {
    console.error('[categorias.patch] ❌ Erro:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:slug', requerePermissao('categorias'), async (req, res) => {
  const noticias = await store.read('noticias', []);
  if (noticias.some(n => n.categoria === req.params.slug)) {
    return res.status(409).json({ erro: 'Categoria em uso por notícias' });
  }

  const cats = getCategorias();
  const i = cats.findIndex(c => c.slug === req.params.slug);

  if (i < 0) return res.status(404).json({ erro: 'Categoria não encontrada' });

  const removida = cats[i];
  const novasList = [...cats.slice(0, i), ...cats.slice(i + 1)];

  try {
    const file = path.resolve(__dirname, '../data/categorias.json');
    fs.writeFileSync(file, JSON.stringify(novasList, null, 2), 'utf8');

    // 🎨 Sincronizar cores em tokens.css
    await sincronizarTokensCSS();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
