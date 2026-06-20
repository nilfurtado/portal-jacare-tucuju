<?php
/** api/classificados.php */
/** @var Router $router */

function classificado_serialize(array $r): array {
  return [
    'id'        => (int) $r['id'],
    'titulo'    => $r['titulo'],
    'preco'     => (float) $r['preco'],
    'imagem'    => $r['imagem']    ?? '',
    'cidade'    => $r['cidade']    ?? '',
    'categoria' => $r['categoria'] ?? '',
    'telefone'  => $r['telefone']  ?? '',
  ];
}

$router->get('/api/classificados', function (): void {
  Auth::required();
  $q         = trim((string) Request::query('q', ''));
  $categoria = trim((string) Request::query('categoria', ''));
  $cidade    = trim((string) Request::query('cidade', ''));
  $page      = max(1, (int) Request::query('page', 1));
  $perPage   = max(1, min(100, (int) Request::query('perPage', 20)));

  $where = ['removido_em IS NULL']; $params = [];
  if ($q !== '')         { $where[] = 'titulo LIKE ?'; $params[] = '%' . $q . '%'; }
  if ($categoria !== '') { $where[] = 'categoria = ?'; $params[] = $categoria; }
  if ($cidade !== '')    { $where[] = 'LOWER(cidade) = LOWER(?)'; $params[] = $cidade; }
  $whereSql = implode(' AND ', $where);

  $total  = (int) DB::fetchColumn("SELECT COUNT(*) FROM classificados WHERE $whereSql", $params);
  $offset = ($page - 1) * $perPage;
  $items  = DB::fetchAll("SELECT * FROM classificados WHERE $whereSql ORDER BY id DESC LIMIT $perPage OFFSET $offset", $params);

  Response::ok([
    'total' => $total, 'page' => $page, 'perPage' => $perPage,
    'totalPages' => (int) ceil($total / $perPage),
    'items' => array_map('classificado_serialize', $items),
  ]);
});

$router->get('/api/classificados/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM classificados WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Anúncio não encontrado');
  Response::ok(classificado_serialize($row));
});

$router->post('/api/classificados', function (): void {
  Auth::requirePermissao('classificados');
  $b = Request::body();
  if (empty($b['titulo'])) Response::badRequest('Título obrigatório');
  $id = DB::insert(
    'INSERT INTO classificados (titulo, preco, imagem, cidade, categoria, telefone) VALUES (?,?,?,?,?,?)',
    [$b['titulo'], (float) ($b['preco'] ?? 0), $b['imagem'] ?? '', $b['cidade'] ?? '', $b['categoria'] ?? '', $b['telefone'] ?? '']
  );
  Response::created(classificado_serialize(DB::fetch('SELECT * FROM classificados WHERE id = ?', [$id])));
});

$router->put('/api/classificados/:id', function (array $p): void {
  Auth::requirePermissao('classificados');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM classificados WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$prev) Response::notFound('Anúncio não encontrado');
  DB::execute(
    'UPDATE classificados SET titulo=?, preco=?, imagem=?, cidade=?, categoria=?, telefone=? WHERE id=?',
    [
      $b['titulo']    ?? $prev['titulo'],
      isset($b['preco']) ? (float) $b['preco'] : (float) $prev['preco'],
      $b['imagem']    ?? $prev['imagem'],
      $b['cidade']    ?? $prev['cidade'],
      $b['categoria'] ?? $prev['categoria'],
      $b['telefone']  ?? $prev['telefone'],
      $id,
    ]
  );
  Response::ok(classificado_serialize(DB::fetch('SELECT * FROM classificados WHERE id = ?', [$id])));
});

$router->delete('/api/classificados/:id', function (array $p): void {
  Auth::requirePermissao('classificados');
  $changed = DB::execute('UPDATE classificados SET removido_em = NOW() WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$changed) Response::notFound('Anúncio não encontrado');
  Response::ok(['ok' => true]);
});
