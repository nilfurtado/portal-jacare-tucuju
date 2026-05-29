<?php
/** Request — wrapper minimal sobre PHP superglobals + corpo JSON. */
class Request {
  private static ?array $jsonBody = null;

  public static function method(): string {
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
  }

  public static function path(): string {
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $q = strpos($uri, '?');
    if ($q !== false) $uri = substr($uri, 0, $q);
    return rtrim($uri, '/') ?: '/';
  }

  public static function body(): array {
    if (self::$jsonBody !== null) return self::$jsonBody;
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return self::$jsonBody = [];
    $decoded = json_decode($raw, true);
    return self::$jsonBody = is_array($decoded) ? $decoded : [];
  }

  public static function query(string $key, $default = null) {
    return $_GET[$key] ?? $default;
  }

  public static function header(string $name): ?string {
    $name = strtoupper(str_replace('-', '_', $name));
    $key = "HTTP_$name";
    return $_SERVER[$key] ?? null;
  }

  public static function bearerToken(): ?string {
    $auth = self::header('Authorization') ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
      return $m[1];
    }
    return null;
  }

  public static function ip(): string {
    return $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';
  }
}
