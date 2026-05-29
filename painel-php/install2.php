<?php
// Installer detalhado — mostra erro statement por statement
header('Content-Type: text/plain; charset=utf-8');

spl_autoload_register(function (string $class): void {
  $file = __DIR__ . '/lib/' . $class . '.php';
  if (is_file($file)) require $file;
});

Env::load();
$pdo = DB::pdo();

echo "==== MySQL info ====\n";
echo "Versão MySQL: " . $pdo->query("SELECT VERSION()")->fetchColumn() . "\n";
echo "\n==== Apagando todas as tabelas existentes (pra começar limpo) ====\n";
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
foreach ($pdo->query("SHOW TABLES") as $row) {
  $t = array_values($row)[0];
  $pdo->exec("DROP TABLE IF EXISTS `$t`");
  echo "  🗑️  $t\n";
}
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n==== Rodando install.sql statement por statement ====\n";
$sql = file_get_contents(__DIR__ . '/install.sql');
$statements = array_filter(array_map('trim', preg_split('/;\s*[\r\n]/', $sql)));

$ok = 0; $fail = 0;
foreach ($statements as $i => $stmt) {
  if ($stmt === '' || str_starts_with($stmt, '--')) continue;
  $preview = preg_replace('/\s+/', ' ', substr($stmt, 0, 80));
  try {
    $pdo->exec($stmt);
    echo "  ✅ #$i: $preview...\n";
    $ok++;
  } catch (Throwable $e) {
    echo "  ❌ #$i: $preview...\n";
    echo "      ERRO: " . $e->getMessage() . "\n";
    $fail++;
  }
}

echo "\n==== Resumo ====\n";
echo "✅ $ok statements OK\n";
echo "❌ $fail statements falharam\n";

echo "\n==== Tabelas criadas ====\n";
foreach ($pdo->query("SHOW TABLES") as $row) {
  $t = array_values($row)[0];
  $c = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
  echo "  📁 $t ($c linhas)\n";
}

echo "\n==== Criando admin ====\n";
$nome  = Env::get('ADMIN_NOME',  'Administrador');
$email = Env::get('ADMIN_EMAIL', 'admin@portaljt.com.br');
$senha = Env::get('ADMIN_SENHA', 'Admin@2026');
$hash  = password_hash($senha, PASSWORD_BCRYPT);
$perm  = json_encode([
  'paginas' => [], 'categorias' => [], 'municipios' => [],
  'colunas' => [], 'anuncios' => [], 'destinos' => [], 'veiculacaoAds' => true,
]);

try {
  $st = $pdo->prepare(
    'INSERT INTO usuarios (nome, email, senha, tipo, status, permissoes)
     VALUES (?, ?, ?, "admin", "S", ?)
     ON DUPLICATE KEY UPDATE senha = VALUES(senha)'
  );
  $st->execute([$nome, $email, $hash, $perm]);
  echo "  ✅ Admin criado: $email / $senha\n";
} catch (Throwable $e) {
  echo "  ❌ Erro: " . $e->getMessage() . "\n";
}

echo "\n==== Finalizado ====\n";
echo "Acesse: https://jacaretucuju.com/painel-php/login.html\n";
echo "Email:  $email\n";
echo "Senha:  $senha\n";
