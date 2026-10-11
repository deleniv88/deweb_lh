<?php
/* =========================================================
   CRM deweb.studio: спільне ядро для /crm, AI-чату і форми заявки.
   - база SQLite у папці поза сайтом (якщо хостинг дозволяє), інакше в crm/data, закритій від браузера;
   - особисті дані клієнтів і нотатки зашифровані (libsodium), ключ — окремий файл поруч із базою;
   - вхід: пароль + код з Google Authenticator; налаштування — через код у Telegram;
   - Google Календар: підключається кнопкою в CRM, створює зустрічі з Google Meet.
   ========================================================= */
declare(strict_types=1);

const CRM_TZ = 'Europe/Warsaw';
const CRM_IDLE = 12 * 3600;        // без дій 12 год — вихід
const CRM_MAX_SESSION = 14 * 86400; // не довше 14 днів
const CRM_STATUSES = ['new', 'contacted', 'call', 'proposal', 'won', 'lost'];

function crm_cfg(string $k, string $def = ''): string {
  static $cfg = null;
  if ($cfg === null) {
    $f = dirname(__DIR__) . '/api/config.php';
    $cfg = is_file($f) ? (include $f) : [];
    if (!is_array($cfg)) $cfg = [];
  }
  return trim((string)($cfg[$k] ?? '')) ?: $def;
}

