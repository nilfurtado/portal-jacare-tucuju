<?php
/**
 * migrate.php — Migra dados de ../data/*.json para o MySQL.
 * Use uma única vez após o install.php. Pode rodar várias vezes
 * (usa INSERT IGNORE / ON DUPLICATE KEY UPDATE).
 *
 * Acesse via navegador: /painel-php/migrate.php
 */
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
  $file = __DIR__ . '/lib/' . $class . '.php';
  if (is_file($file)) require $file;
});

if (is_file(__DIR__ . '/migrate.locked')) {
  exit('Migrador já foi executado. Remova migrate.locked para reexecutar.');
}

Env::load();
$dataDir = realpath(__DIR__ . '/../data') ?: dirname(__DIR__) . '/data';
$log = [];

function readJson(string $file): mixed {
  if (!is_file($file)) return null;
  $r = json_decode(file_get_contents($file), true);
  return $r;
}

function logMsg(array &$log, string $msg, int $count = 0): void {
  $log[] = $count > 0 ? "✓ $msg ($count)" : "• $msg";
}

try {
  $pdo = DB::pdo();
  $pdo->beginTransaction();

  // ---------- categorias.json (objeto wrapper) ----------
  $cats = readJson("$dataDir/categorias.json");
  if (is_array($cats) && isset($cats['categorias'])) {
    foreach ($cats['categorias'] as $c) {
      DB::execute(
        'INSERT INTO categorias (slug, label, cor, ordem) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE label=VALUES(label), cor=VALUES(cor)',
        [$c['slug'], $c['label'], $c['cor'] ?? '#999', $c['ordem'] ?? 0]
      );
    }
    logMsg($log, 'categorias', count($cats['categorias']));
    if (isset($cats['municipios'])) {
      foreach ($cats['municipios'] as $m) {
        DB::execute(
          'INSERT INTO municipios (slug, label, populacao, descricao, imagem) VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE label=VALUES(label), populacao=VALUES(populacao), descricao=VALUES(descricao), imagem=VALUES(imagem)',
          [$m['slug'], $m['label'], (int)($m['populacao'] ?? 0), $m['descricao'] ?? '', $m['imagem'] ?? '']
        );
      }
      logMsg($log, 'municipios', count($cats['municipios']));
    }
  }

  // ---------- noticias.json ----------
  $not = readJson("$dataDir/noticias.json") ?? [];
  foreach ($not as $n) {
    DB::execute(
      'INSERT INTO noticias
        (id, slug, titulo, lide, conteudo, imagem, categoria, municipio, autor, autor_avatar,
         data, tags, destaque, views, tempo_leitura)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), lide=VALUES(lide), conteudo=VALUES(conteudo),
         imagem=VALUES(imagem), categoria=VALUES(categoria), municipio=VALUES(municipio),
         autor=VALUES(autor), data=VALUES(data), tags=VALUES(tags), destaque=VALUES(destaque),
         views=VALUES(views), tempo_leitura=VALUES(tempo_leitura)',
      [
        (int) $n['id'], $n['slug'], $n['titulo'], $n['lide'] ?? '', $n['conteudo'] ?? '',
        $n['imagem'] ?? '', $n['categoria'] ?? '', $n['municipio'] ?? '',
        $n['autor'] ?? '', $n['autorAvatar'] ?? '',
        $n['data'] ?? date('Y-m-d H:i:s'),
        json_encode($n['tags'] ?? [], JSON_UNESCAPED_UNICODE),
        !empty($n['destaque']) ? 1 : 0,
        (int) ($n['views'] ?? 0),
        (int) ($n['tempoLeitura'] ?? 1),
      ]
    );
  }
  logMsg($log, 'noticias', count($not));

  // ---------- anuncios.json ----------
  $ads = readJson("$dataDir/anuncios.json") ?? [];
  foreach ($ads as $a) {
    DB::execute(
      'INSERT INTO anuncios
        (id, nome, tipo, tamanho, posicao, paginas, ativo,
         criativo_imagem, criativo_html, criativo_titulo, destino,
         periodo_inicio, periodo_fim, impressoes, cliques)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE nome=VALUES(nome), tipo=VALUES(tipo), tamanho=VALUES(tamanho),
         posicao=VALUES(posicao), paginas=VALUES(paginas), ativo=VALUES(ativo),
         criativo_imagem=VALUES(criativo_imagem), criativo_html=VALUES(criativo_html),
         criativo_titulo=VALUES(criativo_titulo), destino=VALUES(destino),
         periodo_inicio=VALUES(periodo_inicio), periodo_fim=VALUES(periodo_fim)',
      [
        (int) $a['id'], $a['nome'], $a['tipo'], $a['tamanho'], $a['posicao'] ?? '',
        json_encode($a['paginas'] ?? []), !empty($a['ativo']) ? 1 : 0,
        $a['criativo']['imagem'] ?? '', $a['criativo']['html'] ?? '', $a['criativo']['titulo'] ?? '',
        $a['destino'] ?? '',
        $a['periodo']['inicio'] ?? null, $a['periodo']['fim'] ?? null,
        (int) ($a['impressoes'] ?? 0), (int) ($a['cliques'] ?? 0),
      ]
    );
  }
  logMsg($log, 'anuncios', count($ads));

  // ---------- videos.json ----------
  $vids = readJson("$dataDir/videos.json") ?? [];
  foreach ($vids as $v) {
    DB::execute(
      'INSERT INTO videos (id, titulo, thumb, duracao, youtube_id, categoria) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), thumb=VALUES(thumb),
         duracao=VALUES(duracao), youtube_id=VALUES(youtube_id), categoria=VALUES(categoria)',
      [(int) $v['id'], $v['titulo'], $v['thumb'] ?? '', $v['duracao'] ?? '',
       $v['youtubeId'] ?? '', $v['categoria'] ?? '']
    );
  }
  logMsg($log, 'videos', count($vids));

  // ---------- enquetes.json ----------
  $enq = readJson("$dataDir/enquetes.json") ?? [];
  foreach ($enq as $e) {
    DB::execute(
      'INSERT INTO enquetes (id, pergunta, opcoes, ativa) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE pergunta=VALUES(pergunta), opcoes=VALUES(opcoes), ativa=VALUES(ativa)',
      [$e['id'], $e['pergunta'], json_encode($e['opcoes'] ?? [], JSON_UNESCAPED_UNICODE), !empty($e['ativa']) ? 1 : 0]
    );
  }
  logMsg($log, 'enquetes', count($enq));

  // ---------- classificados.json ----------
  $clas = readJson("$dataDir/classificados.json") ?? [];
  foreach ($clas as $c) {
    DB::execute(
      'INSERT INTO classificados (id, titulo, preco, imagem, cidade, categoria, telefone) VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), preco=VALUES(preco), imagem=VALUES(imagem),
         cidade=VALUES(cidade), categoria=VALUES(categoria), telefone=VALUES(telefone)',
      [(int) $c['id'], $c['titulo'], (float) ($c['preco'] ?? 0),
       $c['imagem'] ?? '', $c['cidade'] ?? '', $c['categoria'] ?? '', $c['telefone'] ?? '']
    );
  }
  logMsg($log, 'classificados', count($clas));

  // ---------- classificados-categorias.json ----------
  $clCat = readJson("$dataDir/classificados-categorias.json") ?? [];
  foreach ($clCat as $c) {
    DB::execute(
      'INSERT INTO classificados_categorias (slug, label, cor, icon) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE label=VALUES(label), cor=VALUES(cor), icon=VALUES(icon)',
      [$c['slug'], $c['label'], $c['cor'] ?? '#999', $c['icon'] ?? '']
    );
  }
  logMsg($log, 'classificados-categorias', count($clCat));

  // ---------- colunas.json ----------
  $col = readJson("$dataDir/colunas.json") ?? [];
  foreach ($col as $c) {
    DB::execute(
      'INSERT INTO colunas (id, colunista, avatar, titulo, slug, data) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE colunista=VALUES(colunista), avatar=VALUES(avatar),
         titulo=VALUES(titulo), data=VALUES(data)',
      [(int) $c['id'], $c['colunista'], $c['avatar'] ?? '',
       $c['titulo'], $c['slug'], $c['data'] ?? date('Y-m-d H:i:s')]
    );
  }
  logMsg($log, 'colunas', count($col));

  // ---------- config.json ----------
  $cfg = readJson("$dataDir/config.json");
  if (is_array($cfg)) {
    foreach (['portal','redes','whatsapp'] as $k) {
      if (isset($cfg[$k])) {
        DB::execute(
          'INSERT INTO config (chave, valor) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE valor=VALUES(valor), atualizado_em=NOW()',
          [$k, json_encode($cfg[$k], JSON_UNESCAPED_UNICODE)]
        );
      }
    }
    logMsg($log, 'config (portal/redes/whatsapp)');
  }

  // ---------- plugins.json ----------
  $pl = readJson("$dataDir/plugins.json") ?? [];
  foreach ($pl as $p) {
    DB::execute(
      'INSERT INTO plugins (id, nome, descricao, categoria, tipo, instalado, versao, ultima_versao, icone, cor)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE nome=VALUES(nome), descricao=VALUES(descricao),
         categoria=VALUES(categoria), tipo=VALUES(tipo), instalado=VALUES(instalado),
         versao=VALUES(versao), ultima_versao=VALUES(ultima_versao),
         icone=VALUES(icone), cor=VALUES(cor)',
      [$p['id'], $p['nome'], $p['descricao'] ?? '',
       $p['categoria'] ?? '', $p['tipo'] ?? 'gratis', !empty($p['instalado']) ? 1 : 0,
       $p['versao'] ?? '1.0.0', $p['ultimaVersao'] ?? '1.0.0',
       $p['icone'] ?? '', $p['cor'] ?? '']
    );
  }
  logMsg($log, 'plugins', count($pl));

  // ---------- tema-layout.json ----------
  $tl = readJson("$dataDir/tema-layout.json");
  if (is_array($tl)) {
    if (isset($tl['tema'])) {
      DB::execute(
        'INSERT INTO config (chave, valor) VALUES ("tema", ?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor), atualizado_em=NOW()',
        [json_encode($tl['tema'], JSON_UNESCAPED_UNICODE)]
      );
    }
    if (isset($tl['layout'])) {
      DB::execute(
        'INSERT INTO config (chave, valor) VALUES ("layout", ?)
         ON DUPLICATE KEY UPDATE valor=VALUES(valor), atualizado_em=NOW()',
        [json_encode($tl['layout'], JSON_UNESCAPED_UNICODE)]
      );
    }
    logMsg($log, 'tema-layout');
  }

  $pdo->commit();
  file_put_contents(__DIR__ . '/migrate.locked', 'Migrado em ' . date('Y-m-d H:i:s'));
} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  $error = $e->getMessage();
}

