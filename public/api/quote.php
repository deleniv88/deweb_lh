<?php
/* =========================================================
   Заявка з поп-апу → Telegram (група/чат) + Gmail.
   Ключі лежать у api/config.php — його створює GitHub Action
   із секретів репозиторію під час кожного деплою.
   ========================================================= */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function out(int $code, array $data): void { http_response_code($code); echo json_encode($data); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false]);

$cfgFile = __DIR__ . '/config.php';
$cfg = is_file($cfgFile) ? (include $cfgFile) : [];
if (!is_array($cfg)) $cfg = [];
$c = fn(string $k): string => trim((string)($cfg[$k] ?? ''));

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 20000) out(413, ['ok' => false]);
$d = json_decode($raw, true);
if (!is_array($d)) out(400, ['ok' => false]);

function clean($v, int $max): string {
  $s = preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string)($v ?? '')) ?? '';
  return mb_substr(trim($s), 0, $max);
}
function esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

/* 1) поле-пастка: людина його не бачить */
if (clean($d['company'] ?? '', 100) !== '') out(200, ['ok' => true]);
/* 2) пастка часу: швидше 2,5 с людина форму не заповнить */
if ((int)($d['t'] ?? 0) < 2500) out(200, ['ok' => true]);

$name    = clean($d['name'] ?? '', 120);
$contact = clean($d['contact'] ?? '', 160);
$method  = clean($d['method'] ?? '', 20);
$message = clean($d['message'] ?? '', 3000);
$lang    = strtoupper(clean($d['lang'] ?? '', 5));
if ($name === '' || $contact === '') out(400, ['ok' => false, 'error' => 'missing']);

/* 3) спам із купою посилань */
if (preg_match_all('~https?://|www\.~i', "$name $contact $message") > 2) out(200, ['ok' => true]);

/* 4) простий ліміт: не більше 5 заявок з однієї IP за 10 хв */
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$ip = trim(explode(',', (string)$ip)[0]);
$rl = sys_get_temp_dir() . '/deweb_rl_' . md5($ip);
$hits = array_filter(is_file($rl) ? (array)json_decode((string)file_get_contents($rl), true) : [], fn($t) => $t > time() - 600);
if (count($hits) >= 5) out(429, ['ok' => false, 'error' => 'rate']);
$hits[] = time(); @file_put_contents($rl, json_encode(array_values($hits)));

function post(string $url, $body, array $headers = []): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 12, CURLOPT_HTTPHEADER => $headers]);
  $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$code, $res];
}

/* 5) Cloudflare Turnstile (якщо задано секретний ключ) */
if ($c('TURNSTILE_SECRET_KEY') !== '') {
  $tok = clean($d['turnstile'] ?? '', 4000);
  if ($tok === '') out(400, ['ok' => false, 'error' => 'captcha']);
  [$code, $res] = post('https://challenges.cloudflare.com/turnstile/v0/siteverify',
    http_build_query(['secret' => $c('TURNSTILE_SECRET_KEY'), 'response' => $tok, 'remoteip' => $ip]));
  $j = json_decode((string)$res, true);
  if (empty($j['success'])) out(400, ['ok' => false, 'error' => 'captcha']);
}

$labels = ['telegram' => 'Telegram', 'instagram' => 'Instagram', 'whatsapp' => 'WhatsApp', 'email' => 'Email'];
$via  = $labels[$method] ?? ($method ?: '—');
$page = clean($_SERVER['HTTP_REFERER'] ?? '', 300);

/* ---- Telegram ---- */
function sendTelegram(string $token, string $chat, string $text): string {
  if ($token === '' || $chat === '') return 'skip';
  [$code] = post("https://api.telegram.org/bot$token/sendMessage",
    json_encode(['chat_id' => $chat, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true]),
    ['Content-Type: application/json']);
  return $code === 200 ? 'ok' : 'fail';
}

