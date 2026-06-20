const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const failedRequests = [];
  
  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      error: req.failure().errorText
    });
  });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(3000);
  
  console.log('🔍 Failed Requests:');
  if (failedRequests.length === 0) {
    console.log('   ✅ Nenhuma requisição falhou!');
  } else {
    failedRequests.forEach((req, i) => {
      console.log(`\n[${i+1}] ${req.url.substring(0, 80)}`);
      console.log(`    Erro: ${req.error}`);
    });
  }
  
  await browser.close();
})();
