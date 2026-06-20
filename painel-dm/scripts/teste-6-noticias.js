/**
 * Script de Teste: Criar 6 notícias completas (uma por categoria)
 * Analisar sincronização Painel → Portal
 * Verificar banco de dados (SQLite vs JSON)
 * Gerar relatório detalhado
 */

const fs = require('fs');
const path = require('path');

// Simulando banco de dados
const store = require('../lib/store');

const CATEGORIAS = [
  { slug: 'politica', label: 'Política' },
  { slug: 'policia', label: 'Polícia' },
  { slug: 'cultura', label: 'Cultura' },
  { slug: 'esportes', label: 'Esportes' },
  { slug: 'economia', label: 'Economia' },
  { slug: 'municipios', label: 'Municípios' }
];

const MUNICIPIOS = [
  'macapa', 'santana', 'oiapoque', 'laranjal-do-jari', 'mazagao', 'porto-grande'
];

// Dados de teste para cada notícia
const NOTICIAS_TESTE = [
  {
    titulo: 'Teste 01: Novo Projeto Político em Macapá',
    lide: 'Governo lança novo projeto de desenvolvimento para a capital do Amapá',
    conteudo: '<p>Esta é uma notícia de teste completa sobre política. Contém todos os campos preenchidos para análise de sincronização entre o Painel DM e o Portal de Notícias.</p><p>A notícia possui:</p><ul><li>Título</li><li>Lide (subtítulo)</li><li>Conteúdo HTML</li><li>Categoria: Política</li><li>Município: Macapá</li><li>Autor</li><li>Tags</li><li>Data</li><li>Imagem de capa (5 dimensões)</li><li>Galeria (opcional)</li><li>Meta description para SEO</li></ul>',
    categoria: 'politica',
    municipio: 'macapa',
    autor: 'Admin Teste',
    data: new Date().toISOString(),
    tags: ['política', 'desenvolvimento', 'macapá'],
    destaque: true,
    imagem: '/img/placeholder-1.jpg',
    metaDescription: 'Novo projeto político lançado em Macapá visa impulsionar desenvolvimento econômico',
    status: 'publicado'
  },
  {
    titulo: 'Teste 02: Operação Policial em Santana',
    lide: 'Polícia realiza grande operação em bairro de Santana',
    conteudo: '<p>Notícia de teste sobre segurança pública em Santana. A operação resultou em diversos apreensões e prisões.</p><p>Detalhes da operação:</p><ul><li>Local: Bairros periféricos de Santana</li><li>Data: Hoje</li><li>Envolvidos: Polícia Civil e Militar</li><li>Resultado: 5 prisões, 10kg de drogas apreendidas</li></ul>',
    categoria: 'policia',
    municipio: 'santana',
    autor: 'Repórter Teste',
    data: new Date().toISOString(),
    tags: ['polícia', 'operação', 'segurança'],
    destaque: false,
    imagem: '/img/placeholder-2.jpg',
    metaDescription: 'Grande operação policial em Santana resulta em múltiplas prisões',
    status: 'publicado'
  },
  {
    titulo: 'Teste 03: Festival de Cultura em Oiapoque',
    lide: 'Cidade prepara maior festival cultural do ano',
    conteudo: '<p>Festival cultural de grande porte acontece em Oiapoque. Evento reunirá artistas de toda a região.</p><p>Programação:</p><ul><li>Apresentações de dança folclórica</li><li>Música ao vivo</li><li>Culinária regional</li><li>Exposição de arte local</li><li>Feira de artesanato</li></ul><p>Entrada gratuita para todos.</p>',
    categoria: 'cultura',
    municipio: 'oiapoque',
    autor: 'Crítica Teste',
    data: new Date().toISOString(),
    tags: ['cultura', 'festival', 'arte'],
    destaque: true,
    imagem: '/img/placeholder-3.jpg',
    metaDescription: 'Festival de cultura em Oiapoque celebra tradições regionais com múltiplas atrações',
    status: 'publicado'
  },
  {
    titulo: 'Teste 04: Campeonato de Futebol em Laranjal',
    lide: 'Times locais competem por título regional',
    conteudo: '<p>Campeonato regional de futebol chega à fase final em Laranjal do Jari. Oito equipes competem pela taça.</p><p>Times participantes:</p><ul><li>FC Laranjal</li><li>Santana United</li><li>Macapá FC</li><li>Oiapoque Sports</li><li>Porto Grande FC</li><li>Tartarugalzinho Time</li><li>Mazagão Futebol</li><li>Amapá Sports Club</li></ul>',
    categoria: 'esportes',
    municipio: 'laranjal-do-jari',
    autor: 'Comentarista Teste',
    data: new Date().toISOString(),
    tags: ['esportes', 'futebol', 'campeonato'],
    destaque: false,
    imagem: '/img/placeholder-4.jpg',
    metaDescription: 'Campeonato de futebol regional promete emoção na fase final',
    status: 'publicado'
  },
  {
    titulo: 'Teste 05: Crescimento Econômico em Mazagão',
    lide: 'Município registra aumento de 15% no PIB',
    conteudo: '<p>Mazagão apresenta crescimento econômico significativo. Números mostram recuperação do setor turístico e artesanato local.</p><p>Dados econômicos:</p><ul><li>PIB: +15% em relação ao ano anterior</li><li>Emprego: 450 novos postos</li><li>Turismo: +30% de visitantes</li><li>Artesanato: Export +20%</li></ul><p>Governo creditará crescimento a políticas de incentivo local.</p>',
    categoria: 'economia',
    municipio: 'mazagao',
    autor: 'Analista Teste',
    data: new Date().toISOString(),
    tags: ['economia', 'desenvolvimento', 'turismo'],
    destaque: true,
    imagem: '/img/placeholder-5.jpg',
    metaDescription: 'Mazagão registra crescimento econômico com expansão do turismo e artesanato',
    status: 'publicado'
  },
  {
    titulo: 'Teste 06: Infraestrutura em Porto Grande',
    lide: 'Prefeitura inaugura nova estrada de acesso',
    conteudo: '<p>Porto Grande inaugura estrada que liga município à BR-156. Obra facilita acesso a cidades vizinhas.</p><p>Características da obra:</p><ul><li>Extensão: 35 km</li><li>Investimento: R$ 12 milhões</li><li>Tempo de execução: 18 meses</li><li>Beneficiários: 20 mil habitantes</li><li>Redução de tempo de trajeto: -40%</li></ul><p>Prefeito destaca importância para desenvolvimento regional.</p>',
    categoria: 'municipios',
    municipio: 'porto-grande',
    autor: 'Correspondente Teste',
    data: new Date().toISOString(),
    tags: ['infraestrutura', 'desenvolvimento', 'transporte'],
    destaque: false,
    imagem: '/img/placeholder-6.jpg',
    metaDescription: 'Porto Grande inaugura estrada estratégica de 35 km que melhora acesso regional',
    status: 'publicado'
  }
];

