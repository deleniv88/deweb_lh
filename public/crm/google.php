<?php
/* Підключення Google Календаря до CRM: кнопка в налаштуваннях → згода Google → повернення сюди.
   Зберігаємо лише refresh token (зашифрований) і email акаунта. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
ini_set('display_errors', '0');
header('Cache-Control: no-store');

function back(string $result): void { header('Location: /crm/#settings?google=' . $result, true, 303); exit; }

if (!crm_authed()) { header('Location: /crm/', true, 303); exit; }
if (!crm_google_configured()) back('not_configured');
$redirect = crm_site() . '/crm/google.php';

if (isset($_GET['start'])) {
  $state = bin2hex(random_bytes(16));
  crm_set('google_state', ['s' => hash('sha256', $state), 'exp' => time() + 600]);
  header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
    'client_id' => crm_cfg('GOOGLE_CLIENT_ID'), 'redirect_uri' => $redirect, 'response_type' => 'code',
    'scope' => CRM_GOOGLE_SCOPES, 'access_type' => 'offline', 'prompt' => 'consent', 'include_granted_scopes' => 'true', 'state' => $state,
  ]), true, 303);
  exit;
}

$st = (array)crm_get('google_state', []);
crm_set('google_state', null);
if (empty($st['s']) || ($st['exp'] ?? 0) < time() || !hash_equals($st['s'], hash('sha256', (string)($_GET['state'] ?? '')))) back('state');
if (!empty($_GET['error']) || empty($_GET['code'])) back('denied');

[$code, $res] = crm_http('POST', 'https://oauth2.googleapis.com/token', http_build_query([
  'code' => (string)$_GET['code'], 'client_id' => crm_cfg('GOOGLE_CLIENT_ID'), 'client_secret' => crm_cfg('GOOGLE_CLIENT_SECRET'),
  'redirect_uri' => $redirect, 'grant_type' => 'authorization_code']));
$r = json_decode($res, true);
if ($code !== 200 || empty($r['refresh_token'])) { error_log("deweb crm: google oauth $code " . substr($res, 0, 200)); back('fail'); }
$scopes = explode(' ', (string)($r['scope'] ?? ''));
if (!in_array('https://www.googleapis.com/auth/calendar.events', $scopes, true)) back('scope');

/* email акаунта з id_token (отриманого напряму від Google по HTTPS) */
$email = '';
if (!empty($r['id_token'])) {
  $p = json_decode(base64_decode(strtr(explode('.', $r['id_token'])[1] ?? '', '-_', '+/')), true);
  $email = (string)($p['email'] ?? '');
}
crm_set('google', ['refresh' => crm_enc($r['refresh_token']), 'email' => $email, 'at' => time()]);
crm_set('google_access', ['t' => crm_enc($r['access_token']), 'exp' => time() + (int)($r['expires_in'] ?? 3000)]);
crm_set('google_error', null);
crm_tg('📅 <b>CRM: Google Календар підключено</b>' . ($email !== '' ? ' (' . crm_esc($email) . ')' : '') . '. Агент на сайті тепер бронює дзвінки з Google Meet.');
back('ok');
