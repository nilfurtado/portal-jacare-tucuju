#!/usr/bin/env node

/**
 * Teste do Fluxo Completo de Validação e Criação de Feed RSS
 *
 * Fluxo:
 * 1. Inserir URL → Clicar "Validar Feed"
 * 2. POST /api/rss-feeds/validate
 * 3. Parse XML e extrair: título, descrição, artigos
 * 4. Preview mostra: "✓ Feed validado com sucesso!"
 * 5. Selecionar categoria → Clicar "Criar Feed"
 * 6. POST /api/rss-feeds
 * 7. Sucesso: "✓ Feed criado com sucesso!"
 */

const http = require('http');

// Usar um token válido (será obtido do servidor)
const TOKEN = 'test-token';
const API_BASE = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testFlow() {
  console.log('🧪 TESTE DO FLUXO DE VALIDAÇÃO E CRIAÇÃO DE FEED RSS\n');
  console.log('═'.repeat(60));

  try {
    // PASSO 1: Validar Feed
    console.log('\n📝 PASSO 1: Validar Feed');
    console.log('─'.repeat(60));

    const testFeedUrl = 'https://www.agenciabrasil.gov.br/feed/';
    console.log(`🔗 URL do Feed: ${testFeedUrl}`);
    console.log('📤 POST /api/rss-feeds/validate');

    const validateRes = await makeRequest('POST', '/api/rss-feeds/validate', {
      url: testFeedUrl
    });

    console.log(`📊 Status: ${validateRes.status}`);
    console.log(`📋 Resposta:`, JSON.stringify(validateRes.data, null, 2).substring(0, 200) + '...');

    if (validateRes.status !== 200) {
      console.log('❌ Validação falhou!');
      console.log('Resposta completa:', validateRes.data);
      process.exit(1);
    }

    const feedData = validateRes.data;
    if (!feedData.channel) {
      console.log('❌ Resposta sem dados de feed!');
      process.exit(1);
    }

    const title = feedData.channel.title?.[0] || 'Sem título';
    const desc = feedData.channel.description?.[0] || 'Sem descrição';
    const itemCount = feedData.channel.item?.length || 0;

    console.log(`\n✅ Feed Validado com Sucesso!`);
    console.log(`   📌 Título: ${title}`);
    console.log(`   📄 Descrição: ${desc.substring(0, 50)}...`);
    console.log(`   📊 Artigos Encontrados: ${itemCount}`);

    // PASSO 2: Obter categorias
    console.log('\n📝 PASSO 2: Carregar Categorias');
    console.log('─'.repeat(60));
    console.log('📤 GET /api/categorias');

    const catRes = await makeRequest('GET', '/api/categorias');
    console.log(`📊 Status: ${catRes.status}`);

    if (catRes.status !== 200) {
      console.log('⚠️  Erro ao carregar categorias, continuando com teste...');
    } else {
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      console.log(`✅ ${cats.length} categorias carregadas`);
      if (cats.length > 0) {
        console.log(`   Exemplo: ${cats[0].nome} (slug: ${cats[0].slug})`);
      }
    }

    // PASSO 3: Criar Feed
    console.log('\n📝 PASSO 3: Criar Feed');
    console.log('─'.repeat(60));

    const feedName = `Test Feed ${Date.now()}`;
    const categoria = 'geral';
    const intervalo = 6;

    console.log(`📌 Nome: ${feedName}`);
    console.log(`📂 Categoria: ${categoria}`);
    console.log(`⏱️  Intervalo: ${intervalo}h`);
    console.log('📤 POST /api/rss-feeds');

    const createRes = await makeRequest('POST', '/api/rss-feeds', {
      url: testFeedUrl,
      nome: feedName,
      categoria: categoria,
      intervalo: intervalo,
      ativo: true
    });

    console.log(`📊 Status: ${createRes.status}`);

    if (createRes.status !== 200 && createRes.status !== 201) {
      console.log('❌ Erro ao criar feed!');
      console.log('Resposta:', createRes.data);
      process.exit(1);
    }

    console.log(`✅ Feed Criado com Sucesso!`);
    if (createRes.data?.id) {
      console.log(`   Feed ID: ${createRes.data.id}`);
    }

    // RESUMO
    console.log('\n' + '═'.repeat(60));
    console.log('✅ FLUXO COMPLETO TESTADO COM SUCESSO!\n');
    console.log('Resumo:');
    console.log(`  1. ✓ URL validada: ${testFeedUrl}`);
    console.log(`  2. ✓ Preview extraído: "${title}"`);
    console.log(`  3. ✓ ${itemCount} artigos encontrados`);
    console.log(`  4. ✓ Feed criado: "${feedName}"`);
    console.log(`  5. ✓ Categoria: ${categoria}`);
    console.log(`  6. ✓ Intervalo: ${intervalo}h`);
    console.log('\n🎉 Tudo funcionando!\n');

  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

testFlow();
