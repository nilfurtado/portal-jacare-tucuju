const express = require('express');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const {
  criarBackup,
  listarBackups,
  restaurarBackup,
  deletarBackup,
  limparBackupsAntigos
} = require('../lib/backup');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/**
 * GET /api/backup/list
 * Listar backups disponíveis
 */
router.get('/list', authJwt, requerePermissao('admin'), (req, res) => {
  try {
    const backups = listarBackups();
    res.json({
      total: backups.length,
      backups: backups
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * POST /api/backup/criar
 * Criar novo backup
 */
router.post('/criar', authJwt, requerePermissao('admin'), async (req, res) => {
  try {
    console.log('📦 Criando backup...');
    const backupFile = await criarBackup();
    limparBackupsAntigos(10);

    res.json({
      ok: true,
      mensagem: 'Backup criado com sucesso',
      arquivo: path.basename(backupFile),
      caminho: backupFile
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * POST /api/backup/restaurar
 * Restaurar backup
 */
router.post('/restaurar', authJwt, requerePermissao('admin'), async (req, res) => {
  try {
    const { arquivo } = req.body;

    if (!arquivo) {
      return res.status(400).json({ erro: 'Arquivo de backup não informado' });
    }

    // Validar caminho para evitar directory traversal
    const backupFile = path.join(__dirname, '../backups', path.basename(arquivo));

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ erro: 'Arquivo de backup não encontrado' });
    }

    console.log('🔄 Restaurando backup...');
    await restaurarBackup(backupFile);

    res.json({
      ok: true,
      mensagem: 'Backup restaurado com sucesso'
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * DELETE /api/backup/:arquivo
 * Deletar backup
 */
router.delete('/:arquivo', authJwt, requerePermissao('admin'), (req, res) => {
  try {
    const { arquivo } = req.params;

    // Validar caminho
    const backupFile = path.join(__dirname, '../backups', path.basename(arquivo));

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ erro: 'Arquivo de backup não encontrado' });
    }

    deletarBackup(backupFile);

    res.json({
      ok: true,
      mensagem: 'Backup deletado com sucesso'
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * GET /api/backup/download/:arquivo
 * Baixar backup
 */
router.get('/download/:arquivo', authJwt, requerePermissao('admin'), (req, res) => {
  try {
    const { arquivo } = req.params;

    // Validar caminho
    const backupFile = path.join(__dirname, '../backups', path.basename(arquivo));

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ erro: 'Arquivo de backup não encontrado' });
    }

    res.download(backupFile);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