/* ---- Gmail через SMTP (пароль застосунку) ---- */
function smtpSend(string $user, string $pass, string $to, string $subject, string $html, string $text, ?string $replyTo): string {
  if ($user === '' || $pass === '') return 'skip';
  $pass = preg_replace('/\s+/', '', $pass);
  $fp = @stream_socket_client('ssl://smtp.gmail.com:465', $errno, $errstr, 15);
  if (!$fp) return 'fail';
  stream_set_timeout($fp, 15);
  $read = function () use ($fp): string { $r = ''; while (($l = fgets($fp, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
  $cmd = function (string $c, string $expect) use ($fp, $read): bool { fwrite($fp, $c . "\r\n"); return strncmp($read(), $expect, 3) === 0; };
  $ok = strncmp($read(), '220', 3) === 0
    && $cmd('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), '250')
    && $cmd('AUTH LOGIN', '334') && $cmd(base64_encode($user), '334') && $cmd(base64_encode($pass), '235')
    && $cmd("MAIL FROM:<$user>", '250') && $cmd("RCPT TO:<$to>", '250') && $cmd('DATA', '354');
  if (!$ok) { fclose($fp); return 'fail'; }
  $b = 'b' . bin2hex(random_bytes(8));
  $enc = fn(string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
  $h = [
    'From: ' . $enc('Deweb site') . " <$user>", "To: <$to>", 'Subject: ' . $enc($subject),
    'Date: ' . date('r'), 'MIME-Version: 1.0', "Content-Type: multipart/alternative; boundary=\"$b\"",
  ];
  if ($replyTo) $h[] = "Reply-To: <$replyTo>";
  $body = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text))
        . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html))
        . "--$b--";
  $sent = $cmd(implode("\r\n", $h) . "\r\n\r\n" . $body . "\r\n.", '250');
  $cmd('QUIT', '221'); fclose($fp);
  return $sent ? 'ok' : 'fail';
}

$tg = "🆕 <b>Нова заявка з сайту</b>" . ($lang !== '' ? " · $lang" : '') . "\n\n👤 <b>" . esc($name) . "</b>\n📬 " . esc($via) . ': <code>' . esc($contact) . "</code>\n\n📝 "
    . esc($message !== '' ? $message : '—') . ($page !== '' ? "\n\n🔗 " . esc($page) : '');
$subject = "Нова заявка з сайту — $name" . ($lang !== '' ? " [$lang]" : '');
$text = ($lang !== '' ? "Мова сайту: $lang\n" : '') . "Ім'я: $name\nЗв'язок ($via): $contact\n\nЗапит:\n" . ($message ?: '—') . "\n\nСторінка: " . ($page ?: '—');
$html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#242527">'
      . '<h2 style="margin:0 0 12px;color:#5e6cff">Нова заявка з сайту</h2>'
      . '<p><b>Ім\'я:</b> ' . esc($name) . '<br><b>Зв\'язок (' . esc($via) . '):</b> ' . esc($contact) . '</p>'
      . '<p><b>Запит:</b><br>' . nl2br(esc($message ?: '—')) . '</p>'
      . '<p style="color:#888;font-size:13px">Сторінка: ' . esc($page ?: '—') . '</p></div>';
$replyTo = ($method === 'email' && filter_var($contact, FILTER_VALIDATE_EMAIL)) ? $contact : null;

$t = sendTelegram($c('TELEGRAM_BOT_TOKEN'), $c('TELEGRAM_CHAT_ID'), $tg);
$e = smtpSend($c('GMAIL_USER'), $c('GMAIL_APP_PASSWORD'), $c('NOTIFY_EMAIL') ?: $c('GMAIL_USER'), $subject, $html, $text, $replyTo);

if ($t === 'ok' || $e === 'ok') {
  /* лічильник заявок для сторінки /stats (без особистих даних) */
  require_once __DIR__ . '/events.php';
  dw_log_event('lead', strtolower($lang), isset($labels[$method]) ? $method : 'other');
  out(200, ['ok' => true]);
}
if ($t === 'skip' && $e === 'skip') out(501, ['ok' => false, 'error' => 'not_configured']);
out(502, ['ok' => false, 'error' => 'delivery']);
