const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning' && msg.text().includes('Erro:')) {
      warnings.push(msg.text());
    }
  });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(3000);
  
  console.log('🔍 Console Check:');
  console.log(`\n❌ Erros encontrados: ${errors.length}`);
  errors.forEach((err, i) => console.log(`  [${i+1}] ${err}`));
  
  console.log(`\n⚠️ Warnings críticos: ${warnings.length}`);
  warnings.forEach((warn, i) => console.log(`  [${i+1}] ${warn}`));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ Console limpo! Nenhum erro crítico detectado.');
  }
  
  await browser.close();
})();
