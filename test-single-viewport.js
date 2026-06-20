const { chromium } = require('playwright');

(async () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];
  
  for (const vp of viewports) {
    const browser = await chromium.launch(); // Fresh browser for each test
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
    await page.waitForTimeout(2000);
    
    const result = await page.evaluate(() => {
      const title = document.querySelector('.article__title');
      const lide = document.querySelector('.article__lide');
      const body = document.querySelector('.article__body');
      const sidebar = document.querySelector('.sidebar');
      
      return {
        title: title ? { exists: true, height: title.offsetHeight, text: title.textContent.substring(0, 50) } : { exists: false },
        lide: lide ? { exists: true, height: lide.offsetHeight } : { exists: false },
        body: body ? { exists: true, height: body.offsetHeight } : { exists: false },
        sidebar: sidebar ? { exists: true, height: sidebar.offsetHeight } : { exists: false },
        docWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
      };
    });
    
    console.log(`\n📱 ${vp.name} (${vp.width}x${vp.height}):`);
    console.log(`  Doc width: ${result.docWidth}px vs window ${result.windowWidth}px`);
    console.log(`  Title: ${result.title.exists ? `✅ ${result.title.height}px` : '❌ NOT FOUND'}`);
    console.log(`  Lide: ${result.lide.exists ? `✅ ${result.lide.height}px` : '❌ NOT FOUND'}`);
    console.log(`  Body: ${result.body.exists ? `✅ ${result.body.height}px` : '❌ NOT FOUND'}`);
    console.log(`  Sidebar: ${result.sidebar.exists ? `✅ ${result.sidebar.height}px` : '❌ NOT FOUND'}`);
    
    await browser.close();
  }
})();
