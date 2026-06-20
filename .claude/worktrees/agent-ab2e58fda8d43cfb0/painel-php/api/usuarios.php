<?php
/** api/usuarios.php */
/** @var Router $router */

function usuario_serialize(array $r): array {
  unset($r['senha']);
  $r['id']         = (int) $r['id'];
  $r['permissoes'] = is_string($r['permissoes'])
    ? (json_decode($r['permissoes'], true) ?: [])
    : ($r['permissoes'] ?? []);
  return $r;
}

$router->get('/api/usuarios', function (): void {
  Auth::requirePermissao('usuarios');
  $rows = DB::fetchAll('SELECT * FROM usuarios ORDER BY id');
  Response::ok(array_map('usuario_serialize', $rows));
});

$router->get('/api/usuarios/:id', function (array $p): void {
  Auth::requirePermissao('usuarios');
  $row = DB::fetch('SELECT * FROM usuarios WHERE id = ?', [(int) $p['id']]);
  if (!$row) Response::notFound('Usuário não encontrado');
  Response::ok(usuario_serialize($row));
});

$router->post('/api/usuarios', function (): void {
  $cur = Auth::requirePermissao('usuarios');
  $b = Request::body();
  if (empty($b['nome']) || empty($b['email']) || empty($b['senha'])) {
    Response::badRequest('Informe nome, e-mail e senha');
  }
  if (strlen($b['senha']) < 8) Response::badRequest('Senha mínima de 8 caracteres');
  if (DB::fetchColumn('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER(?)', [$b['email']])) {
    Response::conflict('E-mail já cadastrado');
  }
  $perm = $b['permissoes'] ?? ['paginas' => [], 'categorias' => [], 'municipios' => [],
                                'colunas' => [], 'anuncios' => [], 'destinos' => [],
                                'veiculacaoAds' => false];
  $id = DB::insert(
    'INSERT INTO usuarios (nome, email, senha, tipo, status, foto, telefone, cidade, estado, sobre, permissoes, criado_por)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      $b['nome'], $b['email'], password_hash($b['senha'], PASSWORD_BCRYPT),
      ($b['tipo'] ?? '') === 'colaborador' ? 'colaborador' : 'admin',
      ($b['status'] ?? 'S') === 'N' ? 'N' : 'S',
      $b['foto']     ?? null,
      $b['telefone'] ?? '',
      $b['cidade']   ?? '',
      $b['estado']   ?? '',
      $b['sobre']    ?? '',
      json_encode($perm, JSON_UNESCAPED_UNICODE),
      (int) $cur['sub'],
    ]
  );
  Response::created(usuario_serialize(DB::fetch('SELECT * FROM usuarios WHERE id = ?', [$id])));
});

$router->put('/api/usuarios/:id', function (array $p): void {
  $cur = Auth::requirePermissao('usuarios');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM usuarios WHERE id = ?', [$id]);
  if (!$prev) Response::notFound('Usuário não encontrado');

  $senha = $prev['senha'];
  if (!empty($b['senha']) && strlen($b['senha']) >= 8) {
    $senha = password_hash($b['senha'], PASSWORD_BCRYPT);
  }
  $perm = isset($b['permissoes']) ? json_encode($b['permissoes'], JSON_UNESCAPED_UNICODE) : $prev['permissoes'];

  DB::execute(
    'UPDATE usuarios SET nome=?, email=?, senha=?, tipo=?, status=?, foto=?, telefone=?, cidade=?, estado=?, sobre=?, permissoes=?, atualizado_em=NOW() WHERE id=?',
    [
      $b['nome']     ?? $prev['nome'],
      $b['email']    ?? $prev['email'],
      $senha,
      $b['tipo']     ?? $prev['tipo'],
      $b['status']   ?? $prev['status'],
      $b['foto']     ?? $prev['foto'],
      $b['telefone'] ?? $prev['telefone'],
      $b['cidade']   ?? $prev['cidade'],
      $b['estado']   ?? $prev['estado'],
      $b['sobre']    ?? $prev['sobre'],
      $perm,
      $id,
    ]
  );
  Response::ok(usuario_serialize(DB::fetch('SELECT * FROM usuarios WHERE id = ?', [$id])));
});

$router->patch('/api/usuarios/:id/status', function (array $p): void {
  Auth::requirePermissao('usuarios');
  $id = (int) $p['id'];
  $cur = DB::fetchColumn('SELECT status FROM usuarios WHERE id = ?', [$id]);
  if ($cur === null) Response::notFound('Usuário não encontrado');
  $novo = $cur === 'S' ? 'N' : 'S';
  DB::execute('UPDATE usuarios SET status = ? WHERE id = ?', [$novo, $id]);
  Response::ok(['id' => $id, 'status' => $novo]);
});

$router->delete('/api/usuarios/:id', function (array $p): void {
  $cur = Auth::requirePermissao('usuarios');
  $id = (int) $p['id'];
  if ($id === (int) $cur['sub']) {
    Response::badRequest('Você não pode remover a si mesmo');
  }
  $changed = DB::execute('DELETE FROM usuarios WHERE id = ?', [$id]);
  if (!$changed) Response::notFound('Usuário não encontrado');
  Response::ok(['ok' => true]);
});
