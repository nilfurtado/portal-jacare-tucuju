const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const { nextId, findById } = require('../lib/ids');
const { adicionarFeed, removerFeed, getStatus } = require('../lib/rss-importer');

const router = express.Router();

// Middleware
router.use(authJwt);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse RSS feed (implementação básica)
 */
async function parsearRSS(url) {
  try {
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // Parse XML simples (em produção, usar xml-parser profissional)
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const itemXml = match[1];
      const titulo = extrairTag(itemXml, 'title');
      const link = extrairTag(itemXml, 'link');
      const descricao = extrairTag(itemXml, 'description');
      const pubDate = extrairTag(itemXml, 'pubDate');

      if (titulo && link) {
        items.push({
          titulo,
          link,
          descricao: descricao || '',
          data: pubDate || new Date().toISOString(),
        });
      }
    }

    return items;
  } catch (err) {
    console.error('[auto-post] Erro ao fazer parse de RSS:', err.message);
    throw err;
  }
}

/**
 * Extrai conteúdo de tag XML
 */
function extrairTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
    : '';
}

/**
 * Slug único para notícia
 */
function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Encontrar slug único
 */
function encontrarSlugUnico(titulo, slugsExistentes) {
  let slug = slugify(titulo);
  let contador = 1;
  while (slugsExistentes.includes(slug)) {
    slug = `${slugify(titulo)}-${contador}`;
    contador++;
  }
  return slug;
}

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /auto-post/status — Status do RSS importer
 */
router.get('/status', requerePermissao('noticias'), (req, res) => {
  const status = getStatus();
  res.json(status);
});

/**
 * GET /auto-post/feeds — Listar feeds e importadas
 */
