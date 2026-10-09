<?php
/* Дані для /stats (тільки після входу).
   GET                     → історія з workflow + лічильники заявок + нотатки
   POST {action:"note_add", date, text} / {action:"note_del", id} → нотатки на графіку
   POST {action:"tg_send", period | from, to} → короткий звіт за період у Telegram
   POST {action:"logout"}  → вихід */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
header('Content-Type: application/json; charset=utf-8');

function out(int $code, $data): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
if (!dw_authed()) out(401, ['error' => 'auth']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  /* історія по днях велика — стискаємо, якщо браузер уміє */
  if (!ini_get('zlib.output_compression') && extension_loaded('zlib')) ob_start('ob_gzhandler');
  out(200, ['history' => dw_read_json('history.json'), 'events' => dw_read_json('events.json'), 'notes' => dw_read_json('notes.json') ?? []]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'method']);

/* запит лише з цього ж сайту */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) out(403, ['error' => 'origin']);

$d = json_decode(substr((string)file_get_contents('php://input'), 0, 5000), true);
$action = is_array($d) ? (string)($d['action'] ?? '') : '';

if ($action === 'logout') { dw_set_cookie(0); out(200, ['ok' => true]); }

if ($action === 'tg_send') {
  require __DIR__ . '/_digest.php';
  /* не частіше разу на 20 секунд, щоб випадкові кліки не засипали чат */
  $lock = dw_data('tg_last.txt');
  if (is_file($lock) && (int)file_get_contents($lock) > time() - 20) out(429, ['error' => 'rate']);
  @file_put_contents($lock, (string)time());
  $P = in_array((int)($d['period'] ?? 7), [7, 30, 90], true) ? (int)$d['period'] : 7;
  /* свій період з календаря: обидві дати, не довше року */
  $from = (string)($d['from'] ?? ''); $to = (string)($d['to'] ?? '');
  $ok = preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) && $from <= $to && strtotime($to) - strtotime($from) <= 400 * 86400;
  $text = dw_digest($P, 'https://' . ($_SERVER['HTTP_HOST'] ?? 'deweb.studio'), $ok ? $from : null, $ok ? $to : null);
  if ($text === null) out(409, ['error' => 'no_data']);
  $r = dw_tg_send($text);
  out($r === 'ok' ? 200 : 502, $r === 'ok' ? ['ok' => true] : ['error' => $r]);
}

if ($action === 'note_add' || $action === 'note_del') {
  $fp = fopen(dw_data('notes.json'), 'c+');
  if (!$fp) out(500, ['error' => 'write']);
  flock($fp, LOCK_EX);
  $notes = json_decode((string)stream_get_contents($fp), true);
  if (!is_array($notes)) $notes = [];
  if ($action === 'note_add') {
    $date = (string)($d['date'] ?? '');
    $text = trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string)($d['text'] ?? '')) ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $text === '') { flock($fp, LOCK_UN); out(400, ['error' => 'input']); }
    $notes[] = ['id' => bin2hex(random_bytes(6)), 'date' => $date, 'text' => mb_substr($text, 0, 80)];
  } else {
    $id = (string)($d['id'] ?? '');
    $notes = array_values(array_filter($notes, fn($n) => ($n['id'] ?? '') !== $id));
  }
  usort($notes, fn($a, $b) => strcmp($a['date'], $b['date']));
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($notes, JSON_UNESCAPED_UNICODE));
  fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  out(200, ['notes' => $notes]);
}
out(400, ['error' => 'action']);
