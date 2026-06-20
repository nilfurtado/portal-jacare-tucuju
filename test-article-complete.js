const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
    await page.waitForTimeout(3000);
    
    const result = await page.evaluate(() => {
      const article = document.getElementById('article-root');
      const title = document.querySelector('.article__title');
      const lide = document.querySelector('.article__lide');
      const body = document.querySelector('.article__body');
      const meta = document.querySelector('.article__meta');
      
      return {
        articleExists: !!article,
        titleText: title ? title.textContent.substring(0, 50) : null,
        lideText: lide ? lide.textContent.substring(0, 60) : null,
        bodyLength: body ? body.innerHTML.length : 0,
        metaExists: !!meta,
        bodyHasParagraphs: body ? (body.innerHTML.match(/<p/g) || []).length : 0,
      };
    });
    
    console.log('📄 Article Content Test:');
    console.log(`✅ Article exists: ${result.articleExists}`);
    console.log(`✅ Title: "${result.titleText}..."`);
    console.log(`✅ Lide: "${result.lideText}..."`);
    console.log(`✅ Body length: ${result.bodyLength} characters`);
    console.log(`✅ Paragraphs in body: ${result.bodyHasParagraphs}`);
    console.log(`✅ Meta info exists: ${result.metaExists}`);
  } finally {
    await browser.close();
  }
})();
