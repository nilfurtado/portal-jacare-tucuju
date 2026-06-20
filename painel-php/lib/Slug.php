<?php
/** Slug — converte texto para slug seguro. */
class Slug {
  public static function make(string $text): string {
    $text = mb_strtolower(trim($text), 'UTF-8');
    if (function_exists('iconv')) {
      $tr = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
      if ($tr !== false) $text = $tr;
    }
    $text = preg_replace('/[^a-z0-9\s-]/u', '', $text);
    $text = preg_replace('/\s+/', '-', trim($text));
    $text = preg_replace('/-+/', '-', $text);
    return substr($text, 0, 80);
  }

  /** Garante slug único dado uma lista existente. */
  public static function unique(string $base, array $existing): string {
    $slug = self::make($base);
    if (!in_array($slug, $existing, true)) return $slug;
    $i = 2;
    do {
      $candidate = "$slug-$i";
      $i++;
    } while (in_array($candidate, $existing, true));
    return $candidate;
  }
}
