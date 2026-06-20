<?php
/** api/tema.php — tema + layout (8 abas) usando tabela config */
/** @var Router $router */

function tema_default(): array {
  return [
    'presetAtivo' => 'tijolo',
    'presets' => [
      ['id'=>'tijolo',  'nome'=>'Tijolo',  'primaria'=>'#c9551d','secundaria'=>'#14110d','acento'=>'#a3441a'],
      ['id'=>'oceano',  'nome'=>'Oceano',  'primaria'=>'#2c6e9b','secundaria'=>'#0d2433','acento'=>'#1d4d70'],
      ['id'=>'floresta','nome'=>'Floresta','primaria'=>'#3e7b3a','secundaria'=>'#0e1a0e','acento'=>'#2d5c2a'],
      ['id'=>'noite',   'nome'=>'Noite',   'primaria'=>'#d4af37','secundaria'=>'#0a0a0a','acento'=>'#a8881d'],
      ['id'=>'amapa',   'nome'=>'Amapá',   'primaria'=>'#f07e13','secundaria'=>'#0b3d2e','acento'=>'#d36500'],
    ],
    'modo' => 'claro',
    'fontes' => ['display'=>'Fraunces','body'=>'Geist'],
    'corPrimaria' => '#c9551d',
  ];
}

function layout_default(): array {
  return [
    'topo' => [
      'cor'=>'padrao','tamanhoLogo'=>'40','alinhamentoLogo'=>'centro',
      'dataNoTopo'=>false,'storiesDesktop'=>true,'storiesMobile'=>true,
    ],
    'widgets' => [
      'tempoNoTopo'=>true,'tempoCompleto'=>true,'financas'=>false,'loteria'=>false,
      'sidebarSocial'=>true,'sidebarMaisLidas'=>true,'sidebarCategorias'=>true,
      'sidebarEnquete'=>true,'sidebarClassificados'=>true,'sidebarNewsletter'=>true,
    ],
    'menu' => [
      'corFundo'=>'branca','itens'=>['','','','','','','','','','',''],'exibirMobile'=>true,
    ],
    'secaoPrincipal' => [
      'layoutHero'=>'editorial','mostrarManchete'=>true,'mostrarCarrossel'=>true,
      'mostrarSecundarias'=>true,'qtdSecundarias'=>4,
    ],
    'secoesExtras' => [
      'breakingNews'=>true,'secaoMunicipios'=>true,'secaoVideos'=>true,
      'secaoEnqueteDestaque'=>true,'secaoClassificados'=>true,'secaoColunistas'=>true,
    ],
    'publicidades' => ['permitirAds'=>true,'pausarTodos'=>false],
    'outros' => [
      'breakingNewsMs'=>65000,'heroCarouselMs'=>5500,
      'mostrarCopyright'=>true,'mostrarPoweredBy'=>true,'densidade'=>'confortavel',
    ],
  ];
}

function merge_deep(array $base, array $over): array {
  foreach ($over as $k => $v) {
    if (is_array($v) && isset($base[$k]) && is_array($base[$k])) {
      $base[$k] = merge_deep($base[$k], $v);
    } else {
      $base[$k] = $v;
    }
  }
  return $base;
}

function tema_carregar(): array {
  $r = DB::fetch("SELECT valor FROM config WHERE chave = 'tema'");
  return merge_deep(tema_default(), $r ? (json_decode($r['valor'], true) ?: []) : []);
}

function layout_carregar(): array {
  $r = DB::fetch("SELECT valor FROM config WHERE chave = 'layout'");
  return merge_deep(layout_default(), $r ? (json_decode($r['valor'], true) ?: []) : []);
}

$router->get('/api/tema', function (): void {
  Auth::required();
  Response::ok(['tema' => tema_carregar(), 'layout' => layout_carregar()]);
});

$router->put('/api/tema', function (): void {
  Auth::requirePermissao('temas');
  $b = Request::body();
  if (isset($b['tema']) && is_array($b['tema'])) {
    $novo = merge_deep(tema_carregar(), $b['tema']);
    DB::execute(
      'INSERT INTO config (chave, valor) VALUES ("tema", ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), atualizado_em = NOW()',
      [json_encode($novo, JSON_UNESCAPED_UNICODE)]
    );
  }
  if (isset($b['layout']) && is_array($b['layout'])) {
    $novo = merge_deep(layout_carregar(), $b['layout']);
    DB::execute(
      'INSERT INTO config (chave, valor) VALUES ("layout", ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), atualizado_em = NOW()',
      [json_encode($novo, JSON_UNESCAPED_UNICODE)]
    );
  }
  Response::ok(['tema' => tema_carregar(), 'layout' => layout_carregar()]);
});

// PUBLIC para o portal estático ler
$router->get('/api/tema/public', function (): void {
  Response::ok(['tema' => tema_carregar(), 'layout' => layout_carregar()]);
});
