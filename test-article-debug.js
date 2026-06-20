const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[data.js]') || text.includes('[article-page]')) {
      console.log('[BROWSER]', text);
    }
  });
  
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
  });
  
  page.on('requestfailed', req => {
    console.error('[REQUEST FAILED]', req.url(), ':', req.failure().errorText);
  });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
    
    console.log('Waiting for content...');
    await page.waitForTimeout(4000);
    
    const result = await page.evaluate(() => {
      return {
        hasTitle: !!document.querySelector('.article__title'),
        hasLide: !!document.querySelector('.article__lide'),
        hasBody: !!document.querySelector('.article__body'),
      };
    });
    
    console.log('\nResults:', result);
  } finally {
    await browser.close();
  }
})();
