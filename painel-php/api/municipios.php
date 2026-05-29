<?php
/** api/municipios.php */
/** @var Router $router */

function municipio_serialize(array $r): array {
  return [
    'slug'      => $r['slug'],
    'label'     => $r['label'],
    'populacao' => (int) $r['populacao'],
    'descricao' => $r['descricao'] ?? '',
    'imagem'    => $r['imagem']    ?? '',
  ];
}

$router->get('/api/municipios', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT * FROM municipios ORDER BY label');
  Response::ok(array_map('municipio_serialize', $rows));
});

$router->get('/api/municipios/:slug', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM municipios WHERE slug = ?', [$p['slug']]);
  if (!$row) Response::notFound('Município não encontrado');
  Response::ok(municipio_serialize($row));
});

$router->post('/api/municipios', function (): void {
  Auth::requirePermissao('municipios');
  $b = Request::body();
  if (empty($b['label'])) Response::badRequest('Label obrigatório');
  $slug = Slug::make($b['label']);
  if (DB::fetchColumn('SELECT 1 FROM municipios WHERE slug = ?', [$slug])) {
    Response::conflict('Município já cadastrado');
  }
  DB::execute(
    'INSERT INTO municipios (slug, label, populacao, descricao, imagem) VALUES (?,?,?,?,?)',
    [$slug, $b['label'], (int) ($b['populacao'] ?? 0), $b['descricao'] ?? '', $b['imagem'] ?? '']
  );
  Response::created(municipio_serialize(DB::fetch('SELECT * FROM municipios WHERE slug = ?', [$slug])));
});

$router->put('/api/municipios/:slug', function (array $p): void {
  Auth::requirePermissao('municipios');
  $b = Request::body();
  $changed = DB::execute(
    'UPDATE municipios SET
       label = COALESCE(?, label),
       populacao = COALESCE(?, populacao),
       descricao = COALESCE(?, descricao),
       imagem = COALESCE(?, imagem)
     WHERE slug = ?',
    [
      $b['label']     ?? null,
      isset($b['populacao']) ? (int) $b['populacao'] : null,
      $b['descricao'] ?? null,
      $b['imagem']    ?? null,
      $p['slug'],
    ]
  );
  if (!$changed) Response::notFound('Município não encontrado');
  Response::ok(municipio_serialize(DB::fetch('SELECT * FROM municipios WHERE slug = ?', [$p['slug']])));
});

$router->delete('/api/municipios/:slug', function (array $p): void {
  Auth::requirePermissao('municipios');
  if (DB::fetchColumn('SELECT 1 FROM noticias WHERE municipio = ? LIMIT 1', [$p['slug']])) {
    Response::conflict('Município em uso por notícias');
  }
  $changed = DB::execute('DELETE FROM municipios WHERE slug = ?', [$p['slug']]);
  if (!$changed) Response::notFound('Município não encontrado');
  Response::ok(['ok' => true]);
});
