<?php
/** api/paginas.php */
/** @var Router $router */

function pagina_serialize(array $r): array {
  return [
    'id'            => (int) $r['id'],
    'slug'          => $r['slug'],
    'titulo'        => $r['titulo'],
    'conteudo'      => $r['conteudo']       ?? '',
    'visivelMenu'  => (bool) $r['visivel_menu'],
    'ordem'         => (int) $r['ordem'],
    'atualizadoEm' => $r['atualizado_em']  ?? null,
  ];
}

$router->get('/api/paginas', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT * FROM paginas ORDER BY ordem, titulo');
  Response::ok(array_map('pagina_serialize', $rows));
});

$router->get('/api/paginas/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM paginas WHERE id = ?', [(int) $p['id']]);
  if (!$row) Response::notFound('Página não encontrada');
  Response::ok(pagina_serialize($row));
});

$router->post('/api/paginas', function (): void {
  Auth::requirePermissao('paginas');
  $b = Request::body();
  if (empty($b['titulo'])) Response::badRequest('Título obrigatório');
  $slugs = array_column(DB::fetchAll('SELECT slug FROM paginas'), 'slug');
  $slug = Slug::unique($b['slug'] ?? $b['titulo'], $slugs);
  $id = DB::insert(
    'INSERT INTO paginas (slug, titulo, conteudo, visivel_menu, ordem, atualizado_em)
     VALUES (?,?,?,?,?,NOW())',
    [$slug, $b['titulo'], $b['conteudo'] ?? '',
     !empty($b['visivelMenu']) ? 1 : 0,
     (int) ($b['ordem'] ?? (count($slugs) + 1))]
  );
  Response::created(pagina_serialize(DB::fetch('SELECT * FROM paginas WHERE id = ?', [$id])));
});

$router->put('/api/paginas/:id', function (array $p): void {
  Auth::requirePermissao('paginas');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM paginas WHERE id = ?', [$id]);
  if (!$prev) Response::notFound('Página não encontrada');
  $slug = $prev['slug'];
  if (!empty($b['slug'])) $slug = Slug::make($b['slug']);
  DB::execute(
    'UPDATE paginas SET slug=?, titulo=?, conteudo=?, visivel_menu=?, ordem=?, atualizado_em=NOW() WHERE id=?',
    [
      $slug,
      $b['titulo']   ?? $prev['titulo'],
      $b['conteudo'] ?? $prev['conteudo'],
      array_key_exists('visivelMenu', $b) ? (!empty($b['visivelMenu']) ? 1 : 0) : (int) $prev['visivel_menu'],
      isset($b['ordem']) ? (int) $b['ordem'] : (int) $prev['ordem'],
      $id,
    ]
  );
  Response::ok(pagina_serialize(DB::fetch('SELECT * FROM paginas WHERE id = ?', [$id])));
});

$router->delete('/api/paginas/:id', function (array $p): void {
  Auth::requirePermissao('paginas');
  $changed = DB::execute('DELETE FROM paginas WHERE id = ?', [(int) $p['id']]);
  if (!$changed) Response::notFound('Página não encontrada');
  Response::ok(['ok' => true]);
});
