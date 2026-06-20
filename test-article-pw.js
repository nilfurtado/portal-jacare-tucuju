const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  // Listen to all console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('Page error:', err);
  });
  
  try {
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas', { waitUntil: 'networkidle' });
    
    // Wait a bit for JS to run
    await page.waitForTimeout(3000);
    
    // Check what's in article-root
    const content = await page.evaluate(() => {
      const article = document.getElementById('article-root');
      if (!article) return 'article-root NOT FOUND';
      
      const html = article.innerHTML;
      if (html.includes('Carregando')) return 'Still shows Carregando...';
      if (html.includes('article__title')) return 'Article rendered';
      if (html.includes('Error:')) {
        return 'ERROR: ' + article.textContent.substring(0, 100);
      }
      return 'Unknown state: ' + html.substring(0, 100);
    });
    
    console.log('Article status:', content);
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
