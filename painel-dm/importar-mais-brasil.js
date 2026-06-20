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

function extrairAutor(creatorXml) {
  if (!creatorXml) return 'Agência Brasil';
  // "João Silva - Repórter da Agência Brasil" → "João Silva"
  const match = creatorXml.match(/^([^-]+)/);
  return match ? match[1].trim() : 'Agência Brasil';
}

async function importarMais() {
  console.log('🔄 Importando mais notícias da Agência Brasil...\n');
  
  try {
    // Ler JSON atual
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    let noticias = [];
    const titulosExistentes = new Set();
    
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      noticias = JSON.parse(data);
      noticias.forEach(n => titulosExistentes.add(n.titulo));
      console.log(`📊 Existentes: ${noticias.length} notícias`);
      console.log(`   IDs: ${noticias.map(n => n.id).join(', ')}\n`);
    } catch (e) {
      noticias = [];
    }

    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 0;

    // Buscar feed
    const url = 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml';
    console.log(`📡 Buscando: ${url}\n`);
    
    const xml = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const parsed = await parseStringPromise(xml);
    const items = parsed.rss.channel[0].item || [];
    
    let importadas = 0;
    let duplicadas = 0;

    console.log(`🔍 Verificando ${items.length} notícias do feed...\n`);

    for (const item of items) {
      const titulo = item.title[0] || '';
      
      // Verificar se já existe
      if (titulosExistentes.has(titulo)) {
        duplicadas++;
        continue;
      }

      const id = ++maxId;
      const descricao = limparHtml(item.description[0] || '');
      const autor = extrairAutor(item['dc:creator']?.[0]);
      const imagemUrl = item.enclosure?.[0]?.$?.url || '';
      
      const noticia = {
        id,
        slug: titulo.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80),
        titulo,
        lide: descricao.substring(0, 300),
        conteudo: `<p>${descricao.replace(/\n\n+/g, '</p><p>')}</p>`,
        categoria: 'geral',
        municipio: '',
        autor,
        autorAvatar: '',
        fonte: 'Redação Jacaré Tucujú',
        data: item.pubDate[0] || new Date().toISOString(),
        tags: '["Agência Brasil","rss-import","geral"]',
        destaque: false,
        views: 0,
        tempoLeitura: Math.ceil(descricao.split(/\s+/).length / 200),
        criadoEm: new Date().toISOString(),
        capa: imagemUrl ? {
          metadados: {
            alt: titulo,
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
        imagem: imagemUrl
      };
      
      noticias.push(noticia);
      titulosExistentes.add(titulo);
      importadas++;
      
      console.log(`  ✅ ID ${id}: ${titulo.substring(0, 60)}...`);
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   ✅ Importadas: ${importadas} novas`);
    console.log(`   ⏭️  Duplicadas (ignoradas): ${duplicadas}`);

    noticias.sort((a, b) => a.id - b.id);

    console.log(`\n💾 Gravando ${noticias.length} notícias...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    console.log(`\n✅ COMPLETO!`);
    console.log(`📊 Total agora: ${noticias.length} notícias`);
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

importarMais();
