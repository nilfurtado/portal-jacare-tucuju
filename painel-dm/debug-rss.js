const https = require('https');
const { parseStringPromise } = require('xml2js');

async function analisarRss() {
  console.log('🔍 Analisando estrutura do RSS da Agência Brasil...\n');
  
  const url = 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml';
  
  const xml = await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  const parsed = await parseStringPromise(xml);
  const items = parsed.rss.channel[0].item || [];

  console.log(`Total de itens: ${items.length}\n`);

  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];
    console.log(`\n📰 Item ${i + 1}: ${item.title[0].substring(0, 60)}...`);
    console.log('   Campos encontrados:');
    
    if (item.enclosure) {
      console.log(`   ✅ enclosure: ${item.enclosure[0].$.url}`);
    } else {
      console.log('   ❌ enclosure: não encontrado');
    }
    
    if (item['media:content']) {
      console.log(`   ✅ media:content: ${item['media:content'].length} tags`);
      item['media:content'].forEach((m, idx) => {
        console.log(`      [${idx}] url=${m.$.url?.substring(0, 80)}... medium=${m.$.medium}`);
      });
    } else {
      console.log('   ❌ media:content: não encontrado');
    }
    
    if (item['media:thumbnail']) {
      console.log(`   ✅ media:thumbnail: ${item['media:thumbnail'][0].$.url}`);
    } else {
      console.log('   ❌ media:thumbnail: não encontrado');
    }
    
    if (item.image) {
      console.log(`   ✅ image: ${JSON.stringify(item.image)}`);
    } else {
      console.log('   ❌ image: não encontrado');
    }
    
    // Procurar por <img> na descrição
    const desc = item.description[0];
    const imgMatch = desc.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      console.log(`   ✅ img src na descrição: ${imgMatch[1].substring(0, 80)}...`);
    } else {
      console.log('   ❌ img src na descrição: não encontrado');
    }
  }
  
  process.exit(0);
}

analisarRss().catch(err => {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});
