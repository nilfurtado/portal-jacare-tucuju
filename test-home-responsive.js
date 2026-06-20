const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile-small', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  console.log('\n🏠 ANÁLISE DE RESPONSIVIDADE - HOMEPAGE\n');

  for (const vp of viewports) {
    console.log(`\n📱 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('='.repeat(50));

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

      // Verificar seções
      const sections = await page.evaluate(() => {
        const data = [];

        // Topbar
        const topbar = document.querySelector('.topbar');
        data.push({
          seção: '🔝 Topbar',
          existe: !!topbar,
          overflow: topbar ? topbar.scrollWidth > window.innerWidth : null,
          visível: topbar ? window.getComputedStyle(topbar).display !== 'none' : null
        });

        // Header
        const header = document.querySelector('header');
        data.push({
          seção: '📋 Header',
          existe: !!header,
          overflow: header ? header.scrollWidth > window.innerWidth : null,
          logo: document.querySelector('.header__logo img') ? '✅' : '❌'
        });

        // Nav
        const nav = document.querySelector('.nav');
        data.push({
          seção: '🗂️ Nav',
          existe: !!nav,
          visível: nav ? window.getComputedStyle(nav).display !== 'none' : '(oculta)'
        });

        // Breaking News
        const breaking = document.querySelector('.breaking-news');
        data.push({
          seção: '🔴 Breaking News',
          existe: !!breaking,
          overflow: breaking ? breaking.scrollWidth > window.innerWidth : null
        });

        // Hero Mosaic
        const hero = document.querySelector('.hero-mosaic');
        data.push({
          seção: '🎬 Hero Mosaic',
          existe: !!hero,
          imagens: document.querySelectorAll('.hero-mosaic img').length
        });

        // Categorias (seções)
        const catSections = document.querySelectorAll('.cat-section');
        data.push({
          seção: '📂 Categorias',
          total: catSections.length,
          cards: document.querySelectorAll('.card').length
        });

        // Sidebar
        const sidebar = document.querySelector('.sidebar');
        data.push({
          seção: '📰 Sidebar',
          existe: !!sidebar,
          visível: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : '(oculta)'
        });

        // Footer
        const footer = document.querySelector('footer');
        data.push({
          seção: '🔚 Footer',
          existe: !!footer,
          overflow: footer ? footer.scrollWidth > window.innerWidth : null
        });

        return data;
      });

      sections.forEach(s => {
        let status = '';
        if (s.overflow === true) status = ' ❌ OVERFLOW';
        else if (s.overflow === false) status = ' ✅';
        else if (s.visível === false) status = ' ⚠️ OCULTA';
        else if (s.visível === true) status = ' ✅';

        console.log(`${s.seção} ${status}`);
        Object.keys(s).forEach(k => {
          if (k !== 'seção') {
            console.log(`   └─ ${k}: ${s[k]}`);
          }
        });
      });

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
