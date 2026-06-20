/**
 * RSS IMPORTER — Integração com rss-feed-emitter
 * Importa feeds RSS automaticamente e cria notícias
 */

const RSSFeedEmitter = require('rss-feed-emitter');
const store = require('./store');
const { nextId } = require('./ids');

const emitter = new RSSFeedEmitter();
const activeFeeds = new Map();

// Categorias válidas do sistema
const CATEGORIAS_VALIDAS = [
  'geral',
  'economia',
  'politica',
  'saude',
  'tecnologia',
  'esportes',
  'cultura',
  'meio-ambiente',
  'educacao',
  'seguranca'
];

/**
 * Slugify para categoria
 * @param {string} text Texto para converter em slug
 * @returns {string} Slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Validar e criar categoria se necessário
 * @param {string} categoria Categoria do feed
 * @param {Array} categoriasDb Categorias do banco de dados
 * @returns {Promise<string>} Categoria válida ou criada
 */
async function validarCategoria(categoria, categoriasDb = null) {
  // Se não informada categoria, usar 'geral'
  if (!categoria) return 'geral';

  const catLower = categoria.toLowerCase().trim();

  // Se é uma categoria válida do sistema, usar
  if (CATEGORIAS_VALIDAS.includes(catLower)) {
    return catLower;
  }

  // Se há categorias do banco de dados, verificar
  if (!categoriasDb) {
    categoriasDb = await store.read('categorias', []);
  }

  // Procurar categoria existente
  const catExiste = categoriasDb.find(c =>
    c.slug?.toLowerCase() === catLower || c.nome?.toLowerCase() === catLower
  );

  if (catExiste) {
    return catExiste.slug || catLower;
  }

  // Se não existir, CRIAR nova categoria
  console.log(`[RSS Importer] Criando nova categoria: "${categoria}"`);

  const novaCategoria = {
    id: (Math.max(...categoriasDb.map(c => c.id || 0), 0) + 1),
    slug: slugify(categoria),
    nome: categoria,
    descricao: `Categoria importada automaticamente do feed RSS: ${categoria}`,
    cor: gerarCorAleatoria(),
    ativa: true,
    criadoEm: new Date().toISOString(),
    criadoPor: 'rss-importer'
  };

  // Salvar nova categoria
  await store.update('categorias', (lista) => {
    lista.push(novaCategoria);
    return lista;
  });

  console.log(`[RSS Importer] ✅ Categoria criada: "${novaCategoria.slug}"`);
  return novaCategoria.slug;
}

/**
 * Gerar cor aleatória para categoria
 * @returns {string} Cor em hexadecimal
 */
function gerarCorAleatoria() {
  const cores = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B88B', '#A8D8EA', '#AA96DA', '#FCBAD3'
  ];
  return cores[Math.floor(Math.random() * cores.length)];
}

/**
 * Helpers
 */
