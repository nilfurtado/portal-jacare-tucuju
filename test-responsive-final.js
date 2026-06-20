const { chromium } = require('playwright');

(async () => {
  const viewports = [
    { name: 'Mobile (375x812)', width: 375, height: 812 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1440x900)', width: 1440, height: 900 }
  ];
  
  console.log('🔍 Responsiveness Test - Article Page\n');
  
  for (const vp of viewports) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
    
    // Wait for article to render by looking for title element
    await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    const result = await page.evaluate(() => {
      const title = document.querySelector('.article__title');
      const lide = document.querySelector('.article__lide');
      const body = document.querySelector('.article__body');
      const sidebar = document.querySelector('.sidebar');
      const root = document.getElementById('article-root');
      const container = document.querySelector('.container');
      const main = document.querySelector('main');
      
      // Check text content
      const titleText = title ? title.textContent.substring(0, 40) : null;
      const lideText = lide ? lide.textContent.substring(0, 60) : null;
      const bodyText = body ? body.textContent.substring(0, 80) : null;
      
      return {
        viewport: window.innerWidth,
        docWidth: document.documentElement.scrollWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        title: { found: !!title, height: title ? title.offsetHeight : 0, text: titleText },
        lide: { found: !!lide, height: lide ? lide.offsetHeight : 0, text: lideText },
        body: { found: !!body, height: body ? body.offsetHeight : 0, textLen: body ? body.textContent.length : 0 },
        sidebar: { found: !!sidebar, height: sidebar ? sidebar.offsetHeight : 0 },
        root: { height: root ? root.offsetHeight : 0 },
        main: { height: main ? main.offsetHeight : 0 },
      };
    });
    
    console.log(`📱 ${vp.name}`);
    console.log(`   Overflow: ${result.hasOverflow ? '❌ YES (' + result.docWidth + 'px > ' + result.viewport + 'px)' : '✅ NO'}`);
    console.log(`   Title: ${result.title.found ? '✅ ' + result.title.height + 'px - "' + result.title.text + '..."' : '❌ NOT FOUND'}`);
    console.log(`   Lide: ${result.lide.found ? '✅ ' + result.lide.height + 'px' : '❌ NOT FOUND'}`);
    console.log(`   Body: ${result.body.found ? '✅ ' + result.body.height + 'px (' + result.body.textLen + ' chars)' : '❌ NOT FOUND'}`);
    console.log(`   Sidebar: ${result.sidebar.found ? '✅ ' + result.sidebar.height + 'px' : '❌ NOT FOUND'}`);
    console.log('');
    
    await browser.close();
  }
})();
