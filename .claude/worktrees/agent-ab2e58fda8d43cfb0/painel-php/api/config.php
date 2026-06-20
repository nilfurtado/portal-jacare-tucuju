<?php
/** api/config.php — GET/PUT de configuração key-value */
/** @var Router $router */

function config_obter(): array {
  $rows = DB::fetchAll('SELECT chave, valor FROM config');
  $out = [];
  foreach ($rows as $r) {
    $out[$r['chave']] = is_string($r['valor']) ? (json_decode($r['valor'], true) ?: []) : ($r['valor'] ?? []);
  }
  // Garante chaves esperadas
  $out['portal']   ??= ['nome' => '', 'slogan' => '', 'url' => ''];
  $out['redes']    ??= ['facebook' => '', 'instagram' => '', 'youtube' => '', 'twitter' => ''];
  $out['whatsapp'] ??= ['grupo' => '', 'numero' => ''];
  return $out;
}

function config_salvar_chave(string $chave, array $valor): void {
  DB::execute(
    'INSERT INTO config (chave, valor) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor), atualizado_em = NOW()',
    [$chave, json_encode($valor, JSON_UNESCAPED_UNICODE)]
  );
}

function config_merge_deep(array $a, array $b): array {
  foreach ($b as $k => $v) {
    if (is_array($v) && isset($a[$k]) && is_array($a[$k])) {
      $a[$k] = config_merge_deep($a[$k], $v);
    } else {
      $a[$k] = $v;
    }
  }
  return $a;
}

$router->get('/api/config', function (): void {
  Auth::required();
  $cfg = config_obter();
  // Retorna só os campos que /configuracoes.html espera
  Response::ok([
    'portal'   => $cfg['portal'],
    'redes'    => $cfg['redes'],
    'whatsapp' => $cfg['whatsapp'],
  ]);
});

$router->put('/api/config', function (): void {
  Auth::requirePermissao('configuracoes');
  $b = Request::body();
  $atual = config_obter();
  foreach (['portal', 'redes', 'whatsapp'] as $chave) {
    if (isset($b[$chave]) && is_array($b[$chave])) {
      $atual[$chave] = config_merge_deep($atual[$chave] ?? [], $b[$chave]);
      config_salvar_chave($chave, $atual[$chave]);
    }
  }
  Response::ok([
    'portal'   => $atual['portal'],
    'redes'    => $atual['redes'],
    'whatsapp' => $atual['whatsapp'],
  ]);
});

// PUBLIC para o portal estático ler nome/redes etc.
$router->get('/api/config/public', function (): void {
  $cfg = config_obter();
  Response::ok([
    'portal'   => $cfg['portal'],
    'redes'    => $cfg['redes'],
    'whatsapp' => $cfg['whatsapp'],
  ]);
});