function estimarTempoLeitura(texto) {
  const palavras = (texto || '').split(/\s+/).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

/**
 * REGISTRAR LISTENERS ANTES DE QUALQUER INICIALIZAÇÃO
 * (Crítico para evitar UnhandledError no rss-feed-emitter)
 */
emitter.on('new-item', async (item) => {
  console.log(`[RSS Importer] Novo item recebido: ${item.title}`);

  try {
    const noticias = await store.read('noticias', []);
    const categorias = await store.read('categorias', []);
    const feed = Array.from(activeFeeds.values()).find(f =>
      item.meta.link.includes(new URL(f.url).hostname)
    );

    if (!feed) {
      console.warn('[RSS Importer] Feed origem não encontrado para:', item.title);
      return;
    }

    // Verificar se já existe (por link)
    const jaExiste = noticias.some(n => n.autoPostLink === item.link);
    if (jaExiste) {
      console.log('[RSS Importer] Notícia já importada:', item.title);
      return;
    }

    // Validar categoria
    const categoria = await validarCategoria(feed.categoria, categorias);

    // Criar nova notícia
    const novaNotizia = {
      id: nextId(noticias),
      slug: slugify(item.title),
      titulo: item.title,
      lide: (item.summary || item.description || '').substring(0, 200),
      conteudo: `${item.summary || item.description || ''}\n\n<hr/>\n<p><em>Fonte: <a href="${item.link}" target="_blank">${feed.nome}</a></em></p>`,
      categoria: categoria,
      autor: feed.nome,
      autorAvatar: '',
      data: item.pubdate || new Date().toISOString(),
      tags: [feed.nome, 'rss-import', categoria],
      destaque: false,
      views: 0,
      tempoLeitura: estimarTempoLeitura(item.description),
      criadoEm: new Date().toISOString(),
      criadoPor: 'rss-importer',
      autoPostFeedId: feed.id,
      autoPostLink: item.link,
      capa: {
        principal: item.image?.url || '/img/placeholder.jpg',
        destaque: item.image?.url || '/img/placeholder.jpg',
      },
      imagem: item.image?.url || '/img/placeholder.jpg',
    };

    // Salvar notícia
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
      return lista.slice(0, 500);
    });

    // Atualizar histórico
    await store.update('auto-post-historico', lista => {
      const ultimoHistorico = lista[0];
      if (ultimoHistorico && ultimoHistorico.feedId === feed.id &&
          new Date(ultimoHistorico.data).getTime() > Date.now() - 60000) {
        // Se foi nos últimos 60s, incrementar
        ultimoHistorico.importadas = (ultimoHistorico.importadas || 0) + 1;
      } else {
        // Senão, criar novo registro
        lista.unshift({
          data: new Date().toISOString(),
          feedNome: feed.nome,
          feedId: feed.id,
          importadas: 1,
        });
      }
      return lista.slice(0, 500);
    });

    console.log(`[RSS Importer] ✅ Notícia importada: ${item.title}`);
  } catch (err) {
    console.error('[RSS Importer] Erro ao processar item:', err.message);
  }
});

emitter.on('error', (err) => {
  console.error('[RSS Importer] Erro no emitter:', err.message);
});

/**
 * Inicializar importador RSS
 */
async function initRSSImporter() {
  console.log('[RSS Importer] Inicializando...');

  try {
    const feeds = await store.read('auto-post-feeds', []);

    feeds.forEach(feed => {
      if (!feed.ativo) return;

      addFeedListener(feed);
      console.log(`[RSS Importer] Feed adicionado: ${feed.nome}`);
    });

    console.log(`[RSS Importer] ${feeds.filter(f => f.ativo).length} feeds ativos carregados`);
  } catch (err) {
    console.error('[RSS Importer] Erro ao inicializar:', err.message);
  }
}

/**
 * Adicionar listener para um feed
 */
function addFeedListener(feed) {
  if (activeFeeds.has(feed.id)) return;

  try {
    emitter.add({
      url: feed.url,
      refresh: feed.intervalo * 3600 * 1000, // Converter horas para ms
      skipHours: [],
      skipDays: []
    });

    activeFeeds.set(feed.id, feed);
  } catch (err) {
    console.error(`[RSS Importer] Erro ao adicionar feed "${feed.nome}":`, err.message);
  }
}

/**
 * Remover listener de um feed
 */
function removeFeedListener(feedId) {
  activeFeeds.delete(feedId);
  console.log(`[RSS Importer] Feed ${feedId} removido`);
}


/**
 * Adicionar novo feed dinamicamente
 */
async function adicionarFeed(feedData) {
  addFeedListener(feedData);
  console.log(`[RSS Importer] Feed adicionado dinamicamente: ${feedData.nome}`);
}

/**
 * Remover feed dinamicamente
 */
async function removerFeed(feedId) {
  removeFeedListener(feedId);
  console.log(`[RSS Importer] Feed removido dinamicamente: ${feedId}`);
}

/**
 * Obter status dos feeds
 */
function getStatus() {
  return {
    feedsAtivos: activeFeeds.size,
    feeds: Array.from(activeFeeds.values()).map(f => ({
      id: f.id,
      nome: f.nome,
      url: f.url,
      ativo: true,
      intervaloMinutos: f.intervalo * 60,
    }))
  };
}

module.exports = {
  initRSSImporter,
  adicionarFeed,
  removerFeed,
  getStatus,
  emitter,
};
