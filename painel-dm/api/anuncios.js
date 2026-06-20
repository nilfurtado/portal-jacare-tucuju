const express = require('express');
const { join, dirname } = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const db = require('../lib/db');
const store = require('../lib/store');
const { syncAnunciosToJson } = require('../lib/sync-anuncios');
const { broadcast } = require('./eventos');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

const DIMENSOES_LOCAIS = {
  '0': { width: 1018, height: 150 },
  '1': { width: 970, height: 150 },
  '2': { width: 300, height: 250 },
  '4': { width: 300, height: 600 },
  '10': { width: 970, height: 150 },
  '11': { width: 580, height: 400 },
  '12': { width: 280, height: 196 }
};

const TIPOS_POR_LOCAL = {
  '0': 'topbar-banner',
  '1': 'super-banner',
  '2': 'medium-rectangle',
  '4': 'half-page',
  '10': 'super-banner',
  '11': 'interstitial',
  '12': 'rectangle-medium'
};

// GET: Listar todos os anúncios (excluindo deletados)
router.get('/', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM anuncios WHERE removidoEm IS NULL ORDER BY id DESC');
    const anuncios = stmt.all();

    const parsed = anuncios.map(a => ({
      ...a,
      paginas: typeof a.paginas === 'string' ? JSON.parse(a.paginas || '["*"]') : a.paginas,
      criativo: typeof a.criativo === 'string' ? JSON.parse(a.criativo || '{}') : a.criativo,
      periodo: typeof a.periodo === 'string' ? JSON.parse(a.periodo || '{"inicio":null,"fim":null}') : a.periodo,
      historico: typeof a.historico === 'string' ? JSON.parse(a.historico || '[]') : a.historico
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

// GET: Obter um anúncio por ID
router.get('/:id', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM anuncios WHERE id = ?');
    const ad = stmt.get(parseInt(req.params.id));

    if (!ad) return res.status(404).json({ success: false, erro: 'Não encontrado' });

    const parsed = {
      ...ad,
      paginas: typeof ad.paginas === 'string' ? JSON.parse(ad.paginas || '["*"]') : ad.paginas,
      criativo: typeof ad.criativo === 'string' ? JSON.parse(ad.criativo || '{}') : ad.criativo,
      periodo: typeof ad.periodo === 'string' ? JSON.parse(ad.periodo || '{"inicio":null,"fim":null}') : ad.periodo,
      historico: typeof ad.historico === 'string' ? JSON.parse(ad.historico || '[]') : ad.historico
    };

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

// POST: Criar novo anúncio
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/anuncios - Dados recebidos:');
    console.log('  Body keys:', Object.keys(req.body));
    console.log('  Payload:', JSON.stringify(req.body, null, 2));

    const { nome, local, paginas, criativo, destino, periodo, ativo, modo, intervaloRotacao, imagens } = req.body;

    console.log(`  Valores: nome="${nome}", local="${local}", modo="${modo}", criativo=${criativo ? 'SIM' : 'NÃO'}`);

    if (!nome || local === null || local === undefined || local === '') {
      console.error('❌ Campos obrigatórios faltando!', { nome, local });
      return res.status(400).json({ success: false, erro: 'Nome e Local obrigatórios' });
    }

    // SEMPRE usar TIPOS_POR_LOCAL baseado na posição (local)
    const tipoCorreto = TIPOS_POR_LOCAL[local] || 'super-banner';

    // Montar criativo com modo e intervalo
    const criativoCompleto = {
      ...(criativo || {}),
      modo: modo || 'normal',
      intervaloRotacao: intervaloRotacao || 5,
      imagens: imagens || []
    };

    const stmt = db.prepare(`
      INSERT INTO anuncios (nome, tipo, local, paginas, criativo, destino, periodo, ativo, historico)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      nome,
      tipoCorreto,
      local,
      JSON.stringify(paginas || ['*']),
      JSON.stringify(criativoCompleto),
      destino || null,
      JSON.stringify(periodo || { inicio: null, fim: null }),
      ativo !== false ? 1 : 0,
      JSON.stringify([{
        data: new Date().toISOString(),
        campo: 'criacao',
        antes: null,
        depois: 'Anúncio criado',
        usuario: 'admin'
      }])
    );

    await syncAnunciosToJson();

    broadcast({ tipo: 'anunciosAtualizados', acao: 'criado', id: info.lastInsertRowid });

    res.json({ success: true, data: { id: info.lastInsertRowid, nome } });
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

// PUT: Atualizar anúncio
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, tipo, local, paginas, criativo, destino, periodo, ativo, modo, intervaloRotacao, imagens } = req.body;

    console.log('📝 PUT /api/anuncios/:id', { id, nome, local, tipo, modo });

    // Montar criativo com modo e intervalo
    const criativoCompleto = {
      ...(criativo || {}),
      modo: modo || 'normal',
      intervaloRotacao: intervaloRotacao || 5,
      imagens: imagens || []
    };

    if (!nome || local === null || local === undefined || local === '') {
      console.error('❌ Campos obrigatórios faltando:', { nome, local });
      return res.status(400).json({ success: false, erro: 'Nome e Local são obrigatórios' });
    }

    const stmt = db.prepare(`
      UPDATE anuncios
      SET nome=?, tipo=?, local=?, paginas=?, criativo=?, destino=?, periodo=?, ativo=?, atualizadoEm=?
      WHERE id=?
    `);

    stmt.run(
      nome,
      tipo || TIPOS_POR_LOCAL[local] || 'super-banner',
      local,
      JSON.stringify(paginas || ['*']),
      JSON.stringify(criativoCompleto),
      destino || null,
      JSON.stringify(periodo || { inicio: null, fim: null }),
      ativo !== false ? 1 : 0,
      new Date().toISOString(),
      id
    );

    console.log('✅ Atualizado ID', id);

    await syncAnunciosToJson();

    broadcast({ tipo: 'anunciosAtualizados', acao: 'atualizado', id });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro PUT:', err.message);
    res.status(500).json({ success: false, erro: err.message });
  }
});

// PATCH: Ativar/desativar ou atualizar campos
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { ativo, criativo, intervaloRotacao } = req.body;

    // Se atualizar criativo e/ou intervaloRotacao
    if (criativo || intervaloRotacao) {
      const stmt = db.prepare('SELECT criativo FROM anuncios WHERE id=?');
      const resultado = stmt.get(id);

      if (!resultado) {
        return res.status(404).json({ success: false, erro: 'Anúncio não encontrado' });
      }

      let criatObj = typeof resultado.criativo === 'string'
        ? JSON.parse(resultado.criativo)
        : resultado.criativo;

      if (criativo) {
        criatObj = typeof criativo === 'string' ? JSON.parse(criativo) : criativo;
      }
      if (intervaloRotacao) {
        criatObj.intervaloRotacao = intervaloRotacao;
      }

      const updateStmt = db.prepare('UPDATE anuncios SET criativo=?, atualizadoEm=? WHERE id=?');
      updateStmt.run(JSON.stringify(criatObj), new Date().toISOString(), id);
    }

    // Se atualizar ativo
    if (ativo !== undefined) {
      const updateStmt = db.prepare('UPDATE anuncios SET ativo=?, atualizadoEm=? WHERE id=?');
      updateStmt.run(ativo ? 1 : 0, new Date().toISOString(), id);
    }

    await syncAnunciosToJson();

    broadcast({ tipo: 'anunciosAtualizados', acao: 'atualizado', id });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erro PATCH:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

// DELETE: Mover anúncio para lixeira (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id || 'sistema';

    console.log(`🗑️ DELETE /api/anuncios/${id}`);

    const stmt = db.prepare('SELECT * FROM anuncios WHERE id=?');
    const anuncio = stmt.get(id);

    if (!anuncio) {
      console.error('❌ Anúncio não encontrado');
      return res.status(404).json({ success: false, erro: 'Anúncio não encontrado' });
    }

    console.log(`✅ Anúncio encontrado: ${anuncio.nome}`);

    // Soft delete: marcar como deletado em vez de remover
    console.log('🗑️ Movendo para lixeira...');
    const updateStmt = db.prepare(`
      UPDATE anuncios
      SET removidoEm = ?, removidoPor = ?, atualizadoEm = ?
      WHERE id = ?
    `);
    const agora = new Date().toISOString();
    const result = updateStmt.run(agora, userId, agora, id);
    console.log('✅ Movido para lixeira:', result.changes, 'linhas');

    // Sincronizar JSON
    console.log('📝 Sincronizando JSON...');
    await syncAnunciosToJson();
    console.log('✅ JSON sincronizado');

    // Broadcast para tempo real
    broadcast({ tipo: 'anunciosAtualizados', acao: 'deletado', id });

    res.json({ success: true, mensagem: 'Anúncio movido para lixeira' });
  } catch (err) {
    console.error('❌ Erro DELETE:', err);
    res.status(500).json({ success: false, erro: err.message });
  }
});

// POST: Registrar impressão
router.post('/:id/impressao', async (req, res) => {
  try {
    const stmt = db.prepare('UPDATE anuncios SET impressoes = impressoes + 1 WHERE id = ?');
    stmt.run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

// POST: Registrar clique
router.post('/:id/clique', async (req, res) => {
  try {
    const stmt = db.prepare('UPDATE anuncios SET cliques = cliques + 1 WHERE id = ?');
    stmt.run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

// POST: Upload de imagem (JPEG + WebP otimizado)
const fsSync = require('fs');
const { otimizeImage } = require('../lib/image-anuncios-optimizer');

router.post('/upload/imagem', (req, res, next) => {
  upload.single('imagem')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer:', err.message);
      return res.status(400).json({ success: false, erro: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, erro: 'Sem arquivo' });
    }

    // Validar MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        erro: `Formato inválido. Aceitos: JPG, PNG, GIF, WebP. Recebido: ${req.file.mimetype}`
      });
    }

    // Validar tamanho
    if (req.file.size > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        erro: 'Arquivo muito grande. Máximo 8MB.'
      });
    }

    const anuncioId = req.body.anuncioId || Date.now();
    const localId = req.body.localId || '10';
    const dimensoes = DIMENSOES_LOCAIS[localId] || { width: 970, height: 150 };

    // Path absoluto para o diretório de uploads
    const uploadDir = join(__dirname, '../public/img/uploads');

    // Garantir que diretório base existe
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
    }

    // Otimizar imagem (JPEG + WebP)
    console.log(`📤 Iniciando otimização JPEG+WebP para anúncio ${anuncioId}...`);
    const resultado = await otimizeImage(req.file.buffer, anuncioId, dimensoes, uploadDir);

    const tamanhoTotal = resultado.tamanhos.jpeg + resultado.tamanhos.webp;
    console.log(`✅ Upload concluído - Tamanho total otimizado: ${(tamanhoTotal / 1024).toFixed(0)}KB`);

    res.json({
      success: true,
      data: {
        jpeg: resultado.jpeg,
        webp: resultado.webp,
        tamanhos: resultado.tamanhos
      }
    });

  } catch (err) {
    console.error('❌ Upload erro:', err.message);
    res.status(500).json({ success: false, erro: err.message });
  }
});

module.exports = router;
