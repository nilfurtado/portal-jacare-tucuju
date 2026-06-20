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
  // Tenta: enclosure > media:content > image tags
  
  if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
    const url = item.enclosure[0].$.url;
    if (url && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
      return url;
    }
  }
  
  // media:content (WordPress)
  if (item['media:content']) {
    for (const media of item['media:content']) {
      if (media.$ && media.$.url && media.$.medium === 'image') {
        return media.$.url;
      }
    }
  }
  
  // Extrair URL do description (WordPress às vezes coloca <img>)
  if (item.description && item.description[0]) {
    const match = item.description[0].match(/<img[^>]+src="([^"]+)"/);
    if (match) return match[1];
  }
  
  return null;
}

async function importarMacapa() {
  console.log('🔄 Importando notícias da Agência Macapá (v2 - com imagens)...');
  
  try {
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    let noticias = [];
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      noticias = JSON.parse(data);
      noticias = noticias.filter(n => n.id < 23);
      console.log(`🗑️  Resetado para: ${noticias.length} notícias`);
    } catch (e) {
      noticias = [];
    }

    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 17;
    
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
    
    console.log(`📰 Encontradas ${items.length} notícias\n`);

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
      
      const capaStatus = imagemUrl ? '✅' : '⚠️ SEM IMAGEM';
      console.log(`  ${id}. ${tituloRaw.substring(0, 60)}... ${capaStatus}`);
    }

    noticias.sort((a, b) => a.id - b.id);

    console.log(`\n💾 Gravando ${noticias.length} notícias...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    const comImagem = noticias.filter(n => n.capa).length - 6;
    console.log(`\n✅ COMPLETO!`);
    console.log(`📊 Total: ${noticias.length} notícias`);
    console.log(`🖼️  Com imagem: ${comImagem}/10 Agência Macapá`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

importarMacapa();
