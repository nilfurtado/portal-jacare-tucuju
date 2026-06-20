#!/usr/bin/env node

/**
 * Script: Criar 6 Artigos Fictícios Completos do Amapá
 * Com conteúdo realista, imagens e metadados completos
 */

const fs = require('fs');
const path = require('path');
const store = require('../lib/store');

const ARTIGOS_AMAPA = [
  {
    titulo: 'Macapá: Cidade do Equador Recebe Novo Terminal de Cruzeiros',
    lide: 'Investimento de R$ 45 milhões traz esperança de turismo para capital amapaense',
    conteudo: '<h2>Modernização do Porto de Macapá</h2><p>A capital do Amapá receberá um novo terminal de cruzeiros que promete transformar o cenário turístico regional. O terminal, que será construído na área portuária de Macapá, terá capacidade para receber até 2 navios simultaneamente e movimentar 500 mil passageiros por ano.</p><h3>Investimento Estratégico</h3><p>Com um investimento de R$ 45 milhões, o projeto é uma parceria entre a Prefeitura de Macapá, o governo estadual e uma empresa privada de turismo. A obra deve ter início em 2026 e será concluída em 36 meses.</p><h3>Impacto Econômico</h3><p>Segundo previsões, o terminal gerará 800 empregos diretos e 1.200 indiretos. Além disso, estima-se um aumento de 35% no fluxo de turistas na região durante os próximos 5 anos.</p>',
    categoria: 'economia',
    municipio: 'macapa',
    autor: 'Marina Silva',
    tags: ['turismo', 'porto', 'infraestrutura'],
    destaque: true,
    metaDescription: 'Terminal de cruzeiros em Macapá promete revolucionar turismo'
  },
  {
    titulo: 'Operação Integrada da Polícia Desmantela Maior Rede de Tráfico em Santana',
    lide: 'Presos 23 suspeitos e apreendidos 850 kg de drogas em operação coordenada',
    conteudo: '<h2>Resultado de Investigação de 6 Meses</h2><p>A Polícia Civil do Amapá desmantelou a maior rede de tráfico de drogas identificada no estado em operação realizada nos bairros de Santana. A ação resultou na prisão de 23 suspeitos e apreensão de 850 quilogramas de cocaína, maconha e crack.</p><h3>Coordenação Entre Órgãos</h3><p>A operação, batizada de Fronteira Segura, contou com a participação da Polícia Rodoviária Federal, Polícia Militar e Delegacia de Narcóticos. Foram cumpridos 28 mandados de busca e apreensão.</p><h3>Bens Apreendidos</h3><ul><li>850 kg de cocaína pura</li><li>125 kg de maconha</li><li>42 kg de crack</li><li>3 veículos</li><li>R$ 180 mil em espécie</li></ul>',
    categoria: 'policia',
    municipio: 'santana',
    autor: 'Roberto Costa',
    tags: ['segurança', 'tráfico', 'operação'],
    destaque: true,
    metaDescription: 'Polícia desmantel maior rede de tráfico com 23 presos'
  },
  {
    titulo: 'Festival de Arte Indígena em Oiapoque Celebra Cultura Ancestral',
    lide: 'Evento reúne 15 etnias em três dias de programação cultural e musical',
    conteudo: '<h2>Encontro de Culturas na Fronteira</h2><p>Oiapoque sediou o 5º Festival de Arte Indígena do Amapá, reunindo 15 etnias de toda a região durante três dias de programação. O evento atraiu mais de 8 mil visitantes de diferentes estados.</p><h3>Programação Intensa</h3><p>O festival apresentou apresentações de dança folclórica, música tradicional, exposição de artesanato, feira de culinária regional e workshops de técnicas ancestrais. Artistas indígenas de renome nacional participaram como atração especial.</p><h3>Destaques do Festival</h3><ul><li>Apresentação de 45 grupos de dança</li><li>Venda de 150 peças de artesanato</li><li>12 workshops culturais</li><li>Documentário sobre povos indígenas</li></ul>',
    categoria: 'cultura',
    municipio: 'oiapoque',
    autor: 'João Ferreira',
    tags: ['cultura', 'arte', 'indígena'],
    destaque: false,
    metaDescription: 'Festival de Arte Indígena celebra 15 etnias em Oiapoque'
  },
  {
    titulo: 'Campeonato Estadual de Futebol: FC Laranjal Conquista Primeiro Título',
    lide: 'Equipe local vence final e se garante na disputa por vaga em série nacional',
    conteudo: '<h2>Emoção no Estádio de Laranjal do Jari</h2><p>O FC Laranjal conquistou seu primeiro título estadual ao derrotar o Macapá FC por 3 a 2 em jogo disputado no Estádio Municipal de Laranjal do Jari. A vitória garantiu ao time uma vaga nas eliminatórias para a série nacional.</p><h3>Trajetória Vitoriosa</h3><p>A equipe, fundada há apenas 8 anos, percorreu uma trajetória impressionante na competição. Não perdeu nenhum jogo nas fases anteriores e conquistou a taça na final emocionante.</p><h3>Gols da Final</h3><p>Os gols da vitória foram marcados por Rafael (2) e Marinho, enquanto Macapá respondeu com marcas de Silva e Pedrão. O jogo teve 45 mil torcedores presentes no estádio.</p>',
    categoria: 'esportes',
    municipio: 'laranjal-do-jari',
    autor: 'Carlos Mendes',
    tags: ['esportes', 'futebol', 'campeonato'],
    destaque: true,
    metaDescription: 'FC Laranjal vence campeonato estadual de futebol'
  },
  {
    titulo: 'Mazagão Registra Crescimento Econômico de 18% Com Expansão do Turismo',
    lide: 'PIB do município cresce impulsionado por setor de turismo cultural e gastronômico',
    conteudo: '<h2>Dados Econômicos Impressionantes</h2><p>Mazagão divulgou seu relatório econômico anual mostrando crescimento de 18% no PIB em comparação com o ano anterior. O crescimento foi impulsionado principalmente pelo setor de turismo, que representa 35% da receita municipal.</p><h3>Setor de Turismo em Expansão</h3><p>O turismo cultural de Mazagão atraiu 125 mil visitantes no último ano, um aumento de 42% comparado ao ano anterior. A Festa de São Tiago, patrimônio imaterial do Amapá, é o principal atrativo do município.</p><h3>Números do Crescimento</h3><ul><li>Crescimento PIB: 18%</li><li>Visitantes ano passado: 125 mil</li><li>Novos empregos: 320</li><li>Taxa de desemprego reduzida de 12% para 8%</li><li>Aumento de hotéis e pousadas: +25%</li></ul>',
    categoria: 'economia',
    municipio: 'mazagao',
    autor: 'Ana Paula Rodrigues',
    tags: ['economia', 'turismo', 'desenvolvimento'],
    destaque: false,
    metaDescription: 'Mazagão cresce 18% com expansão do turismo cultural'
  },
  {
    titulo: 'Porto Grande Inaugura Rodovia Estratégica que Reduz Trajeto em 40%',
    lide: 'Nova estrada de 35 km liga município a BR-156 e impulsiona desenvolvimento regional',
    conteudo: '<h2>Obra de Importância Regional</h2><p>Porto Grande inaugurou oficialmente a Rodovia Municipal de Integração Regional, uma estrada de 35 quilômetros que conecta o município à BR-156. A obra, que custou R$ 12 milhões, reduz em 40% o tempo de deslocamento para cidades vizinhas.</p><h3>Especificações Técnicas</h3><p>A rodovia possui duas faixas de rolamento, acostamento seguro, sinalização moderna e sistema de drenagem eficiente. O projeto incluiu reflorestamento compensatório de 2 mil árvores nativas.</p><h3>Impacto Socioeconômico</h3><ul><li>Tempo de deslocamento: reduzido de 2h para 1h 20min</li><li>Empregos gerados na construção: 450</li><li>Aumento esperado de comércio regional: 25%</li><li>Beneficiários diretos: 35 mil habitantes</li></ul>',
    categoria: 'municipios',
    municipio: 'porto-grande',
    autor: 'Luis Alberto Santos',
    tags: ['infraestrutura', 'rodovia', 'desenvolvimento'],
    destaque: true,
    metaDescription: 'Porto Grande inaugura rodovia de 35 km que reduz trajeto em 40%'
  }
];

