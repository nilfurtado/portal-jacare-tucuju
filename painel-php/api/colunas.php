<?php
/** api/colunas.php */
/** @var Router $router */

function coluna_serialize(array $r): array {
  return [
    'id'        => (int) $r['id'],
    'colunista' => $r['colunista'],
    'avatar'    => $r['avatar']   ?? '',
    'titulo'    => $r['titulo'],
    'slug'      => $r['slug'],
    'data'      => $r['data'],
  ];
}

$router->get('/api/colunas', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT * FROM colunas WHERE removido_em IS NULL ORDER BY data DESC');
  Response::ok(array_map('coluna_serialize', $rows));
});

$router->get('/api/colunas/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM colunas WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Coluna não encontrada');
  Response::ok(coluna_serialize($row));
});

$router->post('/api/colunas', function (): void {
  Auth::requirePermissao('colunas');
  $b = Request::body();
  if (empty($b['colunista']) || empty($b['titulo'])) Response::badRequest('Informe colunista e título');
  $slugs = array_column(DB::fetchAll('SELECT slug FROM colunas'), 'slug');
  $slug = Slug::unique($b['colunista'] . '-' . $b['titulo'], $slugs);
  $id = DB::insert(
    'INSERT INTO colunas (colunista, avatar, titulo, slug, data, conteudo) VALUES (?,?,?,?,?,?)',
    [$b['colunista'], $b['avatar'] ?? '', $b['titulo'], $slug, $b['data'] ?? date('Y-m-d H:i:s'), $b['conteudo'] ?? '']
  );
  Response::created(coluna_serialize(DB::fetch('SELECT * FROM colunas WHERE id = ?', [$id])));
});

$router->put('/api/colunas/:id', function (array $p): void {
  Auth::requirePermissao('colunas');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM colunas WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$prev) Response::notFound('Coluna não encontrada');
  $slug = $prev['slug'];
  if (isset($b['titulo']) || isset($b['colunista'])) {
    $base = ($b['colunista'] ?? $prev['colunista']) . '-' . ($b['titulo'] ?? $prev['titulo']);
    $novo = Slug::make($base);
    if ($novo !== $prev['slug']) {
      $slugs = array_column(DB::fetchAll('SELECT slug FROM colunas WHERE id != ?', [$id]), 'slug');
      $slug = Slug::unique($base, $slugs);
    }
  }
  DB::execute(
    'UPDATE colunas SET colunista = ?, avatar = ?, titulo = ?, slug = ?, data = ?, conteudo = ? WHERE id = ?',
    [
      $b['colunista'] ?? $prev['colunista'],
      $b['avatar']    ?? $prev['avatar'],
      $b['titulo']    ?? $prev['titulo'],
      $slug,
      $b['data']     ?? $prev['data'],
      $b['conteudo'] ?? $prev['conteudo'],
      $id,
    ]
  );
  Response::ok(coluna_serialize(DB::fetch('SELECT * FROM colunas WHERE id = ?', [$id])));
});

$router->delete('/api/colunas/:id', function (array $p): void {
  Auth::requirePermissao('colunas');
  $changed = DB::execute('UPDATE colunas SET removido_em = NOW() WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$changed) Response::notFound('Coluna não encontrada');
  Response::ok(['ok' => true]);
});
