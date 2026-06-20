<?php
/**
 * Env: lê painel-php/.env e popula $_ENV / getenv().
 * Suporta comentários (#) e valores entre aspas.
 */
class Env {
  private static bool $loaded = false;

  public static function load(string $file = null): void {
    if (self::$loaded) return;
    $file = $file ?: dirname(__DIR__) . '/.env';
    if (!is_readable($file)) {
      self::$loaded = true;
      return;
    }
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
      $line = trim($line);
      if ($line === '' || $line[0] === '#') continue;
      if (!str_contains($line, '=')) continue;
      [$k, $v] = explode('=', $line, 2);
      $k = trim($k);
      $v = trim($v);
      // tira comentários inline e aspas
      $v = preg_replace('/\s+#.*$/', '', $v);
      if ((str_starts_with($v, '"') && str_ends_with($v, '"')) ||
          (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
        $v = substr($v, 1, -1);
      }
      $_ENV[$k] = $v;
      putenv("$k=$v");
    }
    self::$loaded = true;
  }

  public static function get(string $key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
  }

  public static function require(string $key): string {
    $v = self::get($key);
    if ($v === null || $v === false || $v === '') {
      throw new RuntimeException("Variável de ambiente obrigatória ausente: $key");
    }
    return $v;
  }
}
