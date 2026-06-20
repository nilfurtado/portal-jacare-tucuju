<?php
/**
 * api/portal.php — endpoints públicos consumidos pelo portal estático.
 * SEM auth, retornos otimizados, CORS aberto, cache headers curtos.
 *
 * Endpoint principal:
 *   GET /api/portal/bootstrap → tudo que loadAll() do portal precisa em 1 request
 */
/** @var Router $router */

// Cache curto para reduzir carga (60s) — o navegador também faz cache via 'Cache-Control'
function portal_cache_headers(int $seconds = 60): void {
  header("Cache-Control: public, max-age=$seconds, s-maxage=$seconds");
  header('Vary: Accept-Encoding, Origin');
  // CORS aberto pra portais hospedados em domínio diferente
  if (!isset($_SERVER['HTTP_ORIGIN'])) header('Access-Control-Allow-Origin: *');
}

// Helpers de serialização compactos (sem campos sensíveis ou pesados na listagem)
function portal_noticia_lite(array $r): array {
  return [
    'id'        => (int) $r['id'],
    'slug'      => $r['slug'],
    'titulo'    => $r['titulo'],
    'lide'      => $r['lide'] ?? '',
    'imagem'    => $r['imagem'] ?? '',
    'categoria' => $r['categoria'] ?? '',
    'municipio' => $r['municipio'] ?? '',
    'autor'     => $r['autor'] ?? '',
    'autorAvatar' => $r['autor_avatar'] ?? '',
    'data'      => $r['data'],
    'tags'      => is_string($r['tags']) ? (json_decode($r['tags'], true) ?: []) : ($r['tags'] ?? []),
    'destaque'  => (bool) $r['destaque'],
    'views'     => (int) $r['views'],
    'tempoLeitura' => (int) ($r['tempo_leitura'] ?? 1),
  ];
}

function portal_noticia_full(array $r): array {
  return portal_noticia_lite($r) + ['conteudo' => $r['conteudo'] ?? ''];
}

/**
 * GET /api/portal/bootstrap
 * Retorna todo o pacote que o portal precisa para renderizar
 * (notícias, categorias, municípios, enquetes, vídeos, classificados,
 * colunas, classificados-categorias, config). Equivale ao loadAll().
 */
$router->get('/api/portal/bootstrap', function (): void {
  portal_cache_headers(60);

  $noticias = array_map('portal_noticia_lite', DB::fetchAll(
    'SELECT * FROM noticias WHERE removido_em IS NULL ORDER BY data DESC LIMIT 200'
  ));

  $categorias = DB::fetchAll('SELECT slug, label, cor, ordem FROM categorias ORDER BY ordem, label');
  $municipios = array_map(function ($r) {
    return [
      'slug'      => $r['slug'],
      'label'     => $r['label'],
      'populacao' => (int) $r['populacao'],
      'descricao' => $r['descricao'] ?? '',
      'imagem'    => $r['imagem']    ?? '',
    ];
  }, DB::fetchAll('SELECT * FROM municipios ORDER BY label'));

  $enquetes = array_map(function ($r) {
    return [
      'id'       => $r['id'],
      'pergunta' => $r['pergunta'],
      'opcoes'   => is_string($r['opcoes']) ? (json_decode($r['opcoes'], true) ?: []) : ($r['opcoes'] ?? []),
      'ativa'    => (bool) $r['ativa'],
    ];
  }, DB::fetchAll('SELECT * FROM enquetes ORDER BY ativa DESC, criado_em DESC'));

  $videos = array_map(function ($r) {
    return [
      'id'        => (int) $r['id'],
      'titulo'    => $r['titulo'],
      'thumb'     => $r['thumb'] ?? '',
      'duracao'   => $r['duracao'] ?? '',
      'youtubeId' => $r['youtube_id'],
      'categoria' => $r['categoria'] ?? '',
    ];
  }, DB::fetchAll('SELECT * FROM videos WHERE removido_em IS NULL ORDER BY id DESC LIMIT 30'));

  $classificados = array_map(function ($r) {
    return [
      'id'        => (int) $r['id'],
      'titulo'    => $r['titulo'],
      'preco'     => (float) $r['preco'],
      'imagem'    => $r['imagem']    ?? '',
      'cidade'    => $r['cidade']    ?? '',
      'categoria' => $r['categoria'] ?? '',
      'telefone'  => $r['telefone']  ?? '',
    ];
  }, DB::fetchAll('SELECT * FROM classificados WHERE removido_em IS NULL ORDER BY id DESC LIMIT 30'));

  $classCats = DB::fetchAll('SELECT slug, label, cor, icon FROM classificados_categorias ORDER BY label');

  $colunas = array_map(function ($r) {
    return [
      'id'        => (int) $r['id'],
      'colunista' => $r['colunista'],
      'avatar'    => $r['avatar'] ?? '',
      'titulo'    => $r['titulo'],
      'slug'      => $r['slug'],
      'data'      => $r['data'],
    ];
  }, DB::fetchAll('SELECT * FROM colunas WHERE removido_em IS NULL ORDER BY data DESC LIMIT 20'));

  // Config — junta portal/redes/whatsapp
  $cfgRows = DB::fetchAll('SELECT chave, valor FROM config WHERE chave IN ("portal","redes","whatsapp")');
  $config = [];
  foreach ($cfgRows as $r) {
    $config[$r['chave']] = is_string($r['valor']) ? (json_decode($r['valor'], true) ?: []) : ($r['valor'] ?? []);
  }
  $config['portal']   ??= ['nome' => '', 'slogan' => '', 'url' => ''];
  $config['redes']    ??= ['facebook' => '', 'instagram' => '', 'youtube' => '', 'twitter' => ''];
  $config['whatsapp'] ??= ['grupo' => '', 'numero' => ''];

  Response::ok([
    'noticias'                 => $noticias,
    'categorias'               => $categorias,
    'municipios'               => $municipios,
    'enquetes'                 => $enquetes,
    'videos'                   => $videos,
    'classificados'            => $classificados,
    'classificadosCategorias'  => $classCats,
    'colunas'                  => $colunas,
    'config'                   => $config,
    'geradoEm'                => date(DATE_ATOM),
  ]);
});

