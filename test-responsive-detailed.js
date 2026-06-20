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
        // Check main elements
        const article = document.getElementById('article-root');
        const title = document.querySelector('.article__title');
        const lide = document.querySelector('.article__lide');
        const body = document.querySelector('.article__body');
        const sidebar = document.querySelector('.article-sidebar');
        const grid = document.querySelector('.article-grid');
        
        // Check overflow issues
        const elements = [
          { name: 'html', el: document.documentElement },
          { name: 'body', el: document.body },
          { name: 'article-root', el: article },
          { name: 'article-grid', el: grid },
          { name: 'article__body', el: body },
          { name: 'sidebar', el: sidebar }
        ];
        
        const overflows = [];
        elements.forEach(({ name, el }) => {
          if (!el) return;
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          const overflow = scrollWidth > clientWidth;
          if (overflow) {
            overflows.push(`${name}: ${scrollWidth}px (viewport ${clientWidth}px)`);
          }
        });
        
        return {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          documentWidth: document.documentElement.scrollWidth,
          windowWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          overflowElements: overflows,
          titleVisible: !!title && title.offsetHeight > 0,
          lideVisible: !!lide && lide.offsetHeight > 0,
          bodyVisible: !!body && body.offsetHeight > 0,
          sidebarVisible: !!sidebar && sidebar.offsetHeight > 0,
        };
      });
      
      console.log(`\n📱 ${viewport.name}`);
      console.log(`  Viewport: ${result.viewport}`);
      console.log(`  Document width: ${result.documentWidth}px (window: ${result.windowWidth}px)`);
      console.log(`  Has overflow: ${result.hasOverflow ? '❌ YES' : '✅ NO'}`);
      if (result.overflowElements.length > 0) {
        result.overflowElements.forEach(el => console.log(`    - ${el}`));
      }
      console.log(`  Content visible: title=${result.titleVisible} lide=${result.lideVisible} body=${result.bodyVisible} sidebar=${result.sidebarVisible}`);
      
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
})();
