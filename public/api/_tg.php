<?php
/* Telegram для всіх сповіщень сайту: кожен тип — у свою тему групи.
   Якщо в групі ввімкнено «Теми», а бот — адмін з правом керувати темами, він сам створює теми
   з TG_TOPICS при першому сповіщенні й запам'ятовує їхні id. Інакше все йде в загальний чат, як раніше.
   Коли звичайна група стає супергрупою (вмикання тем), Telegram міняє її id — новий id теж запам'ятовуємо,
   тож секрет TELEGRAM_CHAT_ID оновлювати не обов'язково. */
declare(strict_types=1);

const TG_TOPICS = [
  'leads'    => ['📩 Заявки', 7322096],
  'calls'    => ['📞 Дзвінки', 16766590],
  'audits'   => ['🔎 Перевірки сайтів', 13338331],
  'renewals' => ['⏰ Продовження послуг', 16749490],
  'stats'    => ['📊 Статистика', 9367192],
  'security' => ['🔐 Безпека', 16478047],
];
const TG_RETRY_CREATE = 3600; // якщо тему створити не вдалося (тем немає чи немає прав), пробуємо знову через годину

function tg_cfg(string $k): string {
  static $cfg = null;
  if ($cfg === null) { $f = __DIR__ . '/config.php'; $cfg = is_file($f) ? (include $f) : []; if (!is_array($cfg)) $cfg = []; }
  return trim((string)($cfg[$k] ?? ''));
}

/* стан (id тем, новий id групи): спершу поза публічною папкою сайту */
function tg_state_file(): string {
  $outside = dirname(__DIR__, 2) . '/.deweb-tg';
  if (is_dir($outside) || (@is_writable(dirname($outside)) && @mkdir($outside, 0700))) {
    if (is_writable($outside)) return "$outside/state.json";
  }
  $dir = __DIR__ . '/tg-data';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  if (!is_file("$dir/.htaccess"))
    @file_put_contents("$dir/.htaccess", "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
  return "$dir/state.json";
}

function tg_api(string $token, string $method, array $body): array {
  $ch = curl_init("https://api.telegram.org/bot$token/$method");
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode($body)]);
  $res = (string)curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  $j = json_decode($res, true);
  return [$code, is_array($j) ? $j : []];
}

/* надсилає $html у тему $topic; $code — HTTP-код останньої відповіді Telegram (0 — бот не налаштований).
   $all — заодно створити всі інші теми з TG_TOPICS, яких ще немає (кнопка «надіслати в Telegram» на /stats) */
function dw_tg(string $topic, string $html, ?int &$code = null, bool $all = false): bool {
  $code = 0;
  $token = tg_cfg('TELEGRAM_BOT_TOKEN'); $chat0 = tg_cfg('TELEGRAM_CHAT_ID');
  if ($token === '' || $chat0 === '') return false;

  $fp = @fopen(tg_state_file(), 'c+');
  if ($fp) flock($fp, LOCK_EX);
  $st = $fp ? json_decode((string)stream_get_contents($fp), true) : null;
  if (!is_array($st)) $st = [];
  $st0 = $st;

  /* створює тему $t, якщо її ще немає; false — група змінила id, треба почати спочатку */
  $create = function (string $t, bool $force) use (&$st, $token, $chat0): bool {
    $chat = (string)($st['moved'][$chat0] ?? $chat0); $key = "$chat|$t";
    if (!empty($st['topics'][$key]) || !isset(TG_TOPICS[$t])) return true;
    if (!$force && time() - (int)($st['failed'][$key] ?? 0) <= TG_RETRY_CREATE) return true;
    [$c, $j] = tg_api($token, 'createForumTopic', ['chat_id' => $chat, 'name' => TG_TOPICS[$t][0], 'icon_color' => TG_TOPICS[$t][1]]);
    if (!empty($j['parameters']['migrate_to_chat_id'])) { $st['moved'][$chat0] = (string)$j['parameters']['migrate_to_chat_id']; return false; }
    if ($c === 200 && !empty($j['result']['message_thread_id'])) { $st['topics'][$key] = (int)$j['result']['message_thread_id']; unset($st['failed'][$key]); }
    else $st['failed'][$key] = time();
    return true;
  };
  if ($all) for ($i = 0; $i < 2; $i++) {
    $ok = true;
    foreach (array_keys(TG_TOPICS) as $t) if (!$create($t, true)) { $ok = false; break; }
    if ($ok) break;
  }

  $plain = false; // true — шлемо в загальний чат, минаючи тему
  for ($try = 0; $try < 4; $try++) {
    if (!$plain && !$create($topic, false)) continue;
    $chat = (string)($st['moved'][$chat0] ?? $chat0);
    $key = "$chat|$topic";
    $thread = $plain ? 0 : (int)($st['topics'][$key] ?? 0);
    $body = ['chat_id' => $chat, 'text' => $html, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true];
    if ($thread) $body['message_thread_id'] = $thread;
    [$code, $j] = tg_api($token, 'sendMessage', $body);
    if ($code === 200) break;
    /* група стала супергрупою — шлемо на новий id */
    if (!empty($j['parameters']['migrate_to_chat_id'])) { $st['moved'][$chat0] = (string)$j['parameters']['migrate_to_chat_id']; continue; }
    /* тему видалили — створимо заново; закрили чи інша проблема з темою — напишемо в загальний чат */
    if ($thread && $code === 400) {
      if (preg_match('/thread not found|topic_deleted/i', (string)($j['description'] ?? ''))) { unset($st['topics'][$key], $st['failed'][$key]); continue; }
      $plain = true; continue;
    }
    break;
  }

  if ($fp) {
    if ($st !== $st0) { ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($st, JSON_UNESCAPED_UNICODE)); fflush($fp); }
    flock($fp, LOCK_UN); fclose($fp);
  }
  return $code === 200;
}