router.get('/feeds', requerePermissao('noticias'), async (req, res) => {
  try {
    const feeds = await store.read('auto-post-feeds', []);
    const importadas = await store.read('auto-post-importadas', []);
    const historico = await store.read('auto-post-historico', []);

    res.json({
      feeds,
      importadas: importadas.slice(0, 20), // Últimas 20
      historico: historico.slice(0, 50),  // Últimos 50
      proximaExecucao: calcularProximaExecucao(feeds),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * POST /auto-post/feeds — Adicionar novo feed
 */
router.post('/feeds', requerePermissao('noticias'), async (req, res) => {
  const { nome, url, categoria, intervalo, auto } = req.body;

  if (!nome || !url) {
    return res.status(400).json({ erro: 'Nome e URL obrigatórios' });
  }

  try {
    // Validar URL do RSS
    const items = await parsearRSS(url);
    console.log(`[auto-post] Feed validado: ${items.length} itens encontrados`);

    const novo = {
      id: Date.now().toString(),
      nome: nome.trim(),
      url: url.trim(),
      categoria: categoria || 'geral',
      intervalo: Math.max(1, Math.min(24, intervalo || 6)),
      auto: !!auto,
      ativo: true,
      criadoEm: new Date().toISOString(),
      ultimaImportacao: null,
      proximaImportacao: new Date(Date.now() + (intervalo || 6) * 3600000).toISOString(),
      totalImportado: 0,
      ultimosIds: [], // Para evitar duplicatas
    };

    await store.update('auto-post-feeds', lista => {
      lista.push(novo);
      return lista;
    });

    // Adicionar ao RSS importer
    adicionarFeed(novo);

    res.json({ id: novo.id, nome: novo.nome });
  } catch (err) {
    res.status(400).json({ erro: `Erro ao validar feed: ${err.message}` });
  }
});

/**
 * DELETE /auto-post/feeds/:id — Remover feed
 */
router.delete('/feeds/:id', requerePermissao('noticias'), async (req, res) => {
  try {
    await store.update('auto-post-feeds', lista => {
      return lista.filter(f => f.id !== req.params.id);
    });

    // Remover do RSS importer
    removerFeed(req.params.id);

    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * POST /auto-post/executar — Executar importação agora
 */
router.post('/executar', requerePermissao('noticias'), async (req, res) => {
  try {
    const resultado = await executarImportacao();
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ============================================================================
// LÓGICA DE IMPORTAÇÃO
// ============================================================================

/**
 * Executar importação para todos os feeds
 */
async function executarImportacao() {
  const feeds = await store.read('auto-post-feeds', []);
  const noticias = await store.read('noticias', []);
  let totalImportadas = 0;

  for (const feed of feeds) {
    if (!feed.ativo) continue;

    const agora = new Date();
    const proximaExec = new Date(feed.proximaImportacao || 0);

    // Só importa se chegou a hora
    if (agora < proximaExec) continue;

    try {
      const items = await parsearRSS(feed.url);
      const slugsExistentes = noticias.map(n => n.slug);
      const ultimosIds = feed.ultimosIds || [];

      let importadasAgora = 0;

      for (const item of items) {
        // Evitar duplicatas
        const itemId = `${feed.id}:${item.titulo}`;
        if (ultimosIds.includes(itemId)) continue;

        const slug = encontrarSlugUnico(item.titulo, slugsExistentes);
        slugsExistentes.push(slug);

        const novaNotizia = {
          id: nextId(noticias),
          slug,
          titulo: item.titulo,
          lide: item.descricao.substring(0, 200),
          conteudo: `${item.descricao}\n\n<hr/>\n<p><em>Fonte: <a href="${item.link}" target="_blank">${feed.nome}</a></em></p>`,
          categoria: feed.categoria,
          autor: feed.nome,
          autorAvatar: '',
          data: item.data,
          tags: [feed.nome, 'auto-post', feed.categoria],
          destaque: false,
          views: 0,
          tempoLeitura: estimarTempoLeitura(item.descricao),
          criadoEm: new Date().toISOString(),
          criadoPor: 'auto-post',
          autoPostFeedId: feed.id,
          autoPostLink: item.link,
        };

        // Adicionar capa dummy (obrigatória)
        novaNotizia.capa = {
          principal: '/img/placeholder.jpg',
          destaque: '/img/placeholder.jpg',
        };

        await store.update('noticias', lista => {
          lista.push(novaNotizia);
          return lista;
        });

        // Registrar importação
        await store.update('auto-post-importadas', lista => {
          lista.unshift({
            id: novaNotizia.id,
            titulo: novaNotizia.titulo,
            lide: novaNotizia.lide,
            feedNome: feed.nome,
            feedId: feed.id,
            criadoEm: new Date().toISOString(),
          });
          return lista.slice(0, 500); // Manter últimas 500
        });

        importadasAgora++;
        totalImportadas++;
        ultimosIds.push(itemId);
      }

      // Atualizar feed
      await store.update('auto-post-feeds', lista => {
        const f = lista.find(x => x.id === feed.id);
        if (f) {
          f.ultimaImportacao = new Date().toISOString();
          f.proximaImportacao = new Date(Date.now() + f.intervalo * 3600000).toISOString();
          f.totalImportado = (f.totalImportado || 0) + importadasAgora;
          f.ultimosIds = ultimosIds.slice(-100); // Manter últimos 100
        }
        return lista;
      });

      // Log
      await store.update('auto-post-historico', lista => {
        lista.unshift({
          data: new Date().toISOString(),
          feedNome: feed.nome,
          feedId: feed.id,
          importadas: importadasAgora,
        });
        return lista.slice(0, 500);
      });

      console.log(`[auto-post] Feed "${feed.nome}": ${importadasAgora} importadas`);
    } catch (err) {
      console.error(`[auto-post] Erro no feed "${feed.nome}":`, err.message);

      // Log de erro
      await store.update('auto-post-historico', lista => {
        lista.unshift({
          data: new Date().toISOString(),
          feedNome: feed.nome,
          feedId: feed.id,
          erro: err.message,
        });
        return lista.slice(0, 500);
      });
    }
  }

  return { importadas: totalImportadas, feeds: feeds.length };
}

/**
 * Calcular próxima execução
 */
function calcularProximaExecucao(feeds) {
  const proximasExecs = feeds
    .filter(f => f.ativo)
    .map(f => new Date(f.proximaImportacao || 0).getTime())
    .filter(t => t > Date.now());

  return proximasExecs.length ? new Date(Math.min(...proximasExecs)).toISOString() : null;
}

/**
 * Estimar tempo de leitura
 */
function estimarTempoLeitura(texto) {
  const palavras = (texto || '').split(/\s+/).length;
  return Math.max(1, Math.ceil(palavras / 200)); // 200 palavras por minuto
}

module.exports = router;