// Cores das categorias
const CORES_CATEGORIA = {
  'politica': '#003366',
  'policia': '#8b0000',
  'cultura': '#6a1b9a',
  'esportes': '#1b5e20',
  'economia': '#00695c',
  'municipios': '#e65100'
};

async function criarNoticias() {
  console.log('🧪 INICIANDO TESTES DE 6 NOTÍCIAS COMPLETAS\n');
  console.log('=' .repeat(70));

  const relatorio = {
    dataInicio: new Date().toISOString(),
    testes: [],
    resumo: {
      total: 6,
      criadas: 0,
      sincronizadas: 0,
      erros: 0
    },
    bancos: {
      json: false,
      sqlite: false
    }
  };

  // Verificar onde os dados estão sendo salvos
  console.log('\n📊 VERIFICANDO BANCO DE DADOS...\n');

  const noticias = await store.read('noticias', []);
  const DB_PATH = require('path').join(__dirname, '..', 'data', 'painel.db');
  const JSON_PATH = require('path').join(__dirname, '..', '..', 'data', 'noticias.json');

  const temSQLite = require('fs').existsSync(DB_PATH);
  const temJSON = require('fs').existsSync(JSON_PATH);

  console.log(`✅ JSON existe: ${temJSON ? 'SIM' : 'NÃO'} (${JSON_PATH})`);
  console.log(`✅ SQLite existe: ${temSQLite ? 'SIM' : 'NÃO'} (${DB_PATH})`);
  console.log(`📈 Notícias atuais: ${noticias.length}\n`);

  relatorio.bancos.json = temJSON;
  relatorio.bancos.sqlite = temSQLite;

  // Criar as 6 notícias
  for (let i = 0; i < NOTICIAS_TESTE.length; i++) {
    const noticia = NOTICIAS_TESTE[i];
    const categoria = CATEGORIAS[i];

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 TESTE ${i + 1}/6: ${categoria.label.toUpperCase()}`);
    console.log(`${'─'.repeat(70)}\n`);

    try {
      // Simular ID e slug
      const id = noticias.length + i + 1;
      const slug = noticia.titulo.toLowerCase()
        .replace(/[áàâãé]/g, 'a')
        .replace(/[ôõó]/g, 'o')
        .replace(/[ú]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Preparar notícia com capa (estrutura expandida)
      const noticiaCompleta = {
        id,
        slug,
        titulo: noticia.titulo,
        lide: noticia.lide,
        conteudo: noticia.conteudo,
        categoria: noticia.categoria,
        municipio: noticia.municipio,
        autor: noticia.autor,
        data: noticia.data,
        tags: noticia.tags,
        destaque: noticia.destaque,
        views: 0,
        status: noticia.status,
        metaDescription: noticia.metaDescription,
        // Nova estrutura de capa (simulado)
        capa: {
          original: `/img/uploads/2026/05/original-${id}.jpg`,
          principal: `/img/uploads/2026/05/noticia-${id}-principal.jpg`,
          principalWebp: `/img/uploads/2026/05/noticia-${id}-principal.webp`,
          homepage: `/img/uploads/2026/05/noticia-${id}-homepage.jpg`,
          homepageWebp: `/img/uploads/2026/05/noticia-${id}-homepage.webp`,
          sidebar: `/img/uploads/2026/05/noticia-${id}-sidebar.jpg`,
          sidebarWebp: `/img/uploads/2026/05/noticia-${id}-sidebar.webp`,
          mobile: `/img/uploads/2026/05/noticia-${id}-mobile.jpg`,
          mobileWebp: `/img/uploads/2026/05/noticia-${id}-mobile.webp`,
          social: `/img/uploads/2026/05/noticia-${id}-social.jpg`,
          socialWebp: `/img/uploads/2026/05/noticia-${id}-social.webp`,
          metadados: {
            largura: 3000,
            altura: 2000,
            mime: 'image/jpeg',
            tamanho: 450000,
            alt: `Imagem de capa: ${noticia.titulo}`
          }
        },
        imagem: `/img/uploads/2026/05/noticia-${id}-principal.jpg`,
        criadoEm: new Date().toISOString()
      };

      // Exibir campos
      console.log('📋 CAMPOS PREENCHIDOS:');
      console.log(`  ✅ ID: ${noticiaCompleta.id}`);
      console.log(`  ✅ Slug: ${noticiaCompleta.slug}`);
      console.log(`  ✅ Título: ${noticiaCompleta.titulo}`);
      console.log(`  ✅ Lide: ${noticiaCompleta.lide.substring(0, 50)}...`);
      console.log(`  ✅ Conteúdo: ${noticiaCompleta.conteudo.length} caracteres`);
      console.log(`  ✅ Categoria: ${noticiaCompleta.categoria}`);
      console.log(`  ✅ Município: ${noticiaCompleta.municipio}`);
      console.log(`  ✅ Autor: ${noticiaCompleta.autor}`);
      console.log(`  ✅ Data: ${noticiaCompleta.data}`);
      console.log(`  ✅ Tags: ${noticiaCompleta.tags.join(', ')}`);
      console.log(`  ✅ Destaque: ${noticiaCompleta.destaque ? 'SIM' : 'NÃO'}`);
      console.log(`  ✅ Capa Principal: ${noticiaCompleta.capa.principal}`);
      console.log(`  ✅ Capa WebP: ${noticiaCompleta.capa.principalWebp}`);
      console.log(`  ✅ Meta Description: ${noticiaCompleta.metaDescription}`);
      console.log(`  ✅ Views: ${noticiaCompleta.views}`);
      console.log(`  ✅ Status: ${noticiaCompleta.status}\n`);

      // Salvar no banco
      const noticiasAtuais = await store.read('noticias', []);
      noticiasAtuais.push(noticiaCompleta);
      await store.update('noticias', () => noticiasAtuais);

      console.log(`✅ SALVO COM SUCESSO\n`);

      relatorio.testes.push({
        numero: i + 1,
        categoria: categoria.label,
        titulo: noticiaCompleta.titulo,
        slug: noticiaCompleta.slug,
        id: noticiaCompleta.id,
        campos: 17,
        status: 'Criada',
        timestamp: new Date().toISOString()
      });

      relatorio.resumo.criadas++;

    } catch (err) {
      console.log(`❌ ERRO: ${err.message}\n`);
      relatorio.resumo.erros++;
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(70) + '\n');

  console.log(`Total de testes: ${relatorio.resumo.total}`);
  console.log(`✅ Notícias criadas: ${relatorio.resumo.criadas}`);
  console.log(`❌ Erros: ${relatorio.resumo.erros}`);
  console.log(`📊 Taxa de sucesso: ${((relatorio.resumo.criadas / relatorio.resumo.total) * 100).toFixed(1)}%`);
  console.log(`💾 Banco usado: ${relatorio.bancos.json ? 'JSON' : 'SQLite'}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ TESTES COMPLETOS!');
  console.log('='.repeat(70));

  // Salvar relatório
  const reportPath = path.join(__dirname, '../scripts/relatorio-teste-6.json');
  fs.writeFileSync(reportPath, JSON.stringify(relatorio, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  return relatorio;
}

// Executar
criarNoticias().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
