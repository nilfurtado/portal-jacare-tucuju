const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile-small', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 }
  ];

  console.log('\n📱 AUDITORIA COMPLETA DE RESPONSIVIDADE - PORTAL\n');

  for (const vp of viewports) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📱 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('='.repeat(80));

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

      const audit = await page.evaluate(() => {
        return {
          // HEADER
          header: {
            exists: !!document.querySelector('header'),
            overflow: document.querySelector('header')?.scrollWidth > window.innerWidth,
            logo: !!document.querySelector('.header__logo img'),
            menu: !!document.querySelector('.nav'),
            drawer: !!document.querySelector('[data-drawer]')
          },

          // TOPBAR
          topbar: {
            exists: !!document.querySelector('.topbar'),
            visible: document.querySelector('.topbar') ? window.getComputedStyle(document.querySelector('.topbar')).display !== 'none' : false,
            overflow: document.querySelector('.topbar')?.scrollWidth > window.innerWidth
          },

          // CARROSSEL
          carousel: {
            exists: !!document.querySelector('.hero-featured-carousel'),
            cards: document.querySelectorAll('.hero-card').length,
            images: document.querySelectorAll('.hero-mosaic img').length,
            overflow: document.querySelector('.hero-mosaic')?.scrollWidth > window.innerWidth
          },

          // CATEGORIAS
          categories: {
            total: document.querySelectorAll('.cat-section').length,
            totalCards: document.querySelectorAll('.cat-section .card').length,
            totalImages: document.querySelectorAll('.cat-section img').length,
            withOverflow: Array.from(document.querySelectorAll('.cat-section')).filter(
              s => s.scrollWidth > window.innerWidth
            ).length
          },

          // SIDEBAR
          sidebar: {
            visible: document.querySelector('.sidebar') ? window.getComputedStyle(document.querySelector('.sidebar')).display !== 'none' : false,
            widgets: document.querySelectorAll('.sidebar .widget').length,
            images: document.querySelectorAll('.sidebar img').length
          },

          // FOOTER
          footer: {
            exists: !!document.querySelector('footer'),
            overflow: document.querySelector('footer')?.scrollWidth > window.innerWidth,
            columns: Array.from(document.querySelectorAll('.footer__col')).length
          },

          // GERAL
          general: {
            bodyOverflow: document.body.scrollWidth > window.innerWidth,
            totalImages: document.querySelectorAll('img').length,
            totalText: document.body.textContent.length,
            broken: document.querySelectorAll('img[alt=""]').length
          }
        };
      });

      // EXIBIR RESULTADOS
      console.log('\n🔝 HEADER:');
      console.log(`   Existe: ${audit.header.exists ? '✅' : '❌'}`);
      console.log(`   Logo: ${audit.header.logo ? '✅' : '❌'}`);
      console.log(`   Menu: ${audit.header.menu ? '✅ (nav)' : '❌'}`);
      console.log(`   Drawer: ${audit.header.drawer ? '✅' : '❌'}`);
      console.log(`   Overflow: ${audit.header.overflow ? '❌ SIM' : '✅ NÃO'}`);

      console.log('\n📋 TOPBAR:');
      console.log(`   Visível: ${audit.topbar.visible ? '✅' : '❌'}`);
      console.log(`   Overflow: ${audit.topbar.overflow ? '❌' : '✅'}`);

      console.log('\n🎬 CARROSSEL:');
      console.log(`   Cards: ${audit.carousel.cards} | Imagens: ${audit.carousel.images}`);
      console.log(`   Overflow: ${audit.carousel.overflow ? '❌' : '✅'}`);

      console.log('\n📂 CATEGORIAS:');
      console.log(`   Total: ${audit.categories.total} | Cards: ${audit.categories.totalCards} | Imagens: ${audit.categories.totalImages}`);
      console.log(`   Com overflow: ${audit.categories.withOverflow}/${audit.categories.total} ❌`);

      console.log('\n📰 SIDEBAR:');
      console.log(`   Visível: ${audit.sidebar.visible ? '✅' : '❌'}`);
      console.log(`   Widgets: ${audit.sidebar.widgets} | Imagens: ${audit.sidebar.images}`);

      console.log('\n🔚 FOOTER:');
      console.log(`   Overflow: ${audit.footer.overflow ? '❌' : '✅'}`);
      console.log(`   Colunas: ${audit.footer.columns}`);

      console.log('\n📊 GERAL:');
      console.log(`   Total de imagens: ${audit.general.totalImages}`);
      console.log(`   Imagens sem ALT: ${audit.general.broken}`);
      console.log(`   Conteúdo (caracteres): ${audit.general.totalText}`);
      console.log(`   Body overflow: ${audit.general.bodyOverflow ? '❌ CRÍTICO' : '✅ OK'}`);

      // NOTA GERAL
      const score = 
        (audit.header.exists ? 1 : 0) +
        (!audit.header.overflow ? 1 : 0) +
        (!audit.carousel.overflow ? 1 : 0) +
        (audit.categories.withOverflow === 0 ? 2 : audit.categories.withOverflow < 3 ? 1 : 0) +
        (!audit.footer.overflow ? 1 : 0) +
        (!audit.general.bodyOverflow ? 1 : 0);

      console.log(`\n⭐ SCORE: ${score}/7`);

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
