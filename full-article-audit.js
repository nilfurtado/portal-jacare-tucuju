const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  console.log('\n📄 AUDITORIA COMPLETA - PÁGINA DE ARTIGO\n');

  for (const vp of viewports) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📱 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('='.repeat(80));

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:8000/noticia.html?id=90', { waitUntil: 'networkidle2' });
      await page.evaluate(() => new Promise(r => setTimeout(r, 2500)));

      const audit = await page.evaluate(() => {
        return {
          // HEADER
          header: {
            overflow: document.querySelector('header')?.scrollWidth > window.innerWidth
          },

          // ARTIGO
          article: {
            exists: !!document.querySelector('article'),
            overflow: document.querySelector('article')?.scrollWidth > window.innerWidth,
            title: document.querySelector('.article__editoria')?.textContent || 'N/A',
            titleOverflow: document.querySelector('h1')?.scrollWidth > window.innerWidth,
            lideExists: !!document.querySelector('.article__lide'),
            contentExists: !!document.querySelector('.article__body'),
            images: document.querySelectorAll('article img').length,
            paragraphs: document.querySelectorAll('.article__body p').length
          },

          // SIDEBAR
          sidebar: {
            visible: document.querySelector('.sidebar') ? window.getComputedStyle(document.querySelector('.sidebar')).display !== 'none' : false,
            overflow: document.querySelector('.sidebar')?.scrollWidth > window.innerWidth
          },

          // FOOTER
          footer: {
            exists: !!document.querySelector('footer'),
            overflow: document.querySelector('footer')?.scrollWidth > window.innerWidth
          },

          // GERAL
          general: {
            bodyOverflow: document.body.scrollWidth > window.innerWidth,
            totalImages: document.querySelectorAll('img').length,
            imagesWithoutAlt: document.querySelectorAll('img[alt=""]').length
          }
        };
      });

      // EXIBIR
      console.log('\n🔝 HEADER:');
      console.log(`   Overflow: ${audit.header.overflow ? '❌' : '✅'}`);

      console.log('\n📄 ARTIGO:');
      console.log(`   Existe: ${audit.article.exists ? '✅' : '❌'}`);
      console.log(`   Editoria: ${audit.article.title}`);
      console.log(`   Título overflow: ${audit.article.titleOverflow ? '❌' : '✅'}`);
      console.log(`   Lide: ${audit.article.lideExists ? '✅' : '❌'}`);
      console.log(`   Conteúdo: ${audit.article.contentExists ? '✅' : '❌'}`);
      console.log(`   Parágrafos: ${audit.article.paragraphs}`);
      console.log(`   Imagens: ${audit.article.images}`);
      console.log(`   Overflow: ${audit.article.overflow ? '❌' : '✅'}`);

      console.log('\n📰 SIDEBAR:');
      console.log(`   Visível: ${audit.sidebar.visible ? '✅' : '❌'}`);
      console.log(`   Overflow: ${audit.sidebar.overflow ? '❌' : '✅'}`);

      console.log('\n🔚 FOOTER:');
      console.log(`   Overflow: ${audit.footer.overflow ? '❌' : '✅'}`);

      console.log('\n📊 GERAL:');
      console.log(`   Body overflow: ${audit.general.bodyOverflow ? '❌' : '✅'}`);
      console.log(`   Total imagens: ${audit.general.totalImages}`);
      console.log(`   Sem ALT: ${audit.general.imagesWithoutAlt}`);

      const score = 
        (!audit.header.overflow ? 1 : 0) +
        (audit.article.exists ? 1 : 0) +
        (!audit.article.titleOverflow ? 1 : 0) +
        (audit.article.lideExists ? 1 : 0) +
        (audit.article.contentExists ? 1 : 0) +
        (!audit.sidebar.overflow ? 1 : 0) +
        (!audit.footer.overflow ? 1 : 0) +
        (!audit.general.bodyOverflow ? 1 : 0);

      console.log(`\n⭐ SCORE: ${score}/8`);

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