async function criarArticulos() {
  console.log('\n' + '═'.repeat(80));
  console.log('🌳 CRIANDO 6 ARTIGOS FICTÍCIOS DO AMAPÁ');
  console.log('═'.repeat(80) + '\n');

  const relatorio = {
    titulo: 'RELATÓRIO COMPLETO: 6 ARTIGOS FICTÍCIOS DO AMAPÁ',
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    total: 6,
    criados: 0,
    erros: 0,
    artigos: [],
    resumo: {}
  };

  try {
    const noticiasAtuais = await store.read('noticias', []);
    const numeroBase = noticiasAtuais.length;

    for (let i = 0; i < ARTIGOS_AMAPA.length; i++) {
      const dados = ARTIGOS_AMAPA[i];
      const id = numeroBase + i + 1;

      const slug = dados.titulo
        .toLowerCase()
        .replace(/[áàâãé]/g, 'a')
        .replace(/[ôõó]/g, 'o')
        .replace(/[ú]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const artigo = {
        id,
        slug,
        titulo: dados.titulo,
        lide: dados.lide,
        conteudo: dados.conteudo,
        categoria: dados.categoria,
        municipio: dados.municipio,
        autor: dados.autor,
        autorAvatar: `https://i.pravatar.cc/150?img=${id}`,
        data: new Date().toISOString(),
        tags: dados.tags,
        destaque: dados.destaque,
        views: 0,
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
            alt: `Imagem: ${dados.titulo}`
          }
        },
        imagem: `/img/uploads/2026/05/noticia-${id}-principal.jpg`,
        metaDescription: dados.metaDescription,
        criadoEm: new Date().toISOString()
      };

      console.log(`📰 ARTIGO ${i + 1}/6`);
      console.log('─'.repeat(80));
      console.log(`📌 Título: ${artigo.titulo}`);
      console.log(`🏙️  Município: ${artigo.municipio.toUpperCase()}`);
      console.log(`📂 Categoria: ${artigo.categoria}`);
      console.log(`✍️  Autor: ${artigo.autor}`);
      console.log(`🏷️  Tags: ${artigo.tags.join(', ')}`);
      console.log(`⭐ Destaque: ${artigo.destaque ? 'SIM' : 'NÃO'}`);
      console.log(`📏 Caracteres: ${artigo.conteudo.length}`);
      console.log(`✅ CRIADO COM SUCESSO\n`);

      relatorio.artigos.push({
        numero: i + 1,
        id: artigo.id,
        slug: artigo.slug,
        titulo: artigo.titulo,
        categoria: artigo.categoria,
        municipio: artigo.municipio,
        autor: artigo.autor,
        destaque: artigo.destaque,
        tags: artigo.tags,
        caracteres: artigo.conteudo.length,
        metaDescription: artigo.metaDescription
      });

      noticiasAtuais.push(artigo);
      relatorio.criados++;
    }

    await store.update('noticias', () => noticiasAtuais);

    relatorio.resumo = {
      total: relatorio.total,
      criados: relatorio.criados,
      erros: relatorio.erros,
      taxa: ((relatorio.criados / relatorio.total) * 100).toFixed(1) + '%'
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(80) + '\n');
    console.log(`✅ Total: ${relatorio.resumo.total}`);
    console.log(`✅ Criados: ${relatorio.resumo.criados}`);
    console.log(`❌ Erros: ${relatorio.resumo.erros}`);
    console.log(`📈 Taxa de sucesso: ${relatorio.resumo.taxa}`);

    const reportPath = path.join(__dirname, 'relatorio-artigos-amapa.json');
    fs.writeFileSync(reportPath, JSON.stringify(relatorio, null, 2));
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ 6 ARTIGOS DO AMAPÁ CRIADOS COM SUCESSO!');
    console.log('═'.repeat(80));

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  }
}

criarArticulos();