/**
 * GET /api/portal/noticia/:slug
 * Retorna notícia individual com conteúdo completo (para noticia.html).
 */
$router->get('/api/portal/noticia/:slug', function (array $p): void {
  portal_cache_headers(120);
  $row = DB::fetch('SELECT * FROM noticias WHERE slug = ? AND removido_em IS NULL', [$p['slug']]);
  if (!$row) Response::notFound('Notícia não encontrada');
  // Incrementa views fora da requisição principal (sem bloquear)
  DB::execute('UPDATE noticias SET views = views + 1 WHERE id = ?', [(int) $row['id']]);
  $row['views'] = (int) $row['views'] + 1;
  Response::ok(portal_noticia_full($row));
});

/**
 * GET /api/portal/categoria/:slug
 * Lista de notícias filtradas por categoria (pra categoria.html).
 */
$router->get('/api/portal/categoria/:slug', function (array $p): void {
  portal_cache_headers(60);
  $page    = max(1, (int) Request::query('page', 1));
  $perPage = max(1, min(50, (int) Request::query('perPage', 20)));
  $offset  = ($page - 1) * $perPage;

  $total = (int) DB::fetchColumn(
    'SELECT COUNT(*) FROM noticias WHERE categoria = ? AND removido_em IS NULL',
    [$p['slug']]
  );
  $items = array_map('portal_noticia_lite', DB::fetchAll(
    "SELECT * FROM noticias WHERE categoria = ? AND removido_em IS NULL
     ORDER BY data DESC LIMIT $perPage OFFSET $offset",
    [$p['slug']]
  ));
  Response::ok([
    'total'      => $total,
    'page'       => $page,
    'perPage'    => $perPage,
    'totalPages' => (int) ceil($total / $perPage),
    'items'      => $items,
  ]);
});

/**
 * GET /api/portal/municipio/:slug
 * Lista por município.
 */
$router->get('/api/portal/municipio/:slug', function (array $p): void {
  portal_cache_headers(60);
  $items = array_map('portal_noticia_lite', DB::fetchAll(
    'SELECT * FROM noticias WHERE municipio = ? AND removido_em IS NULL
     ORDER BY data DESC LIMIT 30',
    [$p['slug']]
  ));
  Response::ok($items);
});

/**
 * GET /api/portal/busca?q=...
 * Full-text simples por título/lide/tags.
 */
$router->get('/api/portal/busca', function (): void {
  portal_cache_headers(30);
  $q = trim((string) Request::query('q', ''));
  if ($q === '' || mb_strlen($q) < 2) {
    Response::ok([]);
    return;
  }
  $like = '%' . $q . '%';
  $items = array_map('portal_noticia_lite', DB::fetchAll(
    'SELECT * FROM noticias
     WHERE removido_em IS NULL
       AND (titulo LIKE ? OR lide LIKE ? OR JSON_SEARCH(LOWER(tags), "one", LOWER(?)) IS NOT NULL)
     ORDER BY data DESC LIMIT 40',
    [$like, $like, $q]
  ));
  Response::ok($items);
});

/**
 * POST /api/portal/voto/:enqueteId/:opcaoId
 * Registra voto (sem auth — público).
 */
$router->post('/api/portal/voto/:enqueteId/:opcaoId', function (array $p): void {
  $enq = DB::fetch('SELECT * FROM enquetes WHERE id = ?', [$p['enqueteId']]);
  if (!$enq) Response::notFound('Enquete não encontrada');

  $opcoes = is_string($enq['opcoes']) ? (json_decode($enq['opcoes'], true) ?: []) : $enq['opcoes'];
  $achou = false;
  foreach ($opcoes as &$o) {
    if (($o['id'] ?? '') === $p['opcaoId']) {
      $o['votos'] = (int) ($o['votos'] ?? 0) + 1;
      $achou = true;
      break;
    }
  }
  unset($o);
  if (!$achou) Response::notFound('Opção não encontrada');

  DB::execute(
    'UPDATE enquetes SET opcoes = ? WHERE id = ?',
    [json_encode($opcoes, JSON_UNESCAPED_UNICODE), $p['enqueteId']]
  );
  Response::ok(['ok' => true, 'opcoes' => $opcoes]);
});
