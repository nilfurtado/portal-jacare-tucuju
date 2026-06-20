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
      await page.waitForTimeout(2000);
      
      const result = await page.evaluate(() => {
        const article = document.getElementById('article-root');
        const mainContent = document.querySelector('.article__body');
        
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          hasContent: !!mainContent && mainContent.innerHTML.length > 100,
          noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
          readableLength: mainContent ? mainContent.textContent.length : 0,
        };
      });
      
      const status = result.hasContent ? '✅' : '❌';
      const overflow = result.noOverflow ? '✅ no overflow' : '⚠️ has overflow';
      console.log(`${status} ${viewport.name} - ${overflow} - ${result.readableLength} chars`);
      
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
})();
