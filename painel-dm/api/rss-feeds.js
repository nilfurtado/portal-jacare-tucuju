/**
 * API: Gerenciar importação de feeds RSS
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const https = require('https');
const { parseStringPromise } = require('xml2js');
const store = require('../lib/store');
const { broadcast } = require('./eventos');

const FEEDS_CONFIG_PATH = path.resolve(__dirname, '..', 'data', 'auto-post-feeds.json');

function limparHtml(html) {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '')
    .replace(/&.*?;/g, '')
    .trim();
}

function extrairImagem(descricaoHtml) {
  const match = descricaoHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extrairImagemMedia(mediaContent) {
  if (!mediaContent || !Array.isArray(mediaContent)) return null;
  const media = mediaContent[0];
  if (typeof media === 'object' && media.url) {
    return Array.isArray(media.url) ? media.url[0] : media.url;
  }
  return null;
}

// Tentar extrair imagem da página do artigo como último recurso
async function extrairImagemDaPagina(linkUrl) {
  if (!linkUrl) return null;

  try {
    const res = await new Promise((resolve, reject) => {
      const protocol = linkUrl.startsWith('https') ? require('https') : require('http');
      let timeout = setTimeout(() => reject(new Error('timeout')), 8000);

      const request = protocol.get(linkUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      }, (r) => {
        if (r.statusCode !== 200) {
          clearTimeout(timeout);
          return reject(new Error('HTTP ' + r.statusCode));
        }

        let data = '';
        r.on('data', chunk => {
          data += chunk;
          // Se encontrou og:image, podemos parar de ler
          if (data.includes('og:image')) {
            clearTimeout(timeout);
            r.destroy();
          }
        });
        r.on('end', () => {
          clearTimeout(timeout);
          resolve(data);
        });
        r.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      request.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Procurar og:image com regex simples e eficiente
    const match = res.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                  res.match(/og:image[^>]*content=["']([^"']+)["']/i);

    if (match && match[1]) {
      console.log('[extrairImagemDaPagina] ✅ Encontrada:', match[1].substring(0, 60) + '...');
      return match[1];
    }

    // Procurar primeira img src se og:image não encontrada
    const imgMatch = res.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      console.log('[extrairImagemDaPagina] ✅ Encontrada <img>:', imgMatch[1].substring(0, 60) + '...');
      return imgMatch[1];
    }

    console.log('[extrairImagemDaPagina] ⚠️ Nenhuma imagem encontrada em:', linkUrl.substring(0, 60) + '...');
    return null;
  } catch (err) {
    console.error('[extrairImagemDaPagina] ❌ Erro:', err.message);
    return null;
  }
}

async function lerFeeds() {
  try {
    const data = await fs.readFile(FEEDS_CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function gravarFeeds(feeds) {
  await fs.writeFile(FEEDS_CONFIG_PATH, JSON.stringify(feeds, null, 2), 'utf8');
}

async function fetchRss(url, redirects = 0) {
  if (redirects > 5) {
    throw new Error('Muitos redirecionamentos');
  }

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');

    const options = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    protocol.get(url, options, (res) => {
      // Seguir redirecionamentos
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl) {
          return reject(new Error('Redirecionamento sem URL'));
        }
        return fetchRss(redirectUrl, redirects + 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        // Limpar entidades HTML problemáticas
        data = data
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&mdash;/g, '—')
          .replace(/&ldquo;/g, '"')
          .replace(/&rdquo;/g, '"')
          .replace(/&rsquo;/g, "'")
          .replace(/&lsquo;/g, "'")
          .replace(/&hellip;/g, '...')
          .replace(/&amp;/g, '&')
          // Remover comentários HTML (que quebram XML)
          .replace(/<!--[\s\S]*?-->/g, '');
        resolve(data);
      });
    }).on('error', reject);
  });
}

// POST /api/rss-feeds/validate - Validar URL de feed (DEVE ESTAR ANTES DE /:id)
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.json({ valido: false, erro: 'URL obrigatória' });
    }

    // Validar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return res.json({ valido: false, erro: 'URL inválida' });
    }

    // Buscar com timeout
    const xml = await Promise.race([
      fetchRss(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )
    ]);

    // Verificar se é XML/RSS
    if (!xml || typeof xml !== 'string') {
      return res.json({ valido: false, erro: 'Resposta inválida' });
    }

    if (xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
      return res.json({ valido: false, erro: 'Não é um feed RSS válido (HTML recebido)' });
    }

    const parsed = await parseStringPromise(xml, {
      explicitArray: true,
      mergeAttrs: true,
      normalizeTags: true,
      attrNameProcessors: [(name) => name.toLowerCase()],
      tagNameProcessors: [(name) => name.toLowerCase()],
      strict: false,
      validateOnly: false,
    });

    if (!parsed?.rss?.channel?.[0]) {
      console.error('[RSS-API] Estrutura parse:', JSON.stringify(Object.keys(parsed), null, 2));
      return res.json({ valido: false, erro: 'Feed RSS não encontrado ou estrutura inválida' });
    }

    const channel = parsed.rss.channel[0];
    if (!channel) {
      return res.json({ valido: false, erro: 'Feed RSS não encontrado' });
    }

    const items = parsed.rss.channel[0].item || [];
    const titulo = Array.isArray(channel.title) ? channel.title[0] : (channel.title || 'Feed');
    const descricao = Array.isArray(channel.description) ? channel.description[0] : (channel.description || '');
    const link = Array.isArray(channel.link) ? channel.link[0] : (channel.link || '');

    // Gerar preview dos itens (primeiros 15)
    const preview = items.slice(0, 15).map((item) => {
      const itemTitle = item.title?.[0] || '(sem título)';
      const itemDesc = limparHtml(item.description?.[0] || '').substring(0, 150) || '(sem descrição)';

      // Extrair imagem de múltiplas fontes (description, content:encoded, media:content)
      const imagem =
        extrairImagem(item.description?.[0] || '') ||
        extrairImagem(item['content:encoded']?.[0] || '') ||
        extrairImagemMedia(item['media:content']) ||
        null;

      return {
        title: itemTitle,
        description: itemDesc,
        imagem: imagem,
        link: Array.isArray(item.link) ? item.link[0] : (item.link || ''), // Incluir link para busca posterior
      };
    });

    res.json({
      valido: true,
      titulo: typeof titulo === 'string' ? titulo : String(titulo),
      descricao: typeof descricao === 'string' ? descricao.substring(0, 150) : '',
      link: typeof link === 'string' ? link : '',
      itens: items.length,
      preview: preview,
    });
  } catch (err) {
    console.error('[RSS-API] Erro validação:', err.message);
    res.json({
      valido: false,
      erro: 'Erro ao validar feed: ' + (err.message === 'Timeout' ? 'URL não respondeu' : err.message)
    });
  }
});

// GET /api/rss-feeds - Listar feeds
router.get('/', async (req, res) => {
  try {
    const feeds = await lerFeeds();
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/rss-feeds - Criar novo feed
router.post('/', async (req, res) => {
  try {
    const { nome, url, categoria, intervalo, auto, ativo } = req.body;

    if (!nome || !url || !categoria) {
      return res.status(400).json({ erro: 'Campos faltando' });
    }

    const feeds = await lerFeeds();
    const id = `${categoria}-${Date.now()}`;

    const novoFeed = {
      id,
      nome,
      url,
      categoria,
      intervalo: parseInt(intervalo) || 12,
      auto: auto !== false,
      ativo: ativo !== false,
      criadoEm: new Date().toISOString(),
      ultimaImportacao: null,
      proximaImportacao: new Date().toISOString(),
      totalImportado: 0,
      ultimosIds: [],
    };

    feeds.push(novoFeed);
    await gravarFeeds(feeds);
    res.status(201).json(novoFeed);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/rss-feeds/:id/importar - Importar feed
router.post('/:id/importar', async (req, res) => {
  try {
    const feeds = await lerFeeds();
    const feed = feeds.find(f => f.id === req.params.id);

    if (!feed) {
      return res.status(404).json({ erro: 'Feed não encontrado' });
    }

    console.log(`[RSS-API] 📡 Importando: ${feed.nome}`);

    // Buscar RSS
    const xml = await fetchRss(feed.url);
    const parsed = await parseStringPromise(xml, {
      explicitArray: true,
      mergeAttrs: true,
      normalizeTags: true,
      strict: false,
      validateOnly: false,
    });

    if (!parsed || !parsed.rss || !parsed.rss.channel || !Array.isArray(parsed.rss.channel)) {
      throw new Error('Estrutura RSS inválida: faltam elementos obrigatórios');
    }

    let items = parsed.rss.channel[0].item || [];

    // Filtrar por índices selecionados (se fornecidos)
    const { indices } = req.body || {};
    console.log(`[RSS-API] Indices recebidos:`, indices);
    if (indices && Array.isArray(indices) && indices.length > 0) {
      console.log(`[RSS-API] Total de items no feed: ${items.length}`);
      items = items.filter((_, idx) => indices.includes(idx));
      console.log(`[RSS-API] ✅ Filtrando para ${items.length} itens selecionados`);
    } else {
      console.log(`[RSS-API] ⚠️ Nenhum indice fornecido, usando todos os ${items.length} items`);
    }

    // Ler notícias atuais
    let noticias = await store.read('noticias', []);
    const titulosExistentes = new Set(noticias.map(n => n.titulo));
    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 0;

    let importadas = 0;
    const novasIds = [];

    // Extrair imagens rapidamente com timeout curto
    console.log(`[RSS-API] 📸 Extraindo imagens (timeout 2s) para ${items.length} itens...`);
    const itemsComImagem = await Promise.allSettled(
      items.map(async (item, idx) => {
        const linkUrl = Array.isArray(item.link) ? item.link[0] : (item.link || '');
        const titulo = item.title?.[0] || '';

        let imagemUrl =
          extrairImagem(item.description?.[0] || '') ||
          extrairImagem(item['content:encoded']?.[0] || '') ||
          extrairImagemMedia(item['media:content']);

        console.log(`[RSS-API] Item ${idx}: "${titulo.substring(0, 40)}" - Feed: ${imagemUrl ? '✅ tem' : '❌ sem'}`);

        // Só tentar página se não houver imagem no feed E tiver link
        if (!imagemUrl && linkUrl) {
          try {
            imagemUrl = await Promise.race([
              extrairImagemDaPagina(linkUrl),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
            console.log(`[RSS-API] Item ${idx}: Página ${imagemUrl ? '✅ achou' : '❌ não achou'}`);
          } catch (err) {
            console.log(`[RSS-API] Item ${idx}: Página ❌ erro: ${err.message}`);
          }
        }

        return { item, imagemUrl: imagemUrl || null };
      })
    );
    console.log(`[RSS-API] ✅ ${itemsComImagem.length} imagens processadas`);

    for (const resultado of itemsComImagem) {
      if (resultado.status !== 'fulfilled') continue;
      const { item, imagemUrl } = resultado.value;
      const titulo = item.title?.[0] || '';

      if (!titulo || titulosExistentes.has(titulo)) continue;

      const id = ++maxId;
      // Priorizar content:encoded (artigo completo) sobre description (resumo)
      const conteudoHtml = item['content:encoded']?.[0] || item.description?.[0] || '';
      const conteudoLimpo = limparHtml(conteudoHtml);
      const autor = item['dc:creator']?.[0] || item['dc:publisher']?.[0] || 'Redação';
      // imagemUrl já foi extraída acima com limite de concorrência

      const noticia = {
        id,
        slug: titulo
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80),
        titulo,
        lide: conteudoLimpo.substring(0, 300),
        conteudo: `<p>${conteudoLimpo.replace(/\n\n+/g, '</p><p>')}</p>`,
        categoria: feed.categoria,
        municipio: '',
        autor,
        autorAvatar: '',
        fonte: feed.nome,
        data: item.pubdate?.[0] || new Date().toISOString(),
        tags: JSON.stringify([feed.nome, 'rss-import', feed.categoria]),
        destaque: false,
        views: 0,
        tempoLeitura: Math.ceil(conteudoLimpo.split(/\s+/).length / 200),
        criadoEm: new Date().toISOString(),
        capa: imagemUrl
          ? {
              metadados: { alt: titulo, tamanho: 0, mime: 'image/jpeg', otimizacao: { jpeg: 0, webp: 0, reducao: 0 } },
              principal: imagemUrl,
              principalWebp: imagemUrl,
              homepage: imagemUrl,
              homepageWebp: imagemUrl,
              sidebar: imagemUrl,
              mobile: imagemUrl,
              mobileWebp: imagemUrl,
              social: imagemUrl,
              socialWebp: imagemUrl,
            }
          : null,
        imagem: imagemUrl || '',
      };

      noticias.push(noticia);
      titulosExistentes.add(titulo);
      importadas++;
      novasIds.push(id);

      // SALVAR INCREMENTALMENTE (a cada artigo)
      noticias.sort((a, b) => a.id - b.id);
      await store.write('noticias', noticias);
      console.log(`[RSS-API] ✅ ${importadas} de ${items.length} importadas...`);
    }

    const agora = new Date();
    const horaImportacao = agora.toLocaleString('pt-BR');

    if (importadas > 0) {

      const feedIdx = feeds.findIndex(f => f.id === req.params.id);
      if (feedIdx >= 0) {
        feeds[feedIdx].ultimaImportacao = agora.toISOString();
        feeds[feedIdx].proximaImportacao = new Date(Date.now() + feed.intervalo * 60 * 60 * 1000).toISOString();
        feeds[feedIdx].totalImportado = (feeds[feedIdx].totalImportado || 0) + importadas;
        feeds[feedIdx].ultimosIds = novasIds.slice(-10);
        await gravarFeeds(feeds);
      }

      console.log(`[RSS-API] ✅ ${feed.nome}: ${importadas} importadas em ${horaImportacao}`);
    }

    res.json({
      sucesso: true,
      importadas,
      totalNoticias: noticias.length,
      horaImportacao
    });
  } catch (err) {
    console.error('[RSS-API] Erro:', err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// POST /api/rss-feeds/importar-direto - Importar artigos sem criar feed
router.post('/importar-direto', async (req, res) => {
  try {
    const { url, categoria = 'geral', indices } = req.body;

    if (!url) {
      return res.status(400).json({ erro: 'URL obrigatória' });
    }

    console.log(`[RSS-API] 📡 Importando direto de: ${url}`);

    // Buscar RSS
    const xml = await fetchRss(url);
    const parsed = await parseStringPromise(xml, {
      explicitArray: true,
      mergeAttrs: true,
      normalizeTags: true,
      strict: false,
      validateOnly: false,
    });

    if (!parsed || !parsed.rss || !parsed.rss.channel || !Array.isArray(parsed.rss.channel)) {
      throw new Error('Estrutura RSS inválida');
    }

    const channel = parsed.rss.channel[0];
    const feedNome = Array.isArray(channel.title) ? channel.title[0] : (channel.title || 'Feed');

    let items = channel.item || [];

    // Filtrar por índices selecionados
    if (indices && Array.isArray(indices) && indices.length > 0) {
      console.log(`[RSS-API] Filtrando ${items.length} → ${indices.length} selecionados`);
      items = items.filter((_, idx) => indices.includes(idx));
    }

    // Ler notícias atuais
    let noticias = await store.read('noticias', []);
    const titulosExistentes = new Set(noticias.map(n => n.titulo));
    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 0;

    let importadas = 0;

    // Extrair imagens
    console.log(`[RSS-API] 📸 Extraindo imagens (timeout 2s) para ${items.length} itens...`);
    const itemsComImagem = await Promise.allSettled(
      items.map(async (item, idx) => {
        const linkUrl = Array.isArray(item.link) ? item.link[0] : (item.link || '');
        const titulo = item.title?.[0] || '';

        let imagemUrl =
          extrairImagem(item.description?.[0] || '') ||
          extrairImagem(item['content:encoded']?.[0] || '') ||
          extrairImagemMedia(item['media:content']);

        if (!imagemUrl && linkUrl) {
          try {
            imagemUrl = await Promise.race([
              extrairImagemDaPagina(linkUrl),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
          } catch (err) {
            // Ignorar erro de página
          }
        }

        return { item, imagemUrl: imagemUrl || null };
      })
    );

    for (const resultado of itemsComImagem) {
      if (resultado.status !== 'fulfilled') continue;
      const { item, imagemUrl } = resultado.value;
      const titulo = item.title?.[0] || '';

      if (!titulo || titulosExistentes.has(titulo)) continue;

      const id = ++maxId;
      const conteudoHtml = item['content:encoded']?.[0] || item.description?.[0] || '';
      const conteudoLimpo = limparHtml(conteudoHtml);
      const autor = item['dc:creator']?.[0] || item['dc:publisher']?.[0] || 'Redação';

      const noticia = {
        id,
        slug: titulo
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80),
        titulo,
        lide: conteudoLimpo.substring(0, 300),
        conteudo: `<p>${conteudoLimpo.replace(/\n\n+/g, '</p><p>')}</p>`,
        categoria,
        municipio: '',
        autor,
        autorAvatar: '',
        fonte: feedNome,
        data: item.pubdate?.[0] || new Date().toISOString(),
        tags: JSON.stringify([feedNome, 'rss-import', categoria]),
        destaque: false,
        views: 0,
        tempoLeitura: Math.ceil(conteudoLimpo.split(/\s+/).length / 200),
        criadoEm: new Date().toISOString(),
        capa: imagemUrl
          ? {
              metadados: { alt: titulo, tamanho: 0, mime: 'image/jpeg', otimizacao: { jpeg: 0, webp: 0, reducao: 0 } },
              principal: imagemUrl,
              principalWebp: imagemUrl,
              homepage: imagemUrl,
              homepageWebp: imagemUrl,
              sidebar: imagemUrl,
              mobile: imagemUrl,
              mobileWebp: imagemUrl,
              social: imagemUrl,
              socialWebp: imagemUrl,
            }
          : null,
        imagem: imagemUrl || '',
      };

      noticias.push(noticia);
      titulosExistentes.add(titulo);
      importadas++;

      noticias.sort((a, b) => a.id - b.id);
      await store.write('noticias', noticias);
      console.log(`[RSS-API] ✅ ${importadas} de ${items.length} importadas...`);
    }

    const agora = new Date();
    const horaImportacao = agora.toLocaleString('pt-BR');

    console.log(`[RSS-API] ✅ ${importadas} artigos importados em ${horaImportacao}`);

    // Broadcast para Portal em tempo real
    if (importadas > 0) {
      broadcast({
        tipo: 'noticias-importadas',
        quantidade: importadas,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      sucesso: true,
      importadas,
      totalNoticias: noticias.length,
      horaImportacao
    });
  } catch (err) {
    console.error('[RSS-API] Erro importar-direto:', err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// PUT /api/rss-feeds/:id - Atualizar feed
router.put('/:id', async (req, res) => {
  try {
    const { intervalo, ativo, nome } = req.body;
    const feeds = await lerFeeds();
    const feedIdx = feeds.findIndex(f => f.id === req.params.id);

    if (feedIdx < 0) return res.status(404).json({ erro: 'Feed não encontrado' });

    const feed = feeds[feedIdx];

    if (intervalo) {
      const valor = parseInt(intervalo);
      if (valor < 1 || valor > 168) {
        return res.status(400).json({ erro: 'Intervalo deve estar entre 1 e 168' });
      }
      feed.intervalo = valor;
      feed.proximaImportacao = new Date(Date.now() + valor * 60 * 60 * 1000).toISOString();
    }

    if (ativo !== undefined) feed.ativo = ativo;
    if (nome) feed.nome = nome;

    await gravarFeeds(feeds);

    console.log(`[RSS-API] ✅ Feed atualizado: ${feed.nome}`);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/rss-feeds/:id - Deletar feed
router.delete('/:id', async (req, res) => {
  try {
    const feeds = await lerFeeds();
    const feedIdx = feeds.findIndex(f => f.id === req.params.id);

    if (feedIdx < 0) return res.status(404).json({ erro: 'Feed não encontrado' });

    const feed = feeds[feedIdx];
    feeds.splice(feedIdx, 1);
    await gravarFeeds(feeds);

    console.log(`[RSS-API] ✅ Feed deletado: ${feed.nome}`);
    res.json({ mensagem: 'Feed deletado' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/rss-feeds/sincronizar - Sincronizar todos os feeds ativos
router.post('/sincronizar', async (req, res) => {
  try {
    const feeds = await lerFeeds();
    const feedsAtivos = feeds.filter(f => f.ativo);

    if (feedsAtivos.length === 0) {
      return res.json({
        sucesso: true,
        feedsSincronizados: 0,
        totalImportadas: 0,
        tempo: 0,
        mensagem: 'Nenhum feed ativo para sincronizar'
      });
    }

    console.log(`[RSS-API] 🔄 Sincronizando ${feedsAtivos.length} feeds ativos...`);
    const inicioSync = Date.now();

    let totalImportadas = 0;
    const resultados = [];

    for (const feed of feedsAtivos) {
      try {
        console.log(`[RSS-API] 📡 ${feed.nome}...`);

        // Buscar RSS
        const xml = await Promise.race([
          fetchRss(feed.url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
        ]);

        const parsed = await parseStringPromise(xml, {
          explicitArray: true,
          mergeAttrs: true,
          normalizeTags: true,
          strict: false,
          validateOnly: false,
        });

        if (!parsed?.rss?.channel?.[0]) {
          throw new Error('Estrutura RSS inválida');
        }

        let items = parsed.rss.channel[0].item || [];

        // Ler notícias atuais
        let noticias = await store.read('noticias', []);
        const titulosExistentes = new Set(noticias.map(n => n.titulo));
        let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 0;

        let importadas = 0;

        // Extrair imagens com timeout
        const itemsComImagem = await Promise.allSettled(
          items.map(async (item, idx) => {
            const linkUrl = Array.isArray(item.link) ? item.link[0] : (item.link || '');
            let imagemUrl =
              extrairImagem(item.description?.[0] || '') ||
              extrairImagem(item['content:encoded']?.[0] || '') ||
              extrairImagemMedia(item['media:content']);

            if (!imagemUrl && linkUrl) {
              try {
                imagemUrl = await Promise.race([
                  extrairImagemDaPagina(linkUrl),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
                ]);
              } catch (err) {
                // Ignorar erro
              }
            }

            return { item, imagemUrl: imagemUrl || null };
          })
        );

        // Processar itens
        for (const resultado of itemsComImagem) {
          if (resultado.status !== 'fulfilled') continue;
          const { item, imagemUrl } = resultado.value;
          const titulo = item.title?.[0] || '';

          if (!titulo || titulosExistentes.has(titulo)) continue;

          const id = ++maxId;
          const conteudoHtml = item['content:encoded']?.[0] || item.description?.[0] || '';
          const conteudoLimpo = limparHtml(conteudoHtml);
          const autor = item['dc:creator']?.[0] || item['dc:publisher']?.[0] || 'Redação';

          const noticia = {
            id,
            slug: titulo
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .substring(0, 80),
            titulo,
            lide: conteudoLimpo.substring(0, 300),
            conteudo: `<p>${conteudoLimpo.replace(/\n\n+/g, '</p><p>')}</p>`,
            categoria: feed.categoria,
            municipio: '',
            autor,
            autorAvatar: '',
            fonte: feed.nome,
            data: item.pubdate?.[0] || new Date().toISOString(),
            tags: JSON.stringify([feed.nome, 'rss-import', feed.categoria]),
            destaque: false,
            views: 0,
            tempoLeitura: Math.ceil(conteudoLimpo.split(/\s+/).length / 200),
            criadoEm: new Date().toISOString(),
            capa: imagemUrl
              ? {
                  metadados: { alt: titulo, tamanho: 0, mime: 'image/jpeg', otimizacao: { jpeg: 0, webp: 0, reducao: 0 } },
                  principal: imagemUrl,
                  principalWebp: imagemUrl,
                  homepage: imagemUrl,
                  homepageWebp: imagemUrl,
                  sidebar: imagemUrl,
                  mobile: imagemUrl,
                  mobileWebp: imagemUrl,
                  social: imagemUrl,
                  socialWebp: imagemUrl,
                }
              : null,
            imagem: imagemUrl || '',
          };

          noticias.push(noticia);
          titulosExistentes.add(titulo);
          importadas++;
        }

        // Salvar notícias
        if (importadas > 0) {
          noticias.sort((a, b) => a.id - b.id);
          await store.write('noticias', noticias);
        }

        // Atualizar feed
        const feedIdx = feeds.findIndex(f => f.id === feed.id);
        if (feedIdx >= 0) {
          feeds[feedIdx].ultimaImportacao = new Date().toISOString();
          feeds[feedIdx].proximaImportacao = new Date(Date.now() + feed.intervalo * 60 * 60 * 1000).toISOString();
          feeds[feedIdx].totalImportado = (feeds[feedIdx].totalImportado || 0) + importadas;
          await gravarFeeds(feeds);
        }

        totalImportadas += importadas;
        resultados.push({
          feed: feed.nome,
          importadas,
          sucesso: true
        });

        console.log(`[RSS-API] ✅ ${feed.nome}: ${importadas} importadas`);
      } catch (err) {
        console.error(`[RSS-API] ❌ ${feed.nome}: ${err.message}`);
        resultados.push({
          feed: feed.nome,
          erro: err.message,
          sucesso: false
        });
      }
    }

    const tempo = Date.now() - inicioSync;
    console.log(`[RSS-API] 🎉 Sincronização completa: ${totalImportadas} notícias em ${tempo}ms`);

    // Broadcast para portal em tempo real
    if (totalImportadas > 0) {
      broadcast({
        tipo: 'feeds-sincronizados',
        quantidade: totalImportadas,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      sucesso: true,
      feedsSincronizados: feedsAtivos.length,
      totalImportadas,
      tempo,
      resultados
    });
  } catch (err) {
    console.error('[RSS-API] Erro sincronização:', err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

module.exports = router;
