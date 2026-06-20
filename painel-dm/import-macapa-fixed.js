const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { parseStringPromise } = require('xml2js');
const store = require('./lib/store');

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

function extrairImagem(item) {
  if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
    const url = item.enclosure[0].$.url;
    if (url && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
      return url;
    }
  }
  return null;
}

async function importarMacapa() {
  console.log('🔄 Importando notícias da Agência Macapá corretamente...');
  
  try {
    // Ler JSON atual
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    let noticias = [];
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      noticias = JSON.parse(data);
      
      // Deletar notícias incorretas da Agência Macapá (IDs 23-32)
      noticias = noticias.filter(n => n.id < 23);
      console.log(`🗑️  Removidas notícias incorretas. Restam: ${noticias.length}`);
    } catch (e) {
      console.log('📝 JSON vazio, iniciando nova lista');
      noticias = [];
    }

    // Pegar próximo ID
    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 17;
    console.log(`📌 Próximo ID: ${maxId + 1}`);

    // Buscar feed RSS
    const url = 'https://agencia.macapa.ap.gov.br/feed/';
    console.log(`📡 Buscando feed: ${url}`);
    
    const xml = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const parsed = await parseStringPromise(xml);
    const items = parsed.rss.channel[0].item || [];
    
    console.log(`📰 Encontradas ${items.length} notícias`);

    // Processar cada item
    for (const item of items) {
      const id = ++maxId;
      
      const tituloRaw = item.title[0] || '';
      const descricao = limparHtml(item.description[0] || '');
      const imagemUrl = extrairImagem(item);
      
      const noticia = {
        id,
        slug: tituloRaw.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80),
        titulo: tituloRaw,
        lide: descricao.substring(0, 300),
        conteudo: `<p>${descricao.replace(/\n\n+/g, '</p><p>')}</p>`,
        categoria: 'geral',
        municipio: '',
        autor: 'Agência Macapá',
        autorAvatar: '',
        fonte: 'Agência Macapá',
        data: item.pubDate[0] || new Date().toISOString(),
        tags: '["Agência Macapá","rss-import","macapá"]',
        destaque: false,
        views: 0,
        tempoLeitura: Math.ceil(descricao.split(/\s+/).length / 200),
        criadoEm: new Date().toISOString(),
        capa: imagemUrl ? {
          metadados: {
            alt: tituloRaw,
            tamanho: 0,
            mime: 'image/jpeg',
            otimizacao: { jpeg: 0, webp: 0, reducao: 0 }
          },
          principal: imagemUrl,
          principalWebp: imagemUrl,
          homepage: imagemUrl,
          homepageWebp: imagemUrl,
          sidebar: imagemUrl,
          mobile: imagemUrl,
          mobileWebp: imagemUrl,
          social: imagemUrl,
          socialWebp: imagemUrl
        } : null,
        imagem: imagemUrl || ''
      };
      
      noticias.push(noticia);
      console.log(`  ✅ ID ${id}: ${tituloRaw.substring(0, 60)}...`);
    }

    // Ordenar por ID
    noticias.sort((a, b) => a.id - b.id);

    // Gravar JSON
    console.log(`\n💾 Gravando ${noticias.length} notícias no JSON...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    // Sincronizar no SQLite via store
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    console.log(`\n✅ SUCESSO! ${items.length} notícias importadas corretamente`);
    console.log(`📊 Total no sistema: ${noticias.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

importarMacapa();
