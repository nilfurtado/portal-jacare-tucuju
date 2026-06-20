const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(4000);
  
  console.log('📋 Console Logs:');
  logs.forEach(log => {
    if (log.type !== 'log' || log.text.includes('[')) {
      console.log(`  [${log.type.toUpperCase()}] ${log.text}`);
    }
  });
  
  console.log('');
  console.log('❌ Page Errors:');
  errors.forEach(err => console.log('  ', err));
  
  // Check if article rendered
  const rendered = await page.evaluate(() => {
    const root = document.getElementById('article-root');
    return {
      hasLoadingMsg: root ? root.innerHTML.includes('Carregando') : null,
      hasTitle: !!document.querySelector('.article__title'),
      innerHTML: root ? root.innerHTML.substring(0, 150) : null,
    };
  });
  
  console.log('');
  console.log('📄 Article Status:');
  console.log('  Still showing "Carregando":', rendered.hasLoadingMsg);
  console.log('  Title rendered:', rendered.hasTitle);
  console.log('  innerHTML:', rendered.innerHTML);
  
  await browser.close();
})();
