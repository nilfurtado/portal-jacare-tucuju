<?php
/** api/acessos.php — analytics agregados */
/** @var Router $router */

$router->get('/api/acessos', function (): void {
  Auth::required();

  $totalViews    = (int) DB::fetchColumn('SELECT COALESCE(SUM(views), 0) FROM noticias WHERE removido_em IS NULL');
  $totalNoticias = (int) DB::fetchColumn('SELECT COUNT(*)                FROM noticias WHERE removido_em IS NULL');

  // Série de 30 dias retroativos
  $dias = [];
  for ($i = 29; $i >= 0; $i--) {
    $dia = date('Y-m-d', strtotime("-$i days"));
    $v = (int) DB::fetchColumn(
      'SELECT COALESCE(SUM(views), 0) FROM noticias
       WHERE DATE(data) = ? AND removido_em IS NULL',
      [$dia]
    );
    $dias[] = ['data' => $dia, 'views' => $v];
  }

  $topNoticias = array_map(function ($n) {
    return [
      'id'        => (int) $n['id'],
      'titulo'    => $n['titulo'],
      'categoria' => $n['categoria'],
      'views'     => (int) $n['views'],
      'slug'      => $n['slug'],
    ];
  }, DB::fetchAll(
    'SELECT id, titulo, categoria, views, slug FROM noticias
     WHERE removido_em IS NULL ORDER BY views DESC LIMIT 10'
  ));

  $editorias = array_map(function ($e) {
    return ['categoria' => $e['categoria'] ?: 'outras', 'views' => (int) $e['views']];
  }, DB::fetchAll(
    'SELECT categoria, COALESCE(SUM(views), 0) AS views FROM noticias
     WHERE removido_em IS NULL GROUP BY categoria ORDER BY views DESC'
  ));

  $adImp = (int) DB::fetchColumn('SELECT COALESCE(SUM(impressoes), 0) FROM anuncios WHERE removido_em IS NULL');
  $adCli = (int) DB::fetchColumn('SELECT COALESCE(SUM(cliques),    0) FROM anuncios WHERE removido_em IS NULL');
  $adAtv = (int) DB::fetchColumn('SELECT COUNT(*) FROM anuncios WHERE removido_em IS NULL AND ativo = 1');
  $adTot = (int) DB::fetchColumn('SELECT COUNT(*) FROM anuncios WHERE removido_em IS NULL');

  Response::ok([
    'totalViews'     => $totalViews,
    'totalNoticias'  => $totalNoticias,
    'dias'           => $dias,
    'topNoticias'    => $topNoticias,
    'editorias'      => $editorias,
    'publicidade'    => [
      'slotsAtivos' => $adAtv,
      'totalSlots'  => $adTot,
      'impressoes'  => $adImp,
      'cliques'     => $adCli,
      'ctr'         => $adImp > 0 ? round(($adCli / $adImp) * 100, 2) : 0,
    ],
  ]);
});
