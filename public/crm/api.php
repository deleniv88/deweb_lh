<?php
/* JSON API для сторінки /crm (app.js). Усі запити — POST з JSON {action, ...} і заголовком X-CRM: 1. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function out(array $d, int $code = 200): void { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

/* захист від підроблених запитів з інших сайтів: лише свій JSON-запит із заголовком */
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_SERVER['HTTP_X_CRM'] ?? '') !== '1') out(['ok' => false], 405);
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url(crm_site(), PHP_URL_HOST)) out(['ok' => false], 403);
$d = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($d)) out(['ok' => false], 400);
$action = (string)($d['action'] ?? '');

try {
  $configured = (bool)crm_get('auth_pw');

  /* ---------- перше налаштування: код у Telegram → пароль → Google Authenticator ---------- */
  if (!$configured && $action === 'setup_send') {
    $p = (array)crm_get('setup', []);
    if (($p['sent'] ?? 0) > time() - 60) out(['ok' => false, 'error' => 'wait']);
    $code = (string)random_int(100000, 999999);
    if (!crm_tg("🔐 <b>Код для налаштування CRM:</b> <code>$code</code>\nДіє 10 хвилин. Якщо це не ти, просто ігноруй.\nIP: <code>" . crm_esc(crm_ip()) . '</code>'))
      out(['ok' => false, 'error' => 'telegram']);
    crm_set('setup', ['hash' => password_hash($code, PASSWORD_DEFAULT), 'exp' => time() + 600, 'sent' => time(), 'tries' => 0]);
    out(['ok' => true]);
  }
  if (!$configured && $action === 'setup_verify') {
    $p = (array)crm_get('setup', []);
    if (empty($p['hash']) || ($p['exp'] ?? 0) < time() || ($p['tries'] ?? 0) >= 5) out(['ok' => false, 'error' => 'expired']);
    if (!password_verify(preg_replace('/\D/', '', (string)($d['code'] ?? '')), $p['hash'])) {
      $p['tries'] = ($p['tries'] ?? 0) + 1; crm_set('setup', $p); usleep(600000);
      out(['ok' => false, 'error' => 'code']);
    }
    $pw = (string)($d['password'] ?? '');
    if (mb_strlen($pw) < 10) out(['ok' => false, 'error' => 'weak']);
    $secret = random_bytes(20);
    crm_set('setup', $p + ['pw' => password_hash($pw, PASSWORD_DEFAULT), 'totp' => crm_enc(base64_encode($secret))]);
    $b32 = crm_b32($secret);
    out(['ok' => true, 'secret' => $b32, 'uri' => 'otpauth://totp/' . rawurlencode('Deweb CRM') . '?secret=' . $b32 . '&issuer=' . rawurlencode('Deweb CRM')]);
  }
  if (!$configured && $action === 'setup_finish') {
    $p = (array)crm_get('setup', []);
    if (empty($p['pw']) || empty($p['totp']) || ($p['exp'] ?? 0) < time() - 1200) out(['ok' => false, 'error' => 'expired']);
    $secret = base64_decode((string)crm_dec($p['totp']));
    if (!crm_totp_ok($secret, (string)($d['totp'] ?? ''))) { usleep(600000); out(['ok' => false, 'error' => 'totp']); }
    crm_set('auth_pw', $p['pw']);
    crm_set('auth_totp', $p['totp']);
    crm_set('setup', null);
    crm_login_session();
    crm_tg("✅ <b>CRM налаштовано.</b> Вхід: пароль + код з Google Authenticator.");
    out(['ok' => true]);
  }

  /* ---------- вхід ---------- */
  if ($action === 'login') {
    if (!$configured) out(['ok' => false, 'error' => 'not_configured']);
    if (count(crm_fails()) >= 5) out(['ok' => false, 'error' => 'locked']);
    $secret = base64_decode((string)crm_dec((string)crm_get('auth_totp', '')));
    if (!password_verify((string)($d['password'] ?? ''), (string)crm_get('auth_pw')) || !crm_totp_ok($secret, (string)($d['totp'] ?? ''))) {
      crm_fail();
      out(['ok' => false, 'error' => count(crm_fails()) >= 5 ? 'locked' : 'wrong']);
    }
    crm_set('auth_fails', array_diff_key((array)crm_get('auth_fails', []), [crm_ip() => 1]));
    crm_login_session();
    out(['ok' => true]);
  }
  if ($action === 'logout') { crm_logout(); out(['ok' => true]); }

  if (!crm_authed()) out(['ok' => false, 'error' => 'auth', 'configured' => $configured], 401);

  /* ---------- дані ---------- */
  $state = function (): array {
    $db = crm_db();
    $clients = array_map('crm_client_row', $db->query('SELECT * FROM clients ORDER BY updated_at DESC')->fetchAll());
    $meetings = array_map('crm_meeting_row', $db->query('SELECT * FROM meetings ORDER BY start_at DESC')->fetchAll());
    $g = crm_get('google');
    return ['ok' => true, 'clients' => $clients, 'meetings' => $meetings, 'schedule' => crm_schedule(), 'tz' => CRM_TZ,
      'retention' => crm_ret_all(), 'retention_cols' => crm_ret_cols(),
      'vault' => ['meta' => crm_vault_meta(), 'rows' => crm_vault_meta() ? crm_vault_rows() : []],
      'google' => ['configured' => crm_google_configured(), 'on' => crm_google_on(), 'email' => is_array($g) ? (string)($g['email'] ?? '') : '',
        'error' => (string)crm_get('google_error', ''), 'redirect' => crm_site() . '/crm/google.php']];
  };
  if ($action === 'state') out($state());

  if ($action === 'client_save') {
    $id = (int)($d['id'] ?? 0) ?: null;
    $in = array_intersect_key((array)($d['client'] ?? []), CRM_CLIENT_FIELDS + ['status' => 1]);
    if (!$id && trim((string)($in['name'] ?? '')) === '') out(['ok' => false, 'error' => 'name']);
    $id = crm_client_save($id, $in);
    out(['ok' => true, 'id' => $id] + $state());
  }
  if ($action === 'client_delete') {
    $id = (int)($d['id'] ?? 0);
    /* майбутні зустрічі в Google теж скасовуються */
    $st = crm_db()->prepare('SELECT gcal_id FROM meetings WHERE client_id = ? AND gcal_id <> \'\' AND status = \'scheduled\' AND start_at > ?');
    $st->execute([$id, time()]);
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $gid) crm_google_cancel((string)$gid);
    crm_db()->prepare('DELETE FROM meetings WHERE client_id = ?')->execute([$id]);
    crm_db()->prepare('DELETE FROM clients WHERE id = ?')->execute([$id]);
    out($state());
  }

  if ($action === 'meeting_save') {
    $m = (array)($d['meeting'] ?? []);
    $id = (int)($m['id'] ?? 0);
    $tz = new DateTimeZone(CRM_TZ);
    $start = null;
    if (preg_match('/^\d{4}-\d\d-\d\d$/', (string)($m['date'] ?? '')) && preg_match('/^\d\d:\d\d$/', (string)($m['time'] ?? ''))) {
      $start = (new DateTimeImmutable($m['date'] . ' ' . $m['time'], $tz))->getTimestamp();
    }
    $minutes = max(10, min(240, (int)($m['minutes'] ?? crm_schedule()['minutes'])));
    $status = in_array($m['status'] ?? '', ['scheduled', 'done', 'cancelled', 'no_show'], true) ? $m['status'] : 'scheduled';
    $data = ['topic' => crm_clean($m['topic'] ?? '', 200), 'notes' => crm_clean($m['notes'] ?? '', 20000)];

    if ($id) {
      $st = crm_db()->prepare('SELECT * FROM meetings WHERE id = ?'); $st->execute([$id]);
      $row = $st->fetch();
      if (!$row) out(['ok' => false, 'error' => 'not_found']);
      $start = $start ?? (int)$row['start_at'];
      /* зміни часу й скасування — і в Google, з листом клієнту */
      if ($row['gcal_id'] !== '') {
        if ($status === 'cancelled' && $row['status'] !== 'cancelled') crm_google_cancel($row['gcal_id']);
        elseif ($status === 'scheduled' && ($start !== (int)$row['start_at'] || $minutes !== (int)$row['minutes']))
          crm_gcall('PATCH', 'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode(crm_google_calendar()) . '/events/' . rawurlencode($row['gcal_id']) . '?sendUpdates=all', [
            'start' => ['dateTime' => gmdate('c', $start), 'timeZone' => CRM_TZ], 'end' => ['dateTime' => gmdate('c', $start + $minutes * 60), 'timeZone' => CRM_TZ]]);
      }
      crm_db()->prepare('UPDATE meetings SET data = ?, start_at = ?, minutes = ?, status = ?, meet_url = ? WHERE id = ?')
        ->execute([crm_enc($data), $start, $minutes, $status, crm_clean($m['meet_url'] ?? $row['meet_url'], 300), $id]);
      out(['ok' => true, 'id' => $id] + $state());
    }

    if (!$start) out(['ok' => false, 'error' => 'time']);
    $clientId = (int)($m['client_id'] ?? 0) ?: null;
    if (!$clientId && trim((string)($m['new_client']['name'] ?? '')) !== '')
      $clientId = crm_client_save(null, array_intersect_key((array)$m['new_client'], CRM_CLIENT_FIELDS));
    $client = null;
    if ($clientId) { $st = crm_db()->prepare('SELECT * FROM clients WHERE id = ?'); $st->execute([$clientId]); $r = $st->fetch(); $client = $r ? crm_client_row($r) : null; }
    $meet = ''; $gid = ''; $warn = '';
    if (!empty($m['meet'])) {
      if (!crm_google_on()) $warn = 'google_off';
      else {
        $title = 'Deweb · ' . ($client['name'] ?? 'зустріч') . ($data['topic'] !== '' ? ' · ' . $data['topic'] : '');
        $ev = crm_google_event($start, $minutes, $title, $data['notes'], !empty($m['invite']) ? (string)($client['email'] ?? '') : '', (string)($client['name'] ?? ''));
        if ($ev) { $meet = $ev['meet']; $gid = $ev['id']; } else $warn = 'google_fail';
      }
    }
    $id = crm_meeting_add($clientId, $start, $minutes, $data, 'manual', $meet ?: crm_clean($m['meet_url'] ?? '', 300), $gid);
    out(['ok' => true, 'id' => $id, 'warn' => $warn] + $state());
  }
  if ($action === 'meeting_delete') {
    $st = crm_db()->prepare('SELECT * FROM meetings WHERE id = ?'); $st->execute([(int)($d['id'] ?? 0)]);
    $row = $st->fetch();
    if ($row && $row['gcal_id'] !== '' && $row['status'] === 'scheduled' && (int)$row['start_at'] > time()) crm_google_cancel($row['gcal_id']);
    crm_db()->prepare('DELETE FROM meetings WHERE id = ?')->execute([(int)($d['id'] ?? 0)]);
    out($state());
  }

  if ($action === 'schedule_save') {
    $s = (array)($d['schedule'] ?? []);
    crm_set('schedule', [
      'days' => array_values(array_unique(array_filter(array_map('intval', (array)($s['days'] ?? [])), fn($x) => $x >= 1 && $x <= 7))),
      'from' => (string)($s['from'] ?? ''), 'to' => (string)($s['to'] ?? ''), 'minutes' => (int)($s['minutes'] ?? 30),
      'notice' => (int)($s['notice'] ?? 12), 'horizon' => (int)($s['horizon'] ?? 14), 'buffer' => (int)($s['buffer'] ?? 15),
      'blocked' => array_slice((array)($s['blocked'] ?? []), 0, 200),
    ]);
    out($state());
  }
  /* ---------- утримання ---------- */
  if ($action === 'retention_save') {
    $id = (int)($d['id'] ?? 0) ?: null;
    $in = array_intersect_key((array)($d['row'] ?? []), array_flip(['client', 'contact', 'type', 'name', 'bought', 'renew', 'price', 'paid', 'note', 'x']));
    $cur = $id ? crm_ret_get($id) : null;
    if ($id && !$cur) out(['ok' => false, 'error' => 'not_found']);
    if (!$id && trim((string)($in['client'] ?? '')) === '') out(['ok' => false, 'error' => 'client']);
    try { $id = crm_ret_save($id, $in); } catch (InvalidArgumentException $e) { out(['ok' => false, 'error' => 'date']); }
    /* клієнт і контакт спільні для всіх послуг клієнта: перейменування — в усіх його рядках */
    $group = array_intersect_key($in, ['client' => 1, 'contact' => 1]);
    $old = $cur ? $cur['client'] : (string)($in['client'] ?? '');
    if ($group && $old !== '')
      foreach (crm_ret_all() as $r) if ($r['id'] !== $id && $r['client'] === $old) crm_ret_save($r['id'], $group);
    out(['ok' => true, 'id' => $id] + $state());
  }
  if ($action === 'retention_delete') {
    crm_db_retention()->prepare('DELETE FROM retention WHERE id = ?')->execute([(int)($d['id'] ?? 0)]);
    out($state());
  }
  if ($action === 'retention_import') {
    $rows = array_slice((array)($d['rows'] ?? []), 0, 500);
    $n = 0;
    crm_db_retention()->beginTransaction();
    foreach ($rows as $row) {
      $row = array_intersect_key((array)$row, array_flip(['client', 'contact', 'type', 'name', 'bought', 'renew', 'price', 'paid', 'note']));
      foreach (['bought', 'renew'] as $k) if (isset($row[$k]) && crm_ret_date($row[$k]) === null) $row[$k] = '';
      if (trim((string)($row['client'] ?? '')) === '') continue;
      crm_ret_save(null, $row); $n++;
    }
    crm_db_retention()->commit();
    out(['ok' => true, 'imported' => $n] + $state());
  }
  if ($action === 'retention_cols') {
    $cols = array_slice((array)($d['cols'] ?? []), 0, 40);
    crm_set('retention_cols', array_map(fn($c) => ['key' => (string)($c['key'] ?? ''), 'label' => (string)($c['label'] ?? ''), 'on' => !empty($c['on'])], $cols));
    out($state());
  }
  if ($action === 'retention_remind') out(['ok' => true, 'remind' => crm_ret_remind()] + $state());

  /* ---------- сейф доступів: сервер бачить лише зашифровані блоки ---------- */
  if ($action === 'vault_setup') {
    if (crm_vault_meta()) out(['ok' => false, 'error' => 'exists']);
    $m = (array)($d['meta'] ?? []);
    $salt = (string)($m['salt'] ?? ''); $iter = (int)($m['iter'] ?? 0); $check = crm_vault_blob($m['check'] ?? '');
    if (!preg_match('/^[A-Za-z0-9+\/=]{20,64}$/', $salt) || $iter < 200000 || $iter > 5000000 || !$check) out(['ok' => false, 'error' => 'meta']);
    crm_set('vault_meta', ['salt' => $salt, 'iter' => $iter, 'check' => $check, 'created' => time()]);
    crm_tg("🔐 <b>CRM: створено сейф доступів.</b> Майстер-пароль зберігається тільки в тебе, відновити його неможливо.");
    out($state());
  }
  if (in_array($action, ['vault_save', 'vault_delete', 'vault_import', 'vault_rekey'], true) && !crm_vault_meta()) out(['ok' => false, 'error' => 'no_vault']);
  if ($action === 'vault_save') {
    $blob = crm_vault_blob($d['data'] ?? '');
    if (!$blob) out(['ok' => false, 'error' => 'data']);
    $id = (int)($d['id'] ?? 0);
    if ($id) crm_db_vault()->prepare('UPDATE vault SET data = ?, updated_at = ? WHERE id = ?')->execute([crm_enc($blob), time(), $id]);
    else { crm_db_vault()->prepare('INSERT INTO vault (data, updated_at) VALUES (?, ?)')->execute([crm_enc($blob), time()]); $id = (int)crm_db_vault()->lastInsertId(); }
    out(['ok' => true, 'id' => $id] + $state());
  }
  if ($action === 'vault_delete') {
    crm_db_vault()->prepare('DELETE FROM vault WHERE id = ?')->execute([(int)($d['id'] ?? 0)]);
    out($state());
  }
  if ($action === 'vault_import') {
    $blobs = array_map('crm_vault_blob', array_slice((array)($d['rows'] ?? []), 0, 1000));
    if (in_array(null, $blobs, true)) out(['ok' => false, 'error' => 'data']);
    $db = crm_db_vault(); $db->beginTransaction();
    foreach ($blobs as $b) $db->prepare('INSERT INTO vault (data, updated_at) VALUES (?, ?)')->execute([crm_enc($b), time()]);
    $db->commit();
    out(['ok' => true, 'imported' => count($blobs)] + $state());
  }
  /* зміна майстер-пароля: браузер перешифровує все і надсилає разом із новою сіллю */
  if ($action === 'vault_rekey') {
    $m = (array)($d['meta'] ?? []);
    $salt = (string)($m['salt'] ?? ''); $iter = (int)($m['iter'] ?? 0); $check = crm_vault_blob($m['check'] ?? '');
    if (!preg_match('/^[A-Za-z0-9+\/=]{20,64}$/', $salt) || $iter < 200000 || $iter > 5000000 || !$check) out(['ok' => false, 'error' => 'meta']);
    $rows = (array)($d['rows'] ?? []);
    $ids = array_map(fn($r) => (int)$r['id'], crm_vault_rows());
    $new = [];
    foreach ($rows as $r) { $b = crm_vault_blob($r['data'] ?? ''); if (!$b) out(['ok' => false, 'error' => 'data']); $new[(int)($r['id'] ?? 0)] = $b; }
    sort($ids); $got = array_keys($new); sort($got);
    if ($ids !== $got) out(['ok' => false, 'error' => 'changed']); // хтось змінив сейф паралельно — спершу онови сторінку
    $db = crm_db_vault(); $db->beginTransaction();
    foreach ($new as $id => $b) $db->prepare('UPDATE vault SET data = ?, updated_at = ? WHERE id = ?')->execute([crm_enc($b), time(), $id]);
    crm_set('vault_meta', ['salt' => $salt, 'iter' => $iter, 'check' => $check, 'created' => (int)(crm_vault_meta()['created'] ?? time())]);
    $db->commit();
    crm_tg("🔐 <b>CRM: майстер-пароль сейфа змінено.</b>");
    out($state());
  }
  /* забутий майстер-пароль: дані не відновити, можна лише стерти сейф і почати заново */
  if ($action === 'vault_reset') {
    if (($d['confirm'] ?? '') !== 'СТЕРТИ') out(['ok' => false, 'error' => 'confirm']);
    crm_db_vault()->exec('DELETE FROM vault');
    crm_set('vault_meta', null);
    crm_tg("⚠️ <b>CRM: сейф доступів стерто</b> (усі записи видалено).\nIP: <code>" . crm_esc(crm_ip()) . '</code>');
    out($state());
  }

  if ($action === 'google_disconnect') {
    crm_set('google', null); crm_set('google_access', null); crm_set('google_error', null);
    out($state());
  }

  out(['ok' => false, 'error' => 'action'], 400);
} catch (Throwable $e) {
  error_log('deweb crm: ' . $e->getMessage());
  out(['ok' => false, 'error' => 'server'], 500);
}
