<?php
/* Щоденні нагадування про утримання (домени, сервери) у Telegram.
   Викликає workflow CRM reminders. Ключ — HMAC від TELEGRAM_BOT_TOKEN, тож окремий секрет не потрібен. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$token = crm_cfg('TELEGRAM_BOT_TOKEN');
$key = (string)($_SERVER['HTTP_X_CRM_CRON'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $token === '' || !hash_equals(hash_hmac('sha256', 'deweb-crm-cron', $token), $key)) {
  http_response_code(403); echo '{"error":"forbidden"}'; exit;
}
try {
  $r = crm_ret_remind();
  http_response_code(empty($r['error']) ? 200 : 500);
  echo json_encode($r);
} catch (Throwable $e) {
  error_log('deweb crm cron: ' . $e->getMessage());
  http_response_code(500); echo '{"error":"server"}';
}
