const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() !== 'log') console.log('[console ' + msg.type() + ']', msg.text());
  });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
    
    console.log('Waiting for JS...');
    await page.waitForTimeout(4000);
    
    const result = await page.evaluate(() => {
      const article = document.getElementById('article-root');
      return {
        loaded: !!article,
        html: article ? article.innerHTML.substring(0, 150) : 'NO ARTICLE',
        hasTitle: !!document.querySelector('.article__title'),
        hasLide: !!document.querySelector('.article__lide'),
        hasError: article ? article.innerHTML.includes('Error:') : false,
      };
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
