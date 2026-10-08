<?php
/* Тижневий звіт у Telegram. Викликає workflow Stats щопонеділка після оновлення даних.
   Доступ — лише з ключем X-Stats-Key (HMAC від STATS_PASSWORD, лежить у data/config.php). */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
require __DIR__ . '/_digest.php';
header('Content-Type: application/json; charset=utf-8');

$key = (string)($_SERVER['HTTP_X_STATS_KEY'] ?? '');
$cfg = dw_cfg();
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$cfg || empty($cfg['cron']) || !hash_equals($cfg['cron'], $key)) { http_response_code(403); echo '{"error":"forbidden"}'; exit; }

$text = dw_digest(7, 'https://' . ($_SERVER['HTTP_HOST'] ?? 'deweb.studio'));
$r = $text === null ? 'no_data' : dw_tg_send($text);
http_response_code($r === 'ok' ? 200 : 500);
echo json_encode(['result' => $r]);
