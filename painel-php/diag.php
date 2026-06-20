<?php
// DIAGNÓSTICO TEMPORÁRIO — apagar após uso.
header('Content-Type: text/plain; charset=utf-8');
spl_autoload_register(function (string $class): void {
  $file = __DIR__ . '/lib/' . $class . '.php';
  if (is_file($file)) require $file;
});

echo "==== ENV ====\n";
echo "Arquivo .env existe? " . (is_file(__DIR__ . '/.env') ? '✅ SIM' : '❌ NÃO') . "\n";

try {
  Env::load();
  echo "APP_ENV       = " . (Env::get('APP_ENV', '(não setado)')) . "\n";
  echo "DB_HOST       = " . (Env::get('DB_HOST', '(não setado)')) . "\n";
  echo "DB_NAME       = " . (Env::get('DB_NAME', '(não setado)')) . "\n";
  echo "DB_USER       = " . (Env::get('DB_USER', '(não setado)')) . "\n";
  echo "DB_PASS       = " . (Env::get('DB_PASS') ? '✅ definido (' . strlen(Env::get('DB_PASS')) . ' chars)' : '❌ vazio') . "\n";
  echo "JWT_SECRET    = " . (Env::get('JWT_SECRET') ? '✅ definido (' . strlen(Env::get('JWT_SECRET')) . ' chars)' : '❌ vazio') . "\n";
  echo "ADMIN_EMAIL   = " . (Env::get('ADMIN_EMAIL', '(não setado)')) . "\n";
} catch (Throwable $e) {
  echo "❌ Erro Env::load: " . $e->getMessage() . "\n";
}

echo "\n==== CONEXÃO MySQL ====\n";
try {
  $pdo = DB::pdo();
  echo "✅ Conectou\n\n";

  echo "==== TABELAS EXISTENTES ====\n";
  $tables = [];
  foreach ($pdo->query("SHOW TABLES") as $row) {
    $tables[] = array_values($row)[0];
  }
  if (empty($tables)) {
    echo "❌ Nenhuma tabela! Schema não foi criado (step=2 falhou).\n";
  } else {
    foreach ($tables as $t) {
      $count = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
      echo "  📁 $t ($count linhas)\n";
    }
  }

  echo "\n==== USUARIOS ====\n";
  if (in_array('usuarios', $tables, true)) {
    $users = $pdo->query("SELECT id, nome, email, tipo, status FROM usuarios")->fetchAll(PDO::FETCH_ASSOC);
    if (empty($users)) {
      echo "❌ Nenhum usuário cadastrado (step=3 falhou).\n";
    } else {
      foreach ($users as $u) {
        echo "  👤 {$u['id']} | {$u['nome']} | {$u['email']} | {$u['tipo']} | {$u['status']}\n";
      }
    }
  }

} catch (Throwable $e) {
  echo "❌ ERRO de conexão MySQL:\n";
  echo "    Mensagem: " . $e->getMessage() . "\n";
  echo "    Arquivo:  " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n==== TESTE DE ROTEAMENTO ====\n";
echo "REQUEST_URI   = " . ($_SERVER['REQUEST_URI'] ?? '') . "\n";
echo "SCRIPT_NAME   = " . ($_SERVER['SCRIPT_NAME'] ?? '') . "\n";
echo "Request::path() = " . Request::path() . "\n";
