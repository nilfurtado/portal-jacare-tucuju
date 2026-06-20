const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  const viewports = [
    { name: 'Mobile (375x812)', width: 375, height: 812 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1440x900)', width: 1440, height: 900 }
  ];
  
  for (const viewport of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
      await page.waitForTimeout(3000);
      
      const result = await page.evaluate(() => {
        const article = document.getElementById('article-root');
        const bodyDiv = article ? article.querySelector('.article__body') : null;
        const titleEl = article ? article.querySelector('.article__title') : null;
        
        return {
          articleExists: !!article,
          hasTitle: !!titleEl,
          hasBody: !!bodyDiv,
          bodyChars: bodyDiv ? bodyDiv.textContent.length : 0,
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      
      const loaded = result.articleExists && result.hasTitle && result.hasBody ? '✅' : '❌';
      const overflow = result.documentWidth > result.viewportWidth ? '⚠️ overflow' : '✅ OK';
      console.log(`${loaded} ${viewport.name} - ${overflow} - ${result.bodyChars} chars`);
      
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
})();
