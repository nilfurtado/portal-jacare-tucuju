<?php
/**
 * install.php — instalador web do Painel DM (PHP + MySQL)
 * Acesse uma única vez via navegador. Após instalar, RENOMEIE este arquivo
 * para install.locked.php (ou exclua) para impedir reexecução.
 */
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
  $file = __DIR__ . '/lib/' . $class . '.php';
  if (is_file($file)) require $file;
});

$step = $_GET['step'] ?? '1';
$message = '';
$error = '';

// Bloqueia se já estiver lockado
if (is_file(__DIR__ . '/install.locked')) {
  $error = 'O instalador já foi executado neste servidor. Remova install.locked para reinstalar.';
  $step = 'locked';
}

try {
  // ---------- STEP 2: testa conexão e cria schema ----------
  if ($step === '2' && empty($error)) {
    if (!is_file(__DIR__ . '/.env')) {
      throw new RuntimeException('Arquivo .env não encontrado. Crie a partir de .env.example.');
    }
    Env::load();
    $sql = file_get_contents(__DIR__ . '/install.sql');
    if (!$sql) throw new RuntimeException('install.sql não pôde ser lido');

    $pdo = DB::pdo();
    // Remove comentários de linha e divide por ';' no fim da linha
    $sql = preg_replace('/^--.*$/m', '', $sql);
    $statements = array_filter(
      array_map('trim', preg_split('/;\s*$/m', $sql)),
      fn($s) => $s !== ''
    );
    foreach ($statements as $stmt) {
      $pdo->exec($stmt);
    }
    $message = 'Schema MySQL criado com sucesso. Vá para o passo 3.';
  }

  // ---------- STEP 3: cria usuário admin ----------
  if ($step === '3' && empty($error)) {
    Env::load();
    $nome  = Env::get('ADMIN_NOME',  'Administrador');
    $email = Env::get('ADMIN_EMAIL', 'admin@portaljt.com.br');
    $senha = Env::get('ADMIN_SENHA', 'Admin@2026');

    $existe = DB::fetch('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [$email]);
    if ($existe) {
      $message = "Admin já existe ($email). Pulando criação.";
    } else {
      $hash = password_hash($senha, PASSWORD_BCRYPT);
      $perm = json_encode([
        'paginas' => [], 'categorias' => [], 'municipios' => [],
        'colunas' => [], 'anuncios' => [], 'destinos' => [], 'veiculacaoAds' => true,
      ]);
      DB::insert(
        'INSERT INTO usuarios (nome, email, senha, tipo, status, permissoes)
         VALUES (?, ?, ?, "admin", "S", ?)',
        [$nome, $email, $hash, $perm]
      );
      $message = "Admin criado.<br>E-mail: <b>$email</b><br>Senha: <b>$senha</b>";
    }
  }

  // ---------- STEP 4: lockfile ----------
  if ($step === '4' && empty($error)) {
    file_put_contents(__DIR__ . '/install.locked', 'Instalado em ' . date('Y-m-d H:i:s'));
    $message = 'Instalação concluída. Bom trabalho!';
  }

} catch (Throwable $e) {
  $error = $e->getMessage();
}

?><!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Instalador — Painel DM</title>
<style>
  body { font: 15px/1.6 system-ui, sans-serif; background: #fafaf7; color: #14110d; padding: 40px 20px; }
  .box { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #ece8de; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 2rem; letter-spacing: -0.02em; margin-bottom: 4px; }
  h1 em { font-style: italic; color: #c9551d; }
  .sub { font-family: ui-monospace, monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: #6e6760; margin-bottom: 32px; }
  ol { padding-left: 1.4em; line-height: 2; }
  ol li code { background: #f7f4ed; padding: 2px 6px; border-radius: 3px; font-size: 0.86rem; }
  .btn { display: inline-block; padding: 10px 22px; background: #14110d; color: #fafaf7; text-decoration: none; border-radius: 999px; font-size: 0.86rem; margin-top: 24px; }
  .btn:hover { background: #c9551d; }
  .msg { padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 0.92rem; }
  .ok  { background: rgba(62,107,58,0.08); color: #3e6b3a; border-left: 3px solid #3e6b3a; }
  .err { background: rgba(138,42,42,0.08); color: #8a2a2a; border-left: 3px solid #8a2a2a; }
  hr   { border: none; border-top: 1px solid #ece8de; margin: 28px 0; }
  .crumbs { font-family: ui-monospace, monospace; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6e6760; }
  .crumbs span.cur { color: #c9551d; }
</style>
</head>
<body>
  <div class="box">
    <h1>O <em>instalador</em>.</h1>
    <p class="sub">Painel DM · MySQL setup</p>

    <p class="crumbs">
      <span class="<?= $step==='1'?'cur':'' ?>">01 · pré-requisitos</span> ›
      <span class="<?= $step==='2'?'cur':'' ?>">02 · schema</span> ›
      <span class="<?= $step==='3'?'cur':'' ?>">03 · admin</span> ›
      <span class="<?= $step==='4'?'cur':'' ?>">04 · finalizar</span>
    </p>

    <?php if ($message): ?><div class="msg ok"><?= $message ?></div><?php endif; ?>
    <?php if ($error):   ?><div class="msg err"><b>Erro:</b> <?= htmlspecialchars($error) ?></div><?php endif; ?>

    <?php if ($step === '1'): ?>
      <h3 style="margin-top:24px">Antes de continuar:</h3>
      <ol>
        <li>Crie um banco MySQL no painel da hospedagem (hPanel)</li>
        <li>Anote o nome do banco, usuário e senha</li>
        <li>Copie <code>.env.example</code> para <code>.env</code> e preencha as credenciais MySQL</li>
        <li>Defina também <code>JWT_SECRET</code> com pelo menos 32 caracteres aleatórios</li>
        <li>Garanta que a pasta <code>storage/uploads</code> tem permissão de escrita (755)</li>
      </ol>
      <a class="btn" href="?step=2">Já fiz tudo → Criar tabelas</a>

    <?php elseif ($step === '2' && empty($error)): ?>
      <a class="btn" href="?step=3">Criar usuário admin →</a>

    <?php elseif ($step === '3' && empty($error)): ?>
      <a class="btn" href="?step=4">Finalizar instalação →</a>

    <?php elseif ($step === '4' && empty($error)): ?>
      <hr>
      <p><b>Próximos passos manuais:</b></p>
      <ol>
        <li>Renomeie ou apague <code>install.php</code> (já criamos <code>install.locked</code> mas o arquivo PHP ainda existe)</li>
        <li>Acesse <a href="login.html">login.html</a> e entre com as credenciais do admin</li>
      </ol>

    <?php elseif ($step === 'locked'): ?>
      <p>Para reinstalar, remova o arquivo <code>install.locked</code> do servidor.</p>

    <?php else: ?>
      <hr>
      <a class="btn" href="?step=1">Reiniciar do passo 1</a>
    <?php endif; ?>
  </div>
</body>
</html>
