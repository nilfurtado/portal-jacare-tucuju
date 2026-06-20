/**
 * API do Portal - Bootstrap e configurações iniciais
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/portal/bootstrap
 * Retorna configurações e dados iniciais para o portal
 */
router.get('/bootstrap', (req, res) => {
  try {
    const bootstrap = {
      success: true,
      data: {
        tema: 'light',
        idioma: 'pt-BR',
        features: {
          lazyLoad: true,
          realTime: true,
          darkMode: true,
          anuncios: true,
          videos: true,
          enquetes: true
        },
        server: {
          portalUrl: 'http://localhost:8000',
          painelUrl: 'http://localhost:3000'
        }
      }
    };

    res.json(bootstrap);
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

/**
 * GET /api/portal/config
 * Retorna configurações do portal
 */
router.get('/config', (req, res) => {
  try {
    const config = {
      success: true,
      data: {
        siteName: 'Portal Jacaré Tucujú',
        siteUrl: 'http://localhost:8000',
        maxUploadSize: '8MB',
        imageFormats: ['JPEG', 'WebP', 'PNG', 'GIF'],
        cache: {
          enabled: true,
          ttl: 3600
        }
      }
    };

    res.json(config);
  } catch (err) {
    res.status(500).json({ success: false, erro: err.message });
  }
});

module.exports = router;
