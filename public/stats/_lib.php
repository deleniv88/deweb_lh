<?php
/* Спільне для /stats: вхід за паролем і шляхи до даних.
   Пароль задається секретом STATS_PASSWORD; workflow Stats кладе його HMAC у data/config.php. */
declare(strict_types=1);

const DW_COOKIE = 'dw_stats';
const DW_TTL = 60 * 86400; // вхід тримається 60 днів

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

function dw_data(string $f = ''): string { return __DIR__ . '/data' . ($f !== '' ? "/$f" : ''); }

function dw_cfg(): ?array {
  static $c = false;
  if ($c === false) { $f = dw_data('config.php'); $c = is_file($f) ? (include $f) : null; if (!is_array($c) || empty($c['pw']) || empty($c['key'])) $c = null; }
  return $c;
}

function dw_sign(int $exp): string { return hash_hmac('sha256', "auth|$exp", dw_cfg()['key']); }

function dw_authed(): bool {
  if (!dw_cfg()) return false;
  [$exp, $sig] = array_pad(explode('.', (string)($_COOKIE[DW_COOKIE] ?? ''), 2), 2, '');
  return ctype_digit($exp) && (int)$exp > time() && hash_equals(dw_sign((int)$exp), $sig);
}

function dw_set_cookie(int $exp): void {
  setcookie(DW_COOKIE, $exp > 0 ? $exp . '.' . dw_sign($exp) : '', [
    'expires' => $exp > 0 ? $exp : time() - 3600, 'path' => '/stats/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict',
  ]);
}

/* не більше 8 невдалих спроб з однієї IP за 15 хв */
function dw_rl_file(): string {
  $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
  return sys_get_temp_dir() . '/deweb_stats_' . md5(trim(explode(',', (string)$ip)[0]));
}
function dw_fails(): array { $f = dw_rl_file(); return array_values(array_filter(is_file($f) ? (array)json_decode((string)file_get_contents($f), true) : [], fn($t) => $t > time() - 900)); }

function dw_login(string $pw): string {
  if (!dw_cfg()) return 'not_configured';
  $fails = dw_fails();
  if (count($fails) >= 8) return 'locked';
  if (hash_equals(dw_cfg()['pw'], hash_hmac('sha256', 'deweb-stats-password', $pw))) {
    @unlink(dw_rl_file());
    dw_set_cookie(time() + DW_TTL);
    return 'ok';
  }
  $fails[] = time(); @file_put_contents(dw_rl_file(), json_encode($fails));
  usleep(700000);
  return 'wrong';
}

function dw_read_json(string $f) {
  $p = dw_data($f);
  return is_file($p) ? json_decode((string)file_get_contents($p), true) : null;
}
