<?php
/** api/comentarios.php */
/** @var Router $router */

function comentario_serialize(array $r): array {
  return [
    'id'           => (int) $r['id'],
    'noticiaSlug' => $r['noticia_slug'],
    'autor'        => $r['autor'],
    'email'        => $r['email']        ?? '',
    'texto'        => $r['texto'],
    'status'       => $r['status'],
    'criadoEm'    => $r['criado_em'],
    'moderadoEm'  => $r['moderado_em']  ?? null,
    'moderadoPor' => $r['moderado_por'] ?? null,
  ];
}

$router->get('/api/comentarios', function (): void {
  Auth::required();
  $status      = trim((string) Request::query('status', ''));
  $noticiaSlug = trim((string) Request::query('noticiaSlug', ''));
  $where = ['removido_em IS NULL']; $params = [];
  if ($status !== '')      { $where[] = 'status = ?';       $params[] = $status; }
  if ($noticiaSlug !== '') { $where[] = 'noticia_slug = ?'; $params[] = $noticiaSlug; }
  $rows = DB::fetchAll(
    'SELECT * FROM comentarios WHERE ' . implode(' AND ', $where) . ' ORDER BY criado_em DESC',
    $params
  );
  Response::ok(array_map('comentario_serialize', $rows));
});

$router->get('/api/comentarios/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM comentarios WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Comentário não encontrado');
  Response::ok(comentario_serialize($row));
});

// POST público (sem auth) — leitor envia comentário pendente
$router->post('/api/comentarios', function (): void {
  $b = Request::body();
  if (empty($b['autor']) || empty($b['texto']) || empty($b['noticiaSlug'])) {
    Response::badRequest('autor, texto e noticiaSlug obrigatórios');
  }
  $id = DB::insert(
    'INSERT INTO comentarios (noticia_slug, autor, email, texto, status) VALUES (?,?,?,?,"pendente")',
    [$b['noticiaSlug'], $b['autor'], $b['email'] ?? '', $b['texto']]
  );
  Response::created(comentario_serialize(DB::fetch('SELECT * FROM comentarios WHERE id = ?', [$id])));
});

$router->patch('/api/comentarios/:id/aprovar', function (array $p): void {
  $u = Auth::requirePermissao('comentarios');
  $changed = DB::execute(
    'UPDATE comentarios SET status = "aprovado", moderado_em = NOW(), moderado_por = ? WHERE id = ? AND removido_em IS NULL',
    [(int) $u['sub'], (int) $p['id']]
  );
  if (!$changed) Response::notFound('Comentário não encontrado');
  Response::ok(['id' => (int) $p['id'], 'status' => 'aprovado']);
});

$router->patch('/api/comentarios/:id/rejeitar', function (array $p): void {
  $u = Auth::requirePermissao('comentarios');
  $changed = DB::execute(
    'UPDATE comentarios SET status = "rejeitado", moderado_em = NOW(), moderado_por = ? WHERE id = ? AND removido_em IS NULL',
    [(int) $u['sub'], (int) $p['id']]
  );
  if (!$changed) Response::notFound('Comentário não encontrado');
  Response::ok(['id' => (int) $p['id'], 'status' => 'rejeitado']);
});

$router->delete('/api/comentarios/:id', function (array $p): void {
  Auth::requirePermissao('comentarios');
  $changed = DB::execute('UPDATE comentarios SET removido_em = NOW() WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$changed) Response::notFound('Comentário não encontrado');
  Response::ok(['ok' => true]);
});
