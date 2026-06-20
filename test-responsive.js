const chromium = require('chromium');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const viewports = [
    { name: 'mobile-portrait', width: 375, height: 667 },
    { name: 'mobile-landscape', width: 667, height: 375 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  const report = [];

  for (const viewport of viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });

      // Verificar imagens
      const images = await page.locator('img').count();

      // Verificar erros no console
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Screenshot
      await page.screenshot({ path: `screenshots/${viewport.name}.png` });

      report.push({
        viewport: `${viewport.name} (${viewport.width}x${viewport.height})`,
        status: 'OK',
        images: images,
        errors: errors.length
      });

      console.log(`✅ ${viewport.name}: ${images} imagens, ${errors.length} erros`);
    } catch (err) {
      report.push({
        viewport: `${viewport.name}`,
        status: 'ERRO',
        error: err.message
      });
      console.log(`❌ ${viewport.name}: ${err.message}`);
    }
  }

  // Salvar relatório
  fs.writeFileSync('responsive-report.json', JSON.stringify(report, null, 2));

  await browser.close();
  process.exit(0);
})();
