<?php
/** api/anuncios.php — CRUD de slots publicitários */
/** @var Router $router */

function anuncio_serialize(array $row): array {
  return [
    'id'         => (int) $row['id'],
    'nome'       => $row['nome'],
    'tipo'       => $row['tipo'],
    'tamanho'    => $row['tamanho'],
    'posicao'    => $row['posicao'],
    'paginas'    => is_string($row['paginas']) ? (json_decode($row['paginas'], true) ?: []) : ($row['paginas'] ?? []),
    'ativo'      => (bool) $row['ativo'],
    'criativo'   => [
      'imagem' => $row['criativo_imagem'] ?? '',
      'html'   => $row['criativo_html']   ?? '',
      'titulo' => $row['criativo_titulo'] ?? '',
    ],
    'destino'    => $row['destino'] ?? '',
    'periodo'    => [
      'inicio' => $row['periodo_inicio'],
      'fim'    => $row['periodo_fim'],
    ],
    'impressoes' => (int) $row['impressoes'],
    'cliques'    => (int) $row['cliques'],
  ];
}

$router->get('/api/anuncios', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT * FROM anuncios WHERE removido_em IS NULL ORDER BY id');
  Response::ok(array_map('anuncio_serialize', $rows));
});

$router->get('/api/anuncios/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM anuncios WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Anúncio não encontrado');
  Response::ok(anuncio_serialize($row));
});

$router->post('/api/anuncios', function (): void {
  Auth::requirePermissao('anuncios');
  $b = Request::body();
  if (empty($b['nome']) || empty($b['tipo']) || empty($b['tamanho'])) {
    Response::badRequest('Informe nome, tipo e tamanho');
  }
  $crv = $b['criativo'] ?? [];
  $per = $b['periodo'] ?? [];
  $id = DB::insert(
    'INSERT INTO anuncios
       (nome, tipo, tamanho, posicao, paginas, ativo,
        criativo_imagem, criativo_html, criativo_titulo, destino,
        periodo_inicio, periodo_fim)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      $b['nome'], $b['tipo'], $b['tamanho'], $b['posicao'] ?? '',
      json_encode($b['paginas'] ?? []), !empty($b['ativo']) ? 1 : 0,
      $crv['imagem'] ?? '', $crv['html'] ?? '', $crv['titulo'] ?? '',
      $b['destino'] ?? '',
      $per['inicio'] ?? null, $per['fim'] ?? null,
    ]
  );
  Response::created(anuncio_serialize(DB::fetch('SELECT * FROM anuncios WHERE id = ?', [$id])));
});

$router->put('/api/anuncios/:id', function (array $p): void {
  Auth::requirePermissao('anuncios');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM anuncios WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$prev) Response::notFound('Anúncio não encontrado');

  $crv = ($b['criativo'] ?? []) + ['imagem' => null, 'html' => null, 'titulo' => null];
  $per = ($b['periodo']  ?? []) + ['inicio' => null, 'fim' => null];

  DB::execute(
    'UPDATE anuncios SET
       nome = ?, tipo = ?, tamanho = ?, posicao = ?, paginas = ?, ativo = ?,
       criativo_imagem = ?, criativo_html = ?, criativo_titulo = ?, destino = ?,
       periodo_inicio = ?, periodo_fim = ?
     WHERE id = ?',
    [
      $b['nome']    ?? $prev['nome'],
      $b['tipo']    ?? $prev['tipo'],
      $b['tamanho'] ?? $prev['tamanho'],
      $b['posicao'] ?? $prev['posicao'],
      isset($b['paginas']) ? json_encode($b['paginas']) : $prev['paginas'],
      isset($b['ativo']) ? ($b['ativo'] ? 1 : 0) : (int) $prev['ativo'],
      $crv['imagem'] ?? $prev['criativo_imagem'],
      $crv['html']   ?? $prev['criativo_html'],
      $crv['titulo'] ?? $prev['criativo_titulo'],
      $b['destino'] ?? $prev['destino'],
      array_key_exists('inicio', $b['periodo'] ?? []) ? $per['inicio'] : $prev['periodo_inicio'],
      array_key_exists('fim',    $b['periodo'] ?? []) ? $per['fim']    : $prev['periodo_fim'],
      $id,
    ]
  );
  Response::ok(anuncio_serialize(DB::fetch('SELECT * FROM anuncios WHERE id = ?', [$id])));
});

$router->patch('/api/anuncios/:id/ativar', function (array $p): void {
  Auth::requirePermissao('anuncios');
  $id = (int) $p['id'];
  $cur = DB::fetchColumn('SELECT ativo FROM anuncios WHERE id = ? AND removido_em IS NULL', [$id]);
  if ($cur === null) Response::notFound('Anúncio não encontrado');
  $novo = $cur ? 0 : 1;
  DB::execute('UPDATE anuncios SET ativo = ? WHERE id = ?', [$novo, $id]);
  Response::ok(['id' => $id, 'ativo' => (bool) $novo]);
});

$router->delete('/api/anuncios/:id', function (array $p): void {
  Auth::requirePermissao('anuncios');
  $id = (int) $p['id'];
  $changed = DB::execute('UPDATE anuncios SET removido_em = NOW() WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$changed) Response::notFound('Anúncio não encontrado');
  Response::ok(['ok' => true]);
});

// PUBLIC endpoint para o portal ler — sem auth — só slots ativos
$router->get('/api/anuncios/public', function (): void {
  $rows = DB::fetchAll(
    "SELECT id, nome, tipo, tamanho, posicao, paginas,
            criativo_imagem, criativo_html, criativo_titulo, destino,
            periodo_inicio, periodo_fim
     FROM anuncios
     WHERE removido_em IS NULL AND ativo = 1
       AND (periodo_inicio IS NULL OR periodo_inicio <= NOW())
       AND (periodo_fim    IS NULL OR periodo_fim    >= NOW())"
  );
  $out = array_map(function ($r) {
    return [
      'id'       => (int) $r['id'],
      'nome'     => $r['nome'],
      'tipo'     => $r['tipo'],
      'tamanho'  => $r['tamanho'],
      'paginas'  => is_string($r['paginas']) ? (json_decode($r['paginas'], true) ?: []) : [],
      'criativo' => [
        'imagem' => $r['criativo_imagem'] ?? '',
        'html'   => $r['criativo_html']   ?? '',
        'titulo' => $r['criativo_titulo'] ?? '',
      ],
      'destino'  => $r['destino'] ?? '',
      'ativo'    => true,
      'periodo'  => ['inicio' => $r['periodo_inicio'], 'fim' => $r['periodo_fim']],
    ];
  }, $rows);
  Response::ok($out);
});
