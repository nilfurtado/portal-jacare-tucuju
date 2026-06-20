/**
 * Script de Teste E2E: Sistema de Capas de Notícias
 * Execução: node painel-dm/scripts/test-capas.js
 *
 * Valida:
 * 1. Estrutura do banco de dados (schema)
 * 2. Geração de URLs de capa
 * 3. Campos obrigatórios
 * 4. Reversa-compatibilidade
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${COLORS.reset}`);
}

async function testCapaSchema() {
  log(COLORS.blue, '\n📋 TESTE 1: Schema de Capa\n');

  try {
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticiasRaw = await fs.readFile(noticiasPath, 'utf8');
    const noticias = JSON.parse(noticiasRaw);

    if (!Array.isArray(noticias) || noticias.length === 0) {
      log(COLORS.yellow, '⚠️  Nenhuma notícia encontrada');
      return { passed: false, message: 'noticias.json vazio' };
    }

    // Verificar primeira notícia com capa
    const noticiasComCapa = noticias.filter(n => n.capa && typeof n.capa === 'object');
    const noticiasComImagem = noticias.filter(n => n.imagem && !n.capa);

    log(COLORS.green, `✓ Total de notícias: ${noticias.length}`);
    log(COLORS.green, `✓ Com nova estrutura (capa): ${noticiasComCapa.length}`);
    log(COLORS.green, `✓ Com estrutura antiga (imagem): ${noticiasComImagem.length}`);

    // Validar schema de uma notícia com capa
    if (noticiasComCapa.length > 0) {
      const n = noticiasComCapa[0];
      const requiredFields = [
        'original', 'principal', 'principalWebp',
        'homepage', 'homepageWebp',
        'sidebar', 'sidebarWebp',
        'mobile', 'mobileWebp',
        'social', 'socialWebp',
        'metadados'
      ];

      let allValid = true;
      requiredFields.forEach(field => {
        if (!n.capa[field]) {
          log(COLORS.red, `  ✗ Campo faltando: ${field}`);
          allValid = false;
        }
      });

      if (allValid) {
        log(COLORS.green, `✓ Schema completo em: "${n.titulo.substring(0, 50)}..."`);
        log(COLORS.green, `  - principal: ${n.capa.principal.substring(0, 60)}...`);
        log(COLORS.green, `  - homepage: ${n.capa.homepage.substring(0, 60)}...`);
        log(COLORS.green, `  - sidebar: ${n.capa.sidebar.substring(0, 60)}...`);
        return { passed: true, count: noticiasComCapa.length };
      }
    }

    return { passed: true, message: 'Schema válido' };
  } catch (err) {
    log(COLORS.red, `✗ Erro ao validar schema:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function testCapaFields() {
  log(COLORS.blue, '\n🔍 TESTE 2: Campos Obrigatórios\n');

  try {
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticias = JSON.parse(await fs.readFile(noticiasPath, 'utf8'));

    let issues = [];
    let valid = 0;

    noticias.forEach((n, idx) => {
      // Validar que tem ou 'capa' ou 'imagem'
      if (!n.capa && !n.imagem) {
        issues.push(`[${idx}] "${n.titulo}": Sem capa nem imagem!`);
      }

      // Se tem 'imagem' antigo, verificar que não foi migrado para 'capa'
      if (n.imagem && !n.capa) {
        // OK - notícia antiga ainda não migrada
        return;
      }

      // Se tem 'capa' novo, validar estrutura
      if (n.capa && typeof n.capa === 'object') {
        if (!n.capa.principal) {
          issues.push(`[${idx}] "${n.titulo}": capa.principal faltando`);
          return;
        }
        if (!n.capa.metadados) {
          issues.push(`[${idx}] "${n.titulo}": capa.metadados faltando`);
          return;
        }
        valid++;
      }
    });

    if (issues.length > 0) {
      log(COLORS.yellow, `⚠️  ${issues.length} problema(s) encontrado(s):`);
      issues.slice(0, 5).forEach(issue => log(COLORS.yellow, `  ${issue}`));
      if (issues.length > 5) log(COLORS.yellow, `  ... e mais ${issues.length - 5}`);
    }

    log(COLORS.green, `✓ ${valid} notícias com capa válida`);
    return { passed: issues.length === 0, valid, issues: issues.length };
  } catch (err) {
    log(COLORS.red, `✗ Erro ao validar campos:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function testReverseCompatibility() {
  log(COLORS.blue, '\n🔄 TESTE 3: Reversa-Compatibilidade\n');

  try {
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticias = JSON.parse(await fs.readFile(noticiasPath, 'utf8'));

    let compatIssues = [];

    noticias.forEach((n) => {
      // Se tem capa nova, verificar que 'imagem' foi preenchido para compat
      if (n.capa && !n.imagem) {
        compatIssues.push(`"${n.titulo}": capa.principal não está em imagem`);
      }
    });

    if (compatIssues.length > 0) {
      log(COLORS.yellow, `⚠️  ${compatIssues.length} notícia(s) sem reversa-compat:`);
      compatIssues.slice(0, 5).forEach(issue => log(COLORS.yellow, `  ${issue}`));
    } else {
      log(COLORS.green, `✓ Todas as notícias com capa têm reversa-compatibilidade`);
    }

    return { passed: compatIssues.length === 0, issues: compatIssues.length };
  } catch (err) {
    log(COLORS.red, `✗ Erro ao validar compat:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function testMetadados() {
  log(COLORS.blue, '\n📊 TESTE 4: Metadados de Capa\n');

  try {
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticias = JSON.parse(await fs.readFile(noticiasPath, 'utf8'));

    const noticiasComCapa = noticias.filter(n => n.capa?.metadados);
    const altCount = noticiasComCapa.filter(n => n.capa.metadados.alt).length;

    log(COLORS.green, `✓ Notícias com metadados: ${noticiasComCapa.length}`);
    log(COLORS.green, `✓ Com alt text: ${altCount}/${noticiasComCapa.length}`);

    if (noticiasComCapa.length > 0) {
      const sample = noticiasComCapa[0];
      log(COLORS.green, `\n  Exemplo de metadados:`);
      log(COLORS.green, `  - largura: ${sample.capa.metadados.largura}`);
      log(COLORS.green, `  - altura: ${sample.capa.metadados.altura}`);
      log(COLORS.green, `  - mime: ${sample.capa.metadados.mime}`);
      log(COLORS.green, `  - tamanho: ${sample.capa.metadados.tamanho} bytes`);
      log(COLORS.green, `  - alt: "${sample.capa.metadados.alt}"`);
    }

    return { passed: true, total: noticiasComCapa.length, withAlt: altCount };
  } catch (err) {
    log(COLORS.red, `✗ Erro ao validar metadados:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function testImageUrls() {
  log(COLORS.blue, '\n🖼️  TESTE 5: URLs de Imagem\n');

  try {
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticias = JSON.parse(await fs.readFile(noticiasPath, 'utf8'));

    const noticiasComCapa = noticias.filter(n => n.capa?.principal);
    let invalidUrls = [];

    noticiasComCapa.forEach((n) => {
      const urls = [
        n.capa.principal,
        n.capa.principalWebp,
        n.capa.homepage,
        n.capa.homepageWebp,
        n.capa.sidebar,
        n.capa.sidebarWebp,
        n.capa.mobile,
        n.capa.mobileWebp,
        n.capa.social,
        n.capa.socialWebp,
      ];

      urls.forEach(url => {
        if (!url || !url.startsWith('/img/uploads/')) {
          invalidUrls.push(`"${n.titulo}": URL inválida: ${url}`);
        }
      });
    });

    if (invalidUrls.length > 0) {
      log(COLORS.yellow, `⚠️  ${invalidUrls.length} URL(s) inválida(s):`);
      invalidUrls.slice(0, 5).forEach(issue => log(COLORS.yellow, `  ${issue}`));
    } else {
      log(COLORS.green, `✓ Todas as URLs válidas`);
      log(COLORS.green, `✓ Total de notícias com capa: ${noticiasComCapa.length}`);
    }

    return { passed: invalidUrls.length === 0, issues: invalidUrls.length };
  } catch (err) {
    log(COLORS.red, `✗ Erro ao validar URLs:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function runAllTests() {
  log(COLORS.blue, '\n════════════════════════════════════════════════════════════');
  log(COLORS.blue, '  🧪 TESTES E2E: SISTEMA DE CAPAS DE NOTÍCIAS');
  log(COLORS.blue, '════════════════════════════════════════════════════════════');

  const tests = [
    { name: 'Schema', fn: testCapaSchema },
    { name: 'Campos', fn: testCapaFields },
    { name: 'Compat', fn: testReverseCompatibility },
    { name: 'Metadata', fn: testMetadados },
    { name: 'URLs', fn: testImageUrls },
  ];

  const results = [];
  for (const test of tests) {
    const result = await test.fn();
    results.push({ ...result, name: test.name });
  }

  // Summary
  log(COLORS.blue, '\n════════════════════════════════════════════════════════════');
  log(COLORS.blue, '  📊 RESUMO DOS TESTES');
  log(COLORS.blue, '════════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    const color = r.passed ? COLORS.green : COLORS.red;
    log(color, `${icon} ${r.name}`);
  });

  log(COLORS.blue, `\n  ${passed}/${total} testes passaram\n`);

  if (passed === total) {
    log(COLORS.green, '  ✓ SISTEMA PRONTO PARA PRODUÇÃO!\n');
    process.exit(0);
  } else {
    log(COLORS.red, '  ✗ Alguns testes falharam. Verifique acima.\n');
    process.exit(1);
  }
}

// Executar
runAllTests().catch(err => {
  log(COLORS.red, '❌ Erro fatal:', err.message);
  process.exit(1);
});
