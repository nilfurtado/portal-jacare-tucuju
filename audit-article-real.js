const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Primeiro pegar uma notícia que existe
  console.log('\n📄 AUDITORIA - PÁGINA DE ARTIGO (Com notícia real)\n');

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000/noticia.html?id=90', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

  const audit = await page.evaluate(() => {
    const article = document.querySelector('article');
    return {
      title: document.querySelector('h1')?.textContent?.substring(0, 80),
      titleOverflow: document.querySelector('h1')?.scrollWidth > window.innerWidth,
      hasLide: !!document.querySelector('.article__lide'),
      hasContent: !!document.querySelector('.article__body'),
      images: document.querySelectorAll('article img').length,
      articleOverflow: article?.scrollWidth > window.innerWidth,
      bodyOverflow: document.body.scrollWidth > window.innerWidth,
      footerOverflow: document.querySelector('footer')?.scrollWidth > window.innerWidth
    };
  });

  console.log('📄 MOBILE (375x812):');
  console.log(`   Título: "${audit.title}..."`);
  console.log(`   Título overflow: ${audit.titleOverflow ? '❌' : '✅'}`);
  console.log(`   Lide: ${audit.hasLide ? '✅' : '❌'}`);
  console.log(`   Conteúdo: ${audit.hasContent ? '✅' : '❌'}`);
  console.log(`   Imagens: ${audit.images}`);
  console.log(`   Artigo overflow: ${audit.articleOverflow ? '❌' : '✅'}`);
  console.log(`   Body overflow: ${audit.bodyOverflow ? '❌' : '✅'}`);
  console.log(`   Footer overflow: ${audit.footerOverflow ? '❌' : '✅'}`);

  const score = 
    (!audit.titleOverflow ? 1 : 0) +
    (audit.hasLide ? 1 : 0) +
    (audit.hasContent ? 1 : 0) +
    (!audit.articleOverflow ? 1 : 0) +
    (!audit.bodyOverflow ? 1 : 0) +
    (!audit.footerOverflow ? 1 : 0);

  console.log(`\n⭐ SCORE: ${score}/6`);

  await browser.close();
  process.exit(0);
})();
