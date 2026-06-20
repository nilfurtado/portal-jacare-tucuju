<?php
/**
 * api/auth.php — Login, /me, logout
 * Recebe $router do front-controller.
 */

/** @var Router $router */

$router->post('/api/auth/login', function (): void {
  $body = Request::body();
  $email = trim($body['email'] ?? '');
  $senha = (string)($body['senha'] ?? '');
  if ($email === '' || $senha === '') {
    Response::badRequest('Informe e-mail e senha');
  }

  $user = DB::fetch(
    "SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [$email]
  );
  if (!$user || $user['status'] === 'N') {
    Response::unauthorized('Credenciais inválidas');
  }
  if (!password_verify($senha, $user['senha'])) {
    Response::unauthorized('Credenciais inválidas');
  }

  $permissoes = is_string($user['permissoes'])
    ? (json_decode($user['permissoes'], true) ?: [])
    : ($user['permissoes'] ?? []);

  $payload = [
    'sub'        => (int) $user['id'],
    'nome'       => $user['nome'],
    'email'      => $user['email'],
    'tipo'       => $user['tipo'],
    'permissoes' => $permissoes,
  ];
  $token = JWT::encode($payload);

  Response::json([
    'token'   => $token,
    'usuario' => [
      'id'    => (int) $user['id'],
      'nome'  => $user['nome'],
      'email' => $user['email'],
      'tipo'  => $user['tipo'],
      'foto'  => $user['foto'],
    ],
  ]);
});

$router->get('/api/auth/me', function (): void {
  $u = Auth::required();
  $user = DB::fetch('SELECT id, nome, email, tipo, foto, permissoes FROM usuarios WHERE id = ?', [$u['sub']]);
  if (!$user) Response::notFound('Usuário não encontrado');
  $user['id'] = (int) $user['id'];
  $user['permissoes'] = is_string($user['permissoes'])
    ? (json_decode($user['permissoes'], true) ?: [])
    : ($user['permissoes'] ?? []);
  Response::ok($user);
});

$router->post('/api/auth/logout', function (): void {
  Auth::required();
  // Stateless: cliente apenas descarta o token.
  Response::ok(['ok' => true]);
});
