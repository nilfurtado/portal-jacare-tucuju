#!/usr/bin/env node
/**
 * Script de Teste - Endpoints RSS
 * Valida todos os endpoints da API de RSS feeds
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/rss-feeds';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
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

async function runTests() {
  console.log('🧪 TESTES DE ENDPOINTS RSS\n');
  console.log('═'.repeat(50));

  try {
    // Test 1: GET /api/rss-feeds
    console.log('\n1️⃣ GET /api/rss-feeds');
    const listRes = await makeRequest('GET', '/api/rss-feeds');
    if (listRes.status === 200 && Array.isArray(listRes.data)) {
      console.log(`   ✅ Status: ${listRes.status}`);
      console.log(`   ✅ Feeds encontrados: ${listRes.data.length}`);
    } else {
      console.log(`   ❌ Status: ${listRes.status}`);
      console.log(`   ❌ Resposta inválida`);
    }

    // Test 2: POST /api/rss-feeds/validate
    console.log('\n2️⃣ POST /api/rss-feeds/validate');
    const validateRes = await makeRequest('POST', '/api/rss-feeds/validate', {
      url: 'https://www.agenciabrasil.com.br/feed/'
    });
    if (validateRes.status === 200) {
      console.log(`   ✅ Status: ${validateRes.status}`);
      console.log(`   ✅ Válido: ${validateRes.data.valido}`);
      if (validateRes.data.itens) {
        console.log(`   ✅ Itens no feed: ${validateRes.data.itens}`);
      }
    } else {
      console.log(`   ❌ Status: ${validateRes.status}`);
    }

    // Test 3: POST /api/rss-feeds/sincronizar
    console.log('\n3️⃣ POST /api/rss-feeds/sincronizar');
    const syncRes = await makeRequest('POST', '/api/rss-feeds/sincronizar', {});
    if (syncRes.status === 200) {
      console.log(`   ✅ Status: ${syncRes.status}`);
      console.log(`   ✅ Feeds sincronizados: ${syncRes.data.feedsSincronizados}`);
      console.log(`   ✅ Total importado: ${syncRes.data.totalImportadas}`);
    } else {
      console.log(`   ❌ Status: ${syncRes.status}`);
    }

    // Test 4: GET /api/noticias
    console.log('\n4️⃣ GET /api/noticias');
    const noticiasRes = await makeRequest('GET', '/api/noticias');
    if (noticiasRes.status === 200) {
      const count = Array.isArray(noticiasRes.data) ? noticiasRes.data.length : 0;
      console.log(`   ✅ Status: ${noticiasRes.status}`);
      console.log(`   ✅ Notícias encontradas: ${count}`);
    } else {
      console.log(`   ❌ Status: ${noticiasRes.status}`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ TESTES CONCLUÍDOS\n');

  } catch (err) {
    console.error('\n❌ ERRO:', err.message);
    console.error('\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:3000');
  }
}

runTests();
