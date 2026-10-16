<?php
/* =========================================================
   Лічильник подій сайту для сторінки /stats: заявки, відкриття форми, чек-лист.
   Рахуємо на сервері, тож цифри не залежать від блокувальників реклами і налаштувань GTM.
   Особистих даних не пишемо: лише дата, подія, мова і канал зв'язку.
   Файл: stats/data/events.json (закритий від браузера).

   Підключається з quote.php (заявка) і сам приймає POST від сайту (відкриття форми).
   ========================================================= */
declare(strict_types=1);

function dw_events_file(): string {
  $dir = dirname(__DIR__) . '/stats/data';
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
    @file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
  }
  return $dir . '/events.json';
}

function dw_log_event(string $event, string $lang, string $extra = ''): void {
  try {
    $lang = in_array($lang, ['en', 'pl', 'ua'], true) ? $lang : 'en';
    $day = (new DateTime('now', new DateTimeZone('Europe/Warsaw')))->format('Y-m-d');
    $fp = @fopen(dw_events_file(), 'c+');
    if (!$fp) return;
    flock($fp, LOCK_EX);
    $j = json_decode((string)stream_get_contents($fp), true);
    if (!is_array($j)) $j = ['since' => $day, 'days' => []];
    $n = &$j['days'][$day][$event][$lang];
    $n = (int)($n ?? 0) + 1;
    /* не більше 40 різних значень на день, щоб випадкові UTM не роздули файл */
    if ($extra !== '' && !isset($j['days'][$day][$event . '_via'][$extra]) && count($j['days'][$day][$event . '_via'] ?? []) >= 40) $extra = 'other';
    if ($extra !== '') { $m = &$j['days'][$day][$event . '_via'][$extra]; $m = (int)($m ?? 0) + 1; }
    ftruncate($fp, 0); rewind($fp);
    fwrite($fp, json_encode($j));
    fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  } catch (Throwable $e) { /* статистика ніколи не ламає форму */ }
}

/* джерело переходу з браузера ('instagram / social / bio'): лише латиниця, цифри і роздільники */
function dw_src_clean($v): string {
  $v = strtolower(trim((string)$v));
  $v = preg_replace('~[^a-z0-9_. /-]+~', '', $v);
  return substr(trim(preg_replace('~\s+~', ' ', $v)), 0, 100);
}

/* прямий виклик: navigator.sendBeacon('/api/events.php', 'quote_open|pl'), перехід з джерелом — 'visit|pl|instagram / social / bio' */
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
  header('X-Robots-Tag: noindex');
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
  $raw = substr((string)file_get_contents('php://input'), 0, 140);
  [$ev, $lang, $src] = array_pad(explode('|', $raw, 3), 3, '');
  /* quote_open — відкрили форму; cl_* — чек-лист /checklist/: відкрили, пройшли до кінця, перейшли на /audyt/ */
  /* visit — прийшли за посиланням з UTM або із соцмережі (раз за сесію) */
  if (!in_array($ev, ['quote_open', 'cl_open', 'cl_done', 'cl_go', 'visit'], true)) { http_response_code(400); exit; }
  $src = $ev === 'visit' ? dw_src_clean($src) : '';
  if ($ev === 'visit' && $src === '') { http_response_code(400); exit; }

  /* не більше 20 подій з однієї IP за 10 хв, щоб цифри не накрутити */
  require_once __DIR__ . '/_ip.php';
  $rl = sys_get_temp_dir() . '/deweb_ev_' . md5(dw_client_ip());
  $hits = array_filter(is_file($rl) ? (array)json_decode((string)file_get_contents($rl), true) : [], fn($t) => $t > time() - 600);
  if (count($hits) >= 20) { http_response_code(204); exit; }
  $hits[] = time(); @file_put_contents($rl, json_encode(array_values($hits)));

  dw_log_event($ev, $lang, $src);
  http_response_code(204);
}
