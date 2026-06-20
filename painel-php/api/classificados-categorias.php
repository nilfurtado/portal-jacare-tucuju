<?php
/** api/classificados-categorias.php */
/** @var Router $router */

$router->get('/api/classificados-categorias', function (): void {
  Auth::required();
  Response::ok(DB::fetchAll('SELECT slug, label, cor, icon FROM classificados_categorias ORDER BY label'));
});

$router->post('/api/classificados-categorias', function (): void {
  Auth::requirePermissao('classificados');
  $b = Request::body();
  if (empty($b['label'])) Response::badRequest('Label obrigatório');
  $slug = Slug::make($b['label']);
  if (DB::fetchColumn('SELECT 1 FROM classificados_categorias WHERE slug = ?', [$slug])) {
    Response::conflict('Categoria já existe');
  }
  DB::execute(
    'INSERT INTO classificados_categorias (slug, label, cor, icon) VALUES (?,?,?,?)',
    [$slug, $b['label'], $b['cor'] ?? '#999', $b['icon'] ?? '']
  );
  Response::created(['slug' => $slug, 'label' => $b['label'], 'cor' => $b['cor'] ?? '#999', 'icon' => $b['icon'] ?? '']);
});

$router->put('/api/classificados-categorias/:slug', function (array $p): void {
  Auth::requirePermissao('classificados');
  $b = Request::body();
  $changed = DB::execute(
    'UPDATE classificados_categorias SET
       label = COALESCE(?, label), cor = COALESCE(?, cor), icon = COALESCE(?, icon)
     WHERE slug = ?',
    [$b['label'] ?? null, $b['cor'] ?? null, $b['icon'] ?? null, $p['slug']]
  );
  if (!$changed) Response::notFound('Categoria não encontrada');
  Response::ok(DB::fetch('SELECT slug, label, cor, icon FROM classificados_categorias WHERE slug = ?', [$p['slug']]));
});

$router->delete('/api/classificados-categorias/:slug', function (array $p): void {
  Auth::requirePermissao('classificados');
  $changed = DB::execute('DELETE FROM classificados_categorias WHERE slug = ?', [$p['slug']]);
  if (!$changed) Response::notFound('Categoria não encontrada');
  Response::ok(['ok' => true]);
});
