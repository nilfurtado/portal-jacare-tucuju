<?php
/**
 * Painel DM (PHP) — Front Controller
 * Despacha rotas /api/* para handlers em api/.
 * Rotas que não começam com /api/ servem arquivos estáticos de public/.
 */
declare(strict_types=1);

// Autoload de classes em lib/
spl_autoload_register(function (string $class): void {
  $file = __DIR__ . '/lib/' . $class . '.php';
  if (is_file($file)) require $file;
});

// Headers globais
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS — permite chamadas do próprio domínio + portal (mesma origem é sempre OK)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');

if (Request::method() === 'OPTIONS') { http_response_code(204); exit; }

// .env
Env::load();

// Tratamento global de erros — sempre JSON em /api/*
set_exception_handler(function (Throwable $e): void {
  if (str_starts_with(Request::path(), '/api/')) {
    $isDev = (Env::get('APP_ENV', 'production') === 'development');
    Response::serverError($isDev ? $e->getMessage() : 'Erro interno');
  }
  http_response_code(500);
  echo 'Erro interno';
});

$path = Request::path();
$method = Request::method();

// ----- ROTEAMENTO API -----
if (str_starts_with($path, '/api/')) {
  $router = new Router();

  // Ordem importa: lixeira.php usa helpers definidos nas APIs dos recursos.
  // Carrega "primeiro" os arquivos prefixados com "_" e depois os recursos.
  $apiFiles = glob(__DIR__ . '/api/*.php');
  usort($apiFiles, function ($a, $b) {
    $score = fn(string $f) => str_contains(basename($f), 'lixeira') ? 2 : 1;
    return $score($a) <=> $score($b);
  });
  foreach ($apiFiles as $file) {
    (function () use ($router, $file): void {
      require $file;
    })();
  }

  if (!$router->dispatch($method, $path)) {
    Response::notFound('Endpoint não encontrado');
  }
  exit;
}

// ----- ARQUIVOS ESTÁTICOS DO PAINEL (public/) -----
// Geralmente o Apache .htaccess já serviu o arquivo. Este fallback é só
// para PHP built-in server (php -S) ou ambientes sem rewrite.
$rel = ltrim($path, '/') ?: 'login.html';
$abs = __DIR__ . '/public/' . $rel;
if (is_file($abs)) {
  $mimes = [
    'html' => 'text/html', 'css' => 'text/css', 'js' => 'application/javascript',
    'json' => 'application/json', 'svg' => 'image/svg+xml',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'webp' => 'image/webp', 'ico' => 'image/x-icon',
  ];
  $ext = strtolower(pathinfo($abs, PATHINFO_EXTENSION));
  if (isset($mimes[$ext])) header('Content-Type: ' . $mimes[$ext]);
  readfile($abs);
  exit;
}

// Fallback: login
http_response_code(200);
readfile(__DIR__ . '/public/login.html');
