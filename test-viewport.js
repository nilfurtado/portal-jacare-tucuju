const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Criar diretório para screenshots
const screenshotsDir = './screenshots-responsive';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const viewports = [
  { name: 'mobile-portrait', width: 375, height: 812, description: 'iPhone 12 Portrait' },
  { name: 'mobile-landscape', width: 812, height: 375, description: 'iPhone 12 Landscape' },
  { name: 'tablet-portrait', width: 768, height: 1024, description: 'iPad Portrait' },
  { name: 'tablet-landscape', width: 1024, height: 768, description: 'iPad Landscape' },
  { name: 'desktop', width: 1440, height: 900, description: 'Desktop (1440px)' }
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const viewport of viewports) {
    console.log(`\n📱 Testando: ${viewport.description} (${viewport.width}x${viewport.height})`);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });

      // Capturar erros do console
      const consoleLogs = [];
      page.on('console', msg => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      // Navegar para o portal
      await page.goto('http://localhost:8000', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aguardar um pouco para renderização
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

      // Capturar screenshot
      const screenshotPath = path.join(screenshotsDir, `${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Verificar imagens carregadas
      const images = (await page.$$('img')).length;

      // Verificar conteúdo visível
      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = viewport.height;

      // Verificar se há overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Contar erros no console
      const errors = consoleLogs.filter(log => log.type === 'error');

      const result = {
        viewport: viewport.name,
        description: viewport.description,
        dimensions: `${viewport.width}x${viewport.height}`,
        status: 'OK',
        imagesLoaded: images,
        contentHeight: contentHeight,
        hasHorizontalOverflow: hasOverflow,
        consoleErrors: errors.length,
        screenshot: screenshotPath
      };

      results.push(result);

      console.log(`   ✅ Screenshot: ${screenshotPath}`);
      console.log(`   📸 Imagens carregadas: ${images}`);
      console.log(`   📏 Altura do conteúdo: ${contentHeight}px`);
      console.log(`   ⚠️  Overflow horizontal: ${hasOverflow ? 'SIM ❌' : 'Não ✅'}`);
      console.log(`   🔴 Erros no console: ${errors.length}`);

      await page.close();

    } catch (err) {
      console.error(`   ❌ Erro: ${err.message}`);
      results.push({
        viewport: viewport.name,
        description: viewport.description,
        status: 'ERRO',
        error: err.message
      });
    }
  }

  // Salvar relatório JSON
  fs.writeFileSync('responsive-test-report.json', JSON.stringify(results, null, 2));

  // Gerar relatório em Markdown
  let report = '# 📱 Teste de Responsividade do Portal\n\n';
  report += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;

  report += '## Resumo\n\n';
  report += `| Viewport | Dimensões | Status | Imagens | Overflow | Erros |\n`;
  report += `|----------|-----------|--------|---------|----------|-------|\n`;

  results.forEach(r => {
    if (r.status === 'OK') {
      report += `| ${r.description} | ${r.dimensions} | ✅ | ${r.imagesLoaded} | ${r.hasHorizontalOverflow ? '❌' : '✅'} | ${r.consoleErrors} |\n`;
    } else {
      report += `| ${r.description} | ${r.dimensions} | ❌ ERRO | - | - | ${r.error} |\n`;
    }
  });

  report += '\n## Detalhes\n\n';
  results.forEach(r => {
    report += `### ${r.description}\n`;
    report += `- **Dimensões:** ${r.dimensions}\n`;
    report += `- **Status:** ${r.status === 'OK' ? '✅ OK' : '❌ ' + r.error}\n`;
    if (r.status === 'OK') {
      report += `- **Imagens carregadas:** ${r.imagesLoaded}\n`;
      report += `- **Altura do conteúdo:** ${r.contentHeight}px\n`;
      report += `- **Overflow horizontal:** ${r.hasHorizontalOverflow ? '❌ SIM (layout quebrado)' : '✅ Não'}\n`;
      report += `- **Erros no console:** ${r.consoleErrors > 0 ? '⚠️ ' + r.consoleErrors : '✅ Nenhum'}\n`;
      report += `- **Screenshot:** ![${r.viewport}](${r.screenshot})\n`;
    }
    report += '\n';
  });

  fs.writeFileSync('responsive-test-report.md', report);
  console.log('\n✅ Relatórios salvos:');
  console.log('   - responsive-test-report.json');
  console.log('   - responsive-test-report.md');
  console.log(`   - Screenshots em: ${screenshotsDir}/`);

  await browser.close();
  process.exit(0);
})();
