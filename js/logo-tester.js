/**
 * Logo Tester — Valida se favicon/logos estão acessíveis em todos os locais mapeados
 */

export async function testLogos(mapping, onProgress = null) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      error: 0,
      skipped: 0
    }
  };

  let testIndex = 0;

  // Iterar por todas as plataformas e locais
  for (const [platformKey, platform] of Object.entries(mapping.platforms)) {
    if (!platform.locations) continue;

    for (const location of platform.locations) {
      testIndex++;
      results.summary.total++;

      // Notificar progresso
      if (onProgress) {
        onProgress({
          current: testIndex,
          total: mapping.totalLocations,
          location: location.id,
          platform: platformKey
        });
      }

      // Determinar qual URL testar baseado no método
      let testResult = {
        id: location.id,
        local: location.local,
        platform: platformKey,
        type: location.type,
        testMethod: location.testMethod || 'unknown',
        status: 'skipped',
        duration: 0,
        code: null,
        error: null,
        timestamp: new Date().toISOString()
      };

      try {
        const startTime = performance.now();

        // Skip testes que não são HTTP HEAD/GET
        if (location.testMethod === 'visual' || location.testMethod === 'unknown') {
          testResult.status = 'skipped';
          testResult.reason = 'Visual validation required (manual check)';
          results.summary.skipped++;
        } else if (location.testMethod === 'API') {
          // Testar API endpoints
          if (location.id === 'api-portal-bootstrap') {
            try {
              const response = await fetch('/api/portal/bootstrap', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
              }).catch(() => fetch('/api/portal/bootstrap'));

              testResult.status = response?.ok ? 'passed' : 'failed';
              testResult.code = response?.status || 0;
              if (response?.ok) results.summary.passed++;
              else results.summary.failed++;
            } catch (err) {
              testResult.status = 'error';
              testResult.error = err.message;
              results.summary.error++;
            }
          } else if (location.id === 'data-config-json') {
            testResult.status = 'skipped';
            testResult.reason = 'File storage (cannot test directly)';
            results.summary.skipped++;
          } else if (location.api) {
            // Generic API test
            try {
              const response = await fetch(location.api, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
              }).catch(() => fetch(location.api));

              testResult.status = response?.ok ? 'passed' : 'failed';
              testResult.code = response?.status || 0;
              if (response?.ok) results.summary.passed++;
              else results.summary.failed++;
            } catch (err) {
              testResult.status = 'error';
              testResult.error = err.message;
              results.summary.error++;
            }
          }
        } else if (location.testMethod === 'HEAD') {
          // Testar acesso a arquivo via HEAD request
          const url = location.url;
          if (!url) {
            testResult.status = 'skipped';
            testResult.reason = 'No URL provided';
            results.summary.skipped++;
          } else {
            try {
              const response = await fetch(url, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
              });

              testResult.status = response.ok ? 'passed' : 'failed';
              testResult.code = response.status;
              testResult.url = url;

              if (response.ok) {
                results.summary.passed++;
              } else {
                results.summary.failed++;
              }
            } catch (err) {
              // Se HEAD falhar, tentar GET
              try {
                const response = await fetch(url, {
                  method: 'GET',
                  signal: AbortSignal.timeout(5000)
                });

                testResult.status = response.ok ? 'passed' : 'failed';
                testResult.code = response.status;
                testResult.url = url;
                testResult.fallback = 'GET (HEAD failed)';

                if (response.ok) {
                  results.summary.passed++;
                } else {
                  results.summary.failed++;
                }
              } catch (err2) {
                testResult.status = 'error';
                testResult.error = err2.message;
                testResult.url = url;
                results.summary.error++;
              }
            }
          }
        }

        testResult.duration = Math.round(performance.now() - startTime);
      } catch (err) {
        testResult.status = 'error';
        testResult.error = err.message;
        results.summary.error++;
      }

      results.tests.push(testResult);
    }
  }

  results.summary.successRate = results.summary.total > 0
    ? Math.round((results.summary.passed / results.summary.total) * 100)
    : 0;

  return results;
}

export function formatTestResults(results) {
  const { summary, tests } = results;
  const lines = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('🧪 RELATÓRIO DE TESTE DE LOGOMARCAS E FAVICON');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Summary
  lines.push('📊 RESUMO:');
  lines.push(`  Total de locais testados: ${summary.total}`);
  lines.push(`  ✅ Passou: ${summary.passed} (${Math.round((summary.passed / summary.total) * 100)}%)`);
  lines.push(`  ❌ Falhou: ${summary.failed}`);
  lines.push(`  ⚠️  Erro: ${summary.error}`);
  lines.push(`  ⊘ Ignorado: ${summary.skipped} (validação manual)`);
  lines.push(`  Tempo: ${results.timestamp}`);
  lines.push('');

  // Detalhes
  lines.push('📋 DETALHES:');
  lines.push('');

  const groupedByStatus = {
    passed: [],
    failed: [],
    error: [],
    skipped: []
  };

  tests.forEach(test => {
    if (groupedByStatus[test.status]) {
      groupedByStatus[test.status].push(test);
    }
  });

  // Passed tests
  if (groupedByStatus.passed.length > 0) {
    lines.push('✅ PASSOU:');
    groupedByStatus.passed.forEach(test => {
      lines.push(`  • ${test.id}`);
      lines.push(`    Local: ${test.local}`);
      lines.push(`    Tipo: ${test.type}`);
      if (test.url) lines.push(`    URL: ${test.url}`);
      lines.push(`    Tempo: ${test.duration}ms`);
      lines.push('');
    });
  }

  // Failed tests
  if (groupedByStatus.failed.length > 0) {
    lines.push('❌ FALHOU:');
    groupedByStatus.failed.forEach(test => {
      lines.push(`  • ${test.id}`);
      lines.push(`    Local: ${test.local}`);
      lines.push(`    Tipo: ${test.type}`);
      if (test.url) lines.push(`    URL: ${test.url}`);
      lines.push(`    Código HTTP: ${test.code}`);
      lines.push('');
    });
  }

  // Error tests
  if (groupedByStatus.error.length > 0) {
    lines.push('⚠️  ERRO:');
    groupedByStatus.error.forEach(test => {
      lines.push(`  • ${test.id}`);
      lines.push(`    Local: ${test.local}`);
      lines.push(`    Erro: ${test.error}`);
      lines.push('');
    });
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export function exportCSV(results) {
  const { tests } = results;
  const headers = ['ID', 'Local', 'Platform', 'Tipo', 'Status', 'Código HTTP', 'URL', 'Erro', 'Duração (ms)'];
  const rows = [headers];

  tests.forEach(test => {
    rows.push([
      test.id,
      test.local.replace(/,/g, ';'),
      test.platform,
      test.type,
      test.status,
      test.code || '',
      test.url || '',
      test.error ? test.error.replace(/,/g, ';') : '',
      test.duration
    ]);
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function exportJSON(results) {
  return JSON.stringify(results, null, 2);
}
