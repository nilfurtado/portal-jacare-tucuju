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
  const match = creatorXml.match(/^([^-]+)/);
  return match ? match[1].trim() : 'Agência Brasil';
}

function extrairImagemCorreta(descricaoHtml) {
  // Procura por <img src="..."> na descrição HTML
  const match = descricaoHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function importarComImagens() {
  console.log('🖼️  Reimportando com extração correta de imagens...\n');
  
  try {
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    let noticias = [];
    const titulosExistentes = new Set();
    
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      noticias = JSON.parse(data);
      // Manter apenas as 6 originais
      noticias = noticias.filter(n => n.id < 23);
      noticias.forEach(n => titulosExistentes.add(n.titulo));
      console.log(`📊 Mantidas: ${noticias.length} originais\n`);
    } catch (e) {
      noticias = [];
    }

    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 0;

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
    let comImagem = 0;

    console.log(`🔍 Verificando ${items.length} notícias...\n`);

    for (const item of items) {
      const titulo = item.title[0] || '';
      
      if (titulosExistentes.has(titulo)) {
        continue;
      }

      const id = ++maxId;
      const descricaoHtml = item.description[0] || '';
      const descricao = limparHtml(descricaoHtml);
      const autor = extrairAutor(item['dc:creator']?.[0]);
      const imagemUrl = extrairImagemCorreta(descricaoHtml);
      
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
        imagem: imagemUrl || ''
      };
      
      noticias.push(noticia);
      titulosExistentes.add(titulo);
      importadas++;
      
      const imgStatus = imagemUrl ? '✅' : '❌';
      console.log(`  ${id}. ${titulo.substring(0, 60)}... ${imgStatus}`);
      if (imagemUrl) comImagem++;
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   ✅ Importadas: ${importadas}`);
    console.log(`   🖼️  Com imagem: ${comImagem}/${importadas}`);

    noticias.sort((a, b) => a.id - b.id);

    console.log(`\n💾 Gravando ${noticias.length} notícias...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    console.log(`\n✅ COMPLETO!`);
    console.log(`📊 Total: ${noticias.length} notícias`);
    console.log(`🖼️  Com capas: ${noticias.filter(n => n.capa).length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

importarComImagens();