/* ---- папка з даними: спершу поза публічною папкою сайту ---- */
function crm_dir(): string {
  static $dir = null;
  if ($dir !== null) return $dir;
  $outside = dirname(__DIR__, 2) . '/.deweb-crm';
  if (is_dir($outside) || (@is_writable(dirname($outside)) && @mkdir($outside, 0700))) {
    if (is_writable($outside)) return $dir = $outside;
  }
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  if (!is_file("$dir/.htaccess"))
    @file_put_contents("$dir/.htaccess", "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
  return $dir;
}

function crm_db(): PDO {
  static $db = null;
  if ($db) return $db;
  $db = new PDO('sqlite:' . crm_dir() . '/crm.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $db->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON');
  $db->exec('CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
  $db->exec('CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, email_hash TEXT, status TEXT NOT NULL DEFAULT \'new\',
    source TEXT NOT NULL DEFAULT \'manual\', lang TEXT NOT NULL DEFAULT \'\', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)');
  $db->exec('CREATE INDEX IF NOT EXISTS clients_email ON clients(email_hash)');
  $db->exec('CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE, data TEXT NOT NULL,
    start_at INTEGER NOT NULL, minutes INTEGER NOT NULL, status TEXT NOT NULL DEFAULT \'scheduled\', meet_url TEXT NOT NULL DEFAULT \'\',
    gcal_id TEXT NOT NULL DEFAULT \'\', source TEXT NOT NULL DEFAULT \'manual\', created_at INTEGER NOT NULL)');
  $db->exec('CREATE INDEX IF NOT EXISTS meetings_start ON meetings(start_at)');
  $db->exec('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, seen_at INTEGER NOT NULL, ip TEXT NOT NULL DEFAULT \'\')');
  return $db;
}

/* ---- шифрування ---- */
function crm_key(): string {
  static $k = null;
  if ($k !== null) return $k;
  $f = crm_dir() . '/key.bin';
  if (!is_file($f)) {
    $fp = fopen($f, 'x');
    if ($fp) { fwrite($fp, random_bytes(SODIUM_CRYPTO_SECRETBOX_KEYBYTES)); fclose($fp); @chmod($f, 0600); }
  }
  $k = (string)file_get_contents($f);
  if (strlen($k) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) throw new RuntimeException('crm key');
  return $k;
}
function crm_enc($value): string {
  $n = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
  return base64_encode($n . sodium_crypto_secretbox(json_encode($value, JSON_UNESCAPED_UNICODE), $n, crm_key()));
}
function crm_dec(string $s) {
  $b = base64_decode($s, true);
  if ($b === false || strlen($b) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) return null;
  $p = sodium_crypto_secretbox_open(substr($b, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), substr($b, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), crm_key());
  return $p === false ? null : json_decode($p, true);
}
/* email → незворотний відбиток, щоб знаходити клієнта без розшифрування всієї бази */
function crm_email_hash(string $email): string {
  $e = mb_strtolower(trim($email));
  return $e === '' ? '' : hash_hmac('sha256', $e, crm_key());
}

/* ---- налаштування ---- */
function crm_get(string $k, $def = null) {
  $st = crm_db()->prepare('SELECT v FROM settings WHERE k = ?'); $st->execute([$k]);
  $v = $st->fetchColumn();
  return $v === false ? $def : json_decode((string)$v, true);
}
function crm_set(string $k, $v): void {
  if ($v === null) { crm_db()->prepare('DELETE FROM settings WHERE k = ?')->execute([$k]); return; }
  crm_db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v')->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
}

function crm_schedule(): array {
  $s = (array)crm_get('schedule', []);
  return [
    'days' => array_values(array_map('intval', (array)($s['days'] ?? [1, 2, 3, 4, 5]))),
    'from' => preg_match('/^\d\d:\d\d$/', (string)($s['from'] ?? '')) ? $s['from'] : '10:00',
    'to' => preg_match('/^\d\d:\d\d$/', (string)($s['to'] ?? '')) ? $s['to'] : '17:00',
    'minutes' => max(15, min(120, (int)($s['minutes'] ?? 30))),
    'notice' => max(0, min(168, (int)($s['notice'] ?? 12))),
    'horizon' => max(1, min(60, (int)($s['horizon'] ?? 14))),
    'buffer' => max(0, min(60, (int)($s['buffer'] ?? 15))),
    'blocked' => array_values(array_filter((array)($s['blocked'] ?? []), fn($d) => preg_match('/^\d{4}-\d\d-\d\d$/', (string)$d))),
  ];
}

/* ---- Telegram ---- */
function crm_http(string $method, string $url, $body = null, array $headers = [], int $timeout = 15): array {
  $ch = curl_init($url);
  $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_HTTPHEADER => $headers, CURLOPT_CUSTOMREQUEST => $method];
  if ($body !== null) $o[CURLOPT_POSTFIELDS] = $body;
  curl_setopt_array($ch, $o);
  $res = curl_exec($ch);
  return [(int)curl_getinfo($ch, CURLINFO_HTTP_CODE), (string)$res];
}
function crm_tg(string $html): bool {
  $token = crm_cfg('TELEGRAM_BOT_TOKEN'); $chat = crm_cfg('TELEGRAM_CHAT_ID');
  if ($token === '' || $chat === '') return false;
  [$code] = crm_http('POST', "https://api.telegram.org/bot$token/sendMessage",
    json_encode(['chat_id' => $chat, 'text' => $html, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true]), ['Content-Type: application/json']);
  return $code === 200;
}
function crm_esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function crm_ip(): string {
  $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
  return trim(explode(',', (string)$ip)[0]);
}
function crm_site(): string {
  $host = preg_replace('/[^a-z0-9.:-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
  return $host === '' ? 'https://deweb.studio' : (crm_cookie_secure() && !str_starts_with($host, 'localhost') ? 'https://' : 'http://') . $host;
}

/* ---- TOTP (Google Authenticator), RFC 6238 ---- */
function crm_b32(string $bin): string {
  $abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
  foreach (str_split($bin) as $c) $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
  foreach (str_split($bits, 5) as $chunk) $out .= $abc[bindec(str_pad($chunk, 5, '0'))];
  return $out;
}
function crm_totp(string $secret, int $step): string {
  $h = hash_hmac('sha1', pack('J', $step), $secret, true);
  $o = ord($h[19]) & 15;
  $n = ((ord($h[$o]) & 127) << 24 | ord($h[$o + 1]) << 16 | ord($h[$o + 2]) << 8 | ord($h[$o + 3])) % 1000000;
  return str_pad((string)$n, 6, '0', STR_PAD_LEFT);
}
function crm_totp_ok(string $secret, string $code): bool {
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return false;
  $now = intdiv(time(), 30);
  for ($i = -1; $i <= 1; $i++) if (hash_equals(crm_totp($secret, $now + $i), $code)) {
    /* один код — один вхід */
    $last = (int)crm_get('auth_totp_last', 0);
    if ($now + $i <= $last) return false;
    crm_set('auth_totp_last', $now + $i);
    return true;
  }
  return false;
}

/* ---- сесія ---- */
function crm_cookie_secure(): bool {
  return ($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off'
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' || in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1'], true);
}
function crm_set_cookie(string $v, int $exp): void {
  setcookie('dw_crm', $v, ['expires' => $exp, 'path' => '/crm/', 'secure' => crm_cookie_secure(), 'httponly' => true, 'samesite' => 'Strict']);
}
function crm_login_session(): void {
  $tok = bin2hex(random_bytes(32));
  crm_db()->prepare('INSERT INTO sessions (id, created_at, seen_at, ip) VALUES (?, ?, ?, ?)')->execute([hash('sha256', $tok), time(), time(), crm_ip()]);
  crm_db()->prepare('DELETE FROM sessions WHERE seen_at < ? OR created_at < ?')->execute([time() - CRM_IDLE, time() - CRM_MAX_SESSION]);
  crm_set_cookie($tok, time() + CRM_MAX_SESSION);
}
function crm_authed(): bool {
  static $ok = null;
  if ($ok !== null) return $ok;
  $tok = (string)($_COOKIE['dw_crm'] ?? '');
  if (!preg_match('/^[a-f0-9]{64}$/', $tok) || !crm_get('auth_pw')) return $ok = false;
  $st = crm_db()->prepare('SELECT * FROM sessions WHERE id = ?'); $st->execute([hash('sha256', $tok)]);
  $s = $st->fetch();
  if (!$s || $s['seen_at'] < time() - CRM_IDLE || $s['created_at'] < time() - CRM_MAX_SESSION) return $ok = false;
  if ($s['seen_at'] < time() - 60) crm_db()->prepare('UPDATE sessions SET seen_at = ? WHERE id = ?')->execute([time(), $s['id']]);
  return $ok = true;
}
function crm_logout(): void {
  $tok = (string)($_COOKIE['dw_crm'] ?? '');
  if ($tok !== '') crm_db()->prepare('DELETE FROM sessions WHERE id = ?')->execute([hash('sha256', $tok)]);
  crm_set_cookie('', time() - 3600);
}

/* невдалі спроби входу: 5 за 15 хв з однієї IP → блок і сповіщення в Telegram */
function crm_fails(): array {
  $f = (array)crm_get('auth_fails', []);
  $ip = crm_ip();
  return array_values(array_filter((array)($f[$ip] ?? []), fn($t) => $t > time() - 900));
}
function crm_fail(): void {
  $all = (array)crm_get('auth_fails', []);
  $ip = crm_ip();
  $list = crm_fails(); $list[] = time();
  $all[$ip] = $list;
  foreach ($all as $k => $v) if (!array_filter((array)$v, fn($t) => $t > time() - 900)) unset($all[$k]);
  crm_set('auth_fails', $all);
  if (count($list) === 5) crm_tg("⚠️ <b>CRM: 5 невдалих спроб входу</b>\nIP: <code>" . crm_esc($ip) . "</code>\nВхід з цієї адреси заблоковано на 15 хв.");
  usleep(600000);
}

/* ---- клієнти й зустрічі ---- */
function crm_client_row(array $r): array {
  $d = (array)(crm_dec($r['data']) ?? []);
  return ['id' => (int)$r['id'], 'status' => $r['status'], 'source' => $r['source'], 'lang' => $r['lang'],
    'created_at' => (int)$r['created_at'], 'updated_at' => (int)$r['updated_at'],
    'name' => (string)($d['name'] ?? ''), 'company' => (string)($d['company'] ?? ''), 'email' => (string)($d['email'] ?? ''),
    'phone' => (string)($d['phone'] ?? ''), 'contact' => (string)($d['contact'] ?? ''), 'notes' => (string)($d['notes'] ?? '')];
}
function crm_meeting_row(array $r): array {
  $d = (array)(crm_dec($r['data']) ?? []);
  return ['id' => (int)$r['id'], 'client_id' => $r['client_id'] === null ? null : (int)$r['client_id'], 'start_at' => (int)$r['start_at'],
    'minutes' => (int)$r['minutes'], 'status' => $r['status'], 'meet_url' => $r['meet_url'], 'gcal' => $r['gcal_id'] !== '', 'source' => $r['source'],
    'topic' => (string)($d['topic'] ?? ''), 'notes' => (string)($d['notes'] ?? '')];
}
const CRM_CLIENT_FIELDS = ['name' => 120, 'company' => 120, 'email' => 160, 'phone' => 60, 'contact' => 200, 'notes' => 20000];

function crm_clean($v, int $max): string {
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', ' ', (string)($v ?? '')) ?? '';
  return mb_substr(trim($s), 0, $max);
}

function crm_client_save(?int $id, array $in, string $source = 'manual', string $lang = ''): int {
  $db = crm_db();
  $cur = [];
  if ($id) {
    $st = $db->prepare('SELECT * FROM clients WHERE id = ?'); $st->execute([$id]);
    $r = $st->fetch();
    if (!$r) throw new RuntimeException('not_found');
    $cur = crm_client_row($r);
  }
  $d = [];
  foreach (CRM_CLIENT_FIELDS as $k => $max) $d[$k] = array_key_exists($k, $in) ? crm_clean($in[$k], $max) : ($cur[$k] ?? '');
  $status = in_array($in['status'] ?? '', CRM_STATUSES, true) ? $in['status'] : ($cur['status'] ?? 'new');
  if ($id) {
    $db->prepare('UPDATE clients SET data = ?, email_hash = ?, status = ?, updated_at = ? WHERE id = ?')
      ->execute([crm_enc($d), crm_email_hash($d['email']), $status, time(), $id]);
    return $id;
  }
  $db->prepare('INSERT INTO clients (data, email_hash, status, source, lang, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    ->execute([crm_enc($d), crm_email_hash($d['email']), $status, $source, $lang, time(), time()]);
  return (int)$db->lastInsertId();
}

/* клієнт із чату/форми: знайти за email або створити; нотатку дописати зверху */
function crm_client_upsert(array $in, string $source, string $lang, string $note = ''): int {
  $id = null;
  if (($in['email'] ?? '') !== '') {
    $st = crm_db()->prepare('SELECT id FROM clients WHERE email_hash = ? ORDER BY id DESC LIMIT 1');
    $st->execute([crm_email_hash((string)$in['email'])]);
    $id = $st->fetchColumn() ?: null;
  }
  $stamp = (new DateTime('now', new DateTimeZone(CRM_TZ)))->format('d.m.Y H:i');
  $label = ['chat' => 'AI-чат', 'form' => 'форма'][$source] ?? $source;
  $entry = $note !== '' ? "[$stamp · $label] $note" : '';
  if ($id) {
    $st = crm_db()->prepare('SELECT * FROM clients WHERE id = ?'); $st->execute([$id]);
    $cur = crm_client_row($st->fetch());
    $upd = [];
    foreach (['name', 'company', 'phone', 'contact'] as $k) if (($in[$k] ?? '') !== '' && $cur[$k] === '') $upd[$k] = $in[$k];
    if ($entry !== '') $upd['notes'] = trim($entry . "\n\n" . $cur['notes']);
    return crm_client_save((int)$id, $upd);
  }
  return crm_client_save(null, $in + ['notes' => $entry], $source, $lang);
}

function crm_meeting_add(?int $clientId, int $start, int $minutes, array $data, string $source, string $meetUrl = '', string $gcalId = ''): int {
  crm_db()->prepare('INSERT INTO meetings (client_id, data, start_at, minutes, status, meet_url, gcal_id, source, created_at) VALUES (?, ?, ?, ?, \'scheduled\', ?, ?, ?, ?)')
    ->execute([$clientId, crm_enc(['topic' => crm_clean($data['topic'] ?? '', 200), 'notes' => crm_clean($data['notes'] ?? '', 20000)]), $start, $minutes, $meetUrl, $gcalId, $source, time()]);
  if ($clientId) crm_db()->prepare('UPDATE clients SET status = CASE WHEN status IN (\'new\', \'contacted\') THEN \'call\' ELSE status END, updated_at = ? WHERE id = ?')->execute([time(), $clientId]);
  return (int)crm_db()->lastInsertId();
}

/* перенесення з чату: скасувати майбутні дзвінки клієнта (крім нового) і прибрати їх з Google Календаря */
function crm_meetings_cancel_future(int $clientId, int $exceptId): array {
  $st = crm_db()->prepare('SELECT * FROM meetings WHERE client_id = ? AND id != ? AND status = \'scheduled\' AND start_at > ? ORDER BY start_at');
  $st->execute([$clientId, $exceptId, time()]);
  $done = [];
  foreach ($st->fetchAll() as $r) {
    if ($r['gcal_id'] !== '' && crm_google_on()) crm_google_cancel($r['gcal_id']);
    crm_db()->prepare('UPDATE meetings SET status = \'cancelled\' WHERE id = ?')->execute([$r['id']]);
    $done[] = (int)$r['start_at'];
  }
  return $done;
}

/* ---- Google Календар ---- */
const CRM_GOOGLE_SCOPES = 'openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy';
function crm_google_configured(): bool { return crm_cfg('GOOGLE_CLIENT_ID') !== '' && crm_cfg('GOOGLE_CLIENT_SECRET') !== ''; }
function crm_google_refresh(): string {
  $g = crm_get('google');
  if (is_array($g) && !empty($g['refresh'])) return (string)(crm_dec($g['refresh']) ?? '');
  return crm_cfg('GOOGLE_REFRESH_TOKEN');
}
function crm_google_on(): bool { return crm_google_configured() && crm_google_refresh() !== ''; }
function crm_google_calendar(): string { return crm_cfg('GOOGLE_CALENDAR_ID', 'primary'); }

function crm_google_token(): ?string {
  $c = crm_get('google_access');
  if (is_array($c) && ($c['exp'] ?? 0) > time() + 60) { $t = crm_dec((string)$c['t']); if (is_string($t)) return $t; }
  $refresh = crm_google_refresh();
  if ($refresh === '' || !crm_google_configured()) return null;
  [$code, $res] = crm_http('POST', 'https://oauth2.googleapis.com/token', http_build_query([
    'client_id' => crm_cfg('GOOGLE_CLIENT_ID'), 'client_secret' => crm_cfg('GOOGLE_CLIENT_SECRET'),
    'refresh_token' => $refresh, 'grant_type' => 'refresh_token']));
  $r = json_decode($res, true);
  if ($code !== 200 || empty($r['access_token'])) {
    error_log("deweb crm: google token $code " . substr($res, 0, 200));
    if (($r['error'] ?? '') === 'invalid_grant') crm_set('google_error', 'invalid_grant');
    return null;
  }
  crm_set('google_error', null);
  crm_set('google_access', ['t' => crm_enc($r['access_token']), 'exp' => time() + (int)($r['expires_in'] ?? 3000)]);
  return $r['access_token'];
}
function crm_gcall(string $method, string $url, ?array $body = null): array {
  $t = crm_google_token();
  if (!$t) return [0, []];
  [$code, $res] = crm_http($method, $url, $body === null ? null : json_encode($body), ['Content-Type: application/json', "Authorization: Bearer $t"]);
  return [$code, json_decode($res, true) ?: []];
}
/* зайняті проміжки з Google Календаря; null — календар недоступний */
function crm_google_busy(int $from, int $to): ?array {
  [$code, $r] = crm_gcall('POST', 'https://www.googleapis.com/calendar/v3/freeBusy', [
    'timeMin' => gmdate('c', $from), 'timeMax' => gmdate('c', $to), 'items' => [['id' => crm_google_calendar()]]]);
  if ($code !== 200) return null;
  return array_map(fn($b) => [strtotime($b['start']), strtotime($b['end'])], $r['calendars'][crm_google_calendar()]['busy'] ?? []);
}
/* подія з Google Meet і запрошенням на email клієнта */
function crm_google_event(int $start, int $minutes, string $title, string $description, string $email = '', string $name = ''): ?array {
  $body = [
    'summary' => $title, 'description' => $description,
    'start' => ['dateTime' => gmdate('c', $start), 'timeZone' => CRM_TZ],
    'end' => ['dateTime' => gmdate('c', $start + $minutes * 60), 'timeZone' => CRM_TZ],
    'conferenceData' => ['createRequest' => ['requestId' => bin2hex(random_bytes(8)), 'conferenceSolutionKey' => ['type' => 'hangoutsMeet']]],
    'reminders' => ['useDefault' => true],
  ];
  if ($email !== '') $body['attendees'] = [['email' => $email, 'displayName' => $name]];
  [$code, $ev] = crm_gcall('POST', 'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode(crm_google_calendar()) . '/events?conferenceDataVersion=1&sendUpdates=all', $body);
  if ($code !== 200) { error_log("deweb crm: google event $code"); return null; }
  return ['id' => (string)($ev['id'] ?? ''), 'meet' => (string)($ev['hangoutLink'] ?? '')];
}
function crm_google_cancel(string $eventId): bool {
  [$code] = crm_gcall('DELETE', 'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode(crm_google_calendar()) . '/events/' . rawurlencode($eventId) . '?sendUpdates=all');
  return $code === 204 || $code === 200 || $code === 410;
}

/* ---- вільні вікна: графік з CRM мінус зустрічі в CRM і зайнятий час у Google ---- */
function crm_free_slots(int $fromDay, int $days, ?int $onlyStart = null): ?array {
  $s = crm_schedule();
  $tz = new DateTimeZone(CRM_TZ);
  $first = (new DateTimeImmutable('@' . $fromDay))->setTimezone($tz)->setTime(0, 0);
  $end = $first->modify("+$days day");
  $busy = [];
  $st = crm_db()->prepare('SELECT start_at, minutes FROM meetings WHERE status = \'scheduled\' AND start_at < ? AND start_at + minutes * 60 > CAST(? AS INTEGER)');
  $st->execute([$end->getTimestamp(), $first->getTimestamp()]);
  foreach ($st->fetchAll() as $m) $busy[] = [(int)$m['start_at'], (int)$m['start_at'] + (int)$m['minutes'] * 60];
  if (crm_google_on()) {
    $g = crm_google_busy($first->getTimestamp(), $end->getTimestamp());
    if ($g === null) return null;
    $busy = array_merge($busy, $g);
  }
  $earliest = time() + $s['notice'] * 3600;
  $latest = time() + $s['horizon'] * 86400;
  $len = $s['minutes'] * 60; $buf = $s['buffer'] * 60;
  [$h1, $m1] = array_map('intval', explode(':', $s['from'])); [$h2, $m2] = array_map('intval', explode(':', $s['to']));
  $out = [];
  for ($i = 0; $i < $days; $i++) {
    $day = $first->modify("+$i day");
    if (!in_array((int)$day->format('N'), $s['days'], true) || in_array($day->format('Y-m-d'), $s['blocked'], true)) continue;
    $t = $day->setTime($h1, $m1); $stop = $day->setTime($h2, $m2)->getTimestamp();
    for (; $t->getTimestamp() + $len <= $stop; $t = $t->modify('+30 minutes')) {
      $a = $t->getTimestamp(); $b = $a + $len;
      if ($a < $earliest || $a > $latest) continue;
      if ($onlyStart !== null && $a !== $onlyStart) continue;
      foreach ($busy as [$bs, $be]) if ($a < $be + $buf && $b + $buf > $bs) continue 2;
      $out[] = $a;
    }
  }
  return $out;
}