?><!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Migração JSON → MySQL</title>
<style>
  body { font: 14px/1.6 system-ui, sans-serif; background: #fafaf7; color: #14110d; padding: 40px 20px; }
  .box { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #ece8de; border-radius: 12px; padding: 40px; }
  h1 { font-family: Georgia, serif; font-weight: 500; font-size: 1.8rem; margin-bottom: 4px; }
  h1 em { font-style: italic; color: #c9551d; }
  .sub { font-family: ui-monospace, monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: #6e6760; margin-bottom: 28px; }
  ul { list-style: none; padding: 0; font-family: ui-monospace, monospace; font-size: 0.86rem; }
  li { padding: 4px 0; border-bottom: 1px dotted #eee; }
  .err { background: #fee; color: #800; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #800; }
  a { color: #c9551d; }
</style>
</head>
<body>
  <div class="box">
    <h1>A <em>migração</em>.</h1>
    <p class="sub">JSON → MySQL · finalizada</p>
    <?php if (!empty($error)): ?>
      <div class="err"><b>Erro:</b> <?= htmlspecialchars($error) ?></div>
    <?php else: ?>
      <ul>
        <?php foreach ($log as $l): ?><li><?= htmlspecialchars($l) ?></li><?php endforeach; ?>
      </ul>
      <p>Próximo passo: acesse <a href="login.html">o painel</a> e confirme que os dados estão lá.</p>
      <p style="color:#666;font-size:0.82rem">Crie <code>migrate.locked</code> para impedir reexecução (já fizemos automaticamente).</p>
    <?php endif; ?>
  </div>
</body>
</html>
