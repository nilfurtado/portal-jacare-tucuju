<?php
/**
 * JWT — implementação nativa de JSON Web Token HS256
 * Sem dependências externas. Constante-time string comparison.
 */
class JWT {
  public static function encode(array $payload, ?string $secret = null, ?int $expiresIn = null): string {
    Env::load();
    $secret = $secret ?: Env::require('JWT_SECRET');
    $hours  = $expiresIn ?? (int) Env::get('JWT_EXPIRES_HOURS', 8);
    $now = time();
    $payload = array_merge([
      'iat' => $now,
      'exp' => $now + ($hours * 3600),
    ], $payload);

    $header  = self::b64url(json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_UNESCAPED_UNICODE));
    $body    = self::b64url(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig     = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));
    return "$header.$body.$sig";
  }

  /** @throws RuntimeException em token inválido ou expirado */
  public static function decode(string $token, ?string $secret = null): array {
    Env::load();
    $secret = $secret ?: Env::require('JWT_SECRET');
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
      throw new RuntimeException('Token mal formado');
    }
    [$header, $body, $sig] = $parts;
    $expected = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));
    if (!hash_equals($expected, $sig)) {
      throw new RuntimeException('Assinatura inválida');
    }
    $payload = json_decode(self::b64urlDecode($body), true);
    if (!is_array($payload)) {
      throw new RuntimeException('Payload inválido');
    }
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
      throw new RuntimeException('Token expirado');
    }
    return $payload;
  }

  private static function b64url(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
  }

  private static function b64urlDecode(string $str): string {
    $pad = strlen($str) % 4;
    if ($pad) $str .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($str, '-_', '+/'));
  }
}
