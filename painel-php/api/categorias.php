<?php
/** api/categorias.php — CRUD de editorias */
/** @var Router $router */

$router->get('/api/categorias', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT slug, label, cor, ordem FROM categorias ORDER BY ordem, label');
  Response::ok($rows);
});

$router->post('/api/categorias', function (): void {
  Auth::requirePermissao('categorias');
  $b = Request::body();
  if (empty($b['label'])) Response::badRequest('Label obrigatório');
  $slug = Slug::make($b['label']);
  $exists = DB::fetchColumn('SELECT slug FROM categorias WHERE slug = ?', [$slug]);
  if ($exists) Response::conflict('Categoria já existe');
  DB::execute(
    'INSERT INTO categorias (slug, label, cor, ordem) VALUES (?, ?, ?, ?)',
    [$slug, $b['label'], $b['cor'] ?? '#999999', (int) ($b['ordem'] ?? 0)]
  );
  Response::created(['slug' => $slug, 'label' => $b['label'], 'cor' => $b['cor'] ?? '#999999']);
});

$router->put('/api/categorias/:slug', function (array $p): void {
  Auth::requirePermissao('categorias');
  $b = Request::body();
  $changed = DB::execute(
    'UPDATE categorias SET
       label = COALESCE(?, label),
       cor   = COALESCE(?, cor),
       ordem = COALESCE(?, ordem)
     WHERE slug = ?',
    [$b['label'] ?? null, $b['cor'] ?? null, isset($b['ordem']) ? (int) $b['ordem'] : null, $p['slug']]
  );
  if (!$changed) Response::notFound('Categoria não encontrada');
  $row = DB::fetch('SELECT slug, label, cor, ordem FROM categorias WHERE slug = ?', [$p['slug']]);
  Response::ok($row);
});

$router->delete('/api/categorias/:slug', function (array $p): void {
  Auth::requirePermissao('categorias');
  $emUso = DB::fetchColumn('SELECT 1 FROM noticias WHERE categoria = ? LIMIT 1', [$p['slug']]);
  if ($emUso) Response::conflict('Categoria em uso por notícias');
  $changed = DB::execute('DELETE FROM categorias WHERE slug = ?', [$p['slug']]);
  if (!$changed) Response::notFound('Categoria não encontrada');
  Response::ok(['ok' => true]);
});
