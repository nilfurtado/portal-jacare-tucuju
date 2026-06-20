const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() !== 'log') console.log('[CONSOLE]', msg.type(), msg.text());
  });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(3000);
  
  const result = await page.evaluate(() => {
    const article = document.getElementById('article-root');
    const title = document.querySelector('.article__title');
    const lide = document.querySelector('.article__lide');
    const body = document.querySelector('.article__body');
    
    return {
      articleHTML: article ? article.innerHTML.substring(0, 200) : 'NO ARTICLE',
      titleHTML: title ? title.innerHTML.substring(0, 100) : 'NO TITLE',
      titleText: title ? title.textContent.substring(0, 100) : 'NO TITLE TEXT',
      titleHeight: title ? title.offsetHeight : 0,
      lideHTML: lide ? lide.innerHTML.substring(0, 100) : 'NO LIDE',
      lideHeight: lide ? lide.offsetHeight : 0,
      bodyHTML: body ? body.innerHTML.substring(0, 200) : 'NO BODY',
      bodyHeight: body ? body.offsetHeight : 0,
      bodyClass: body ? body.className : 'NO BODY',
    };
  });
  
  console.log('📄 Article Content Check:');
  console.log('Article HTML:', result.articleHTML);
  console.log('');
  console.log('Title:');
  console.log('  HTML:', result.titleHTML);
  console.log('  Text:', result.titleText);
  console.log('  Height:', result.titleHeight + 'px');
  console.log('');
  console.log('Lide:');
  console.log('  HTML:', result.lideHTML);
  console.log('  Height:', result.lideHeight + 'px');
  console.log('');
  console.log('Body:');
  console.log('  Class:', result.bodyClass);
  console.log('  HTML Length:', result.bodyHTML.length);
  console.log('  HTML:', result.bodyHTML);
  console.log('  Height:', result.bodyHeight + 'px');
  
  await browser.close();
})();
