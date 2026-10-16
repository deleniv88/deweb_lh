<?php
/* =========================================================
   Перевірка будь-якого сайту за адресою (сторінка /audyt/, /en/audit/, /ua/audyt/).
   POST {action:"scan", url, lang, turnstile, t, company} → швидкі перевірки, звіт у stats/data/audit/<id>.json
   POST {action:"speed", id}                               → PageSpeed (довго), дописує у звіт
   POST {action:"unlock", id, way, contact, lang}          → контакт → повний звіт, CRM, Telegram
   GET  ?id=…                                              → звіт за посиланням
   Без контакту віддаємо лише першу групу пунктів повністю, решту — тільки статуси.
   Захист: Turnstile, ліміти з IP, дозволені лише публічні адреси (жодних запитів у внутрішню мережу).
   ========================================================= */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
ob_start();

require_once __DIR__ . '/_ip.php';
require_once __DIR__ . '/events.php';

const AU_FREE = ['domain'];
const AU_HOSTED = ['wix', 'tilda', 'shopify', 'squarespace', 'webflow', 'framer'];
/* вага пунктів в оцінці: 3 — критичні, 1 — дрібниці */
const AU_W = [
  'https' => 3, 'redir' => 2, 'www' => 1, '404' => 1,
  'robots' => 3, 'sitemap' => 2, 'noindex' => 3, 'canon' => 1,
  'title' => 2, 'desc' => 2, 'og' => 2, 'fav' => 1, 'viewport' => 2, 'lang' => 1,
  'h1' => 1, 'alt' => 1, 'schema' => 1, 'links' => 2, 'text' => 1,
  'psi_m' => 3, 'psi_d' => 1, 'img' => 2, 'gzip' => 1,
  'files' => 3, 'cms' => 2, 'users' => 2, 'xmlrpc' => 1, 'list' => 2, 'heads' => 1, 'mixed' => 1,
  'priv' => 2, 'cookie' => 1, 'ga' => 1, 'captcha' => 1,
];
/* на конструкторах це налаштовує платформа, власник змінити не може */
const AU_SERVER = ['redir', 'gzip', 'files', 'list', 'heads'];

function au_out(int $code, array $data): void {
  while (ob_get_level()) ob_end_clean();
  http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}
function au_cfg(string $k): string {
  static $cfg = null;
  if ($cfg === null) { $f = __DIR__ . '/config.php'; $cfg = is_file($f) ? (include $f) : []; if (!is_array($cfg)) $cfg = []; }
  return trim((string)($cfg[$k] ?? ''));
}
function au_clean($v, int $max): string {
  $s = preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string)($v ?? '')) ?? '';
  return mb_substr(trim($s), 0, $max);
}
function au_esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

/* ---------- сховище звітів (stats/data — закрита від браузера) ---------- */
function au_dir(): string {
  $d = dirname(dw_events_file()) . '/audit';
  if (!is_dir($d)) @mkdir($d, 0755, true);
  return $d;
}
function au_load(string $id): ?array {
  if (!preg_match('/^[a-z0-9]{10}$/', $id)) return null;
  $f = au_dir() . "/$id.json";
  $j = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
  return is_array($j) ? $j : null;
}
function au_save(array $r): void { @file_put_contents(au_dir() . '/' . $r['id'] . '.json', json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX); }
/* короткий журнал для /stats: останні 500 перевірок */
function au_log(array $r): void {
  $f = dirname(dw_events_file()) . '/audits.json';
  $fp = @fopen($f, 'c+'); if (!$fp) return;
  flock($fp, LOCK_EX);
  $j = json_decode((string)stream_get_contents($fp), true); if (!is_array($j)) $j = [];
  $row = ['id' => $r['id'], 't' => $r['created'], 'host' => $r['host'], 'plat' => $r['platform']['name'], 'score' => $r['score'],
    'lang' => $r['lang'], 'contact' => $r['contact'] ? $r['contact']['label'] : '', 'bad' => $r['counts']['bad'], 'warn' => $r['counts']['warn']];
  $j = array_values(array_filter($j, fn($x) => ($x['id'] ?? '') !== $r['id']));
  array_unshift($j, $row);
  $j = array_slice($j, 0, 500);
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($j, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  fflush($fp); flock($fp, LOCK_UN); fclose($fp);
}

/* ---------- ліміти ---------- */
function au_hits(string $key, int $window): array {
  $f = au_dir() . '/_hit_' . md5($key);
  return array_values(array_filter(is_file($f) ? (array)json_decode((string)file_get_contents($f), true) : [], fn($t) => $t > time() - $window));
}
function au_hit(string $key, int $window): int {
  $h = au_hits($key, $window); $h[] = time();
  @file_put_contents(au_dir() . '/_hit_' . md5($key), json_encode($h));
  return count($h);
}

/* ---------- безпечні HTTP-запити ---------- */
const AU_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 DewebSiteCheck/1.0';

function au_public_ip(string $ip): bool {
  if (defined('AU_TEST')) return true;
  if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
  foreach (['100.64.0.0/10', '192.0.0.0/24', '198.18.0.0/15', '0.0.0.0/8'] as $n) if (dw_ip_in($ip, $n)) return false;
  return true;
}
/* IP хоста: null — не існує, false — внутрішня адреса */
function au_resolve(string $host) {
  static $cache = [];
  if (array_key_exists($host, $cache)) return $cache[$host];
  if (defined('AU_TEST')) return $cache[$host] = preg_match('~\.test$~', $host) && !str_starts_with($host, 'nodns') && !str_starts_with($host, 'www.nowww') ? '127.0.0.1' : null;
  if (filter_var($host, FILTER_VALIDATE_IP)) return $cache[$host] = au_public_ip($host) ? $host : false;
  $ips = @gethostbynamel($host . '.');
  if (!$ips) return $cache[$host] = null;
  foreach ($ips as $ip) if (!au_public_ip($ip)) return $cache[$host] = false;
  return $cache[$host] = $ips[0];
}
function au_abs(string $base, string $rel): ?string {
  $rel = trim(html_entity_decode($rel, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
  if ($rel === '' || preg_match('~^(mailto|tel|javascript|data|sms|whatsapp|viber|skype):~i', $rel) || $rel[0] === '#') return null;
  if (preg_match('~^https?://~i', $rel)) return $rel;
  $b = parse_url($base); if (!$b || empty($b['host'])) return null;
  $root = $b['scheme'] . '://' . $b['host'] . (isset($b['port']) ? ':' . $b['port'] : '');
  if (str_starts_with($rel, '//')) return $b['scheme'] . ':' . $rel;
  if ($rel[0] === '/') return $root . $rel;
  $path = preg_replace('~/[^/]*$~', '/', $b['path'] ?? '/');
  return $root . $path . $rel;
}

/* кілька запитів паралельно. $reqs: [key => ['url'=>…, 'head'=>bool, 'max'=>байт, 'timeout'=>с, 'post'=>рядок]] */
function au_multi(array $reqs): array {
  $mh = curl_multi_init(); $hs = []; $out = [];
  foreach ($reqs as $k => $q) {
    $u = parse_url((string)$q['url']);
    $scheme = strtolower($u['scheme'] ?? ''); $host = strtolower($u['host'] ?? '');
    $port = $u['port'] ?? ($scheme === 'https' ? 443 : 80);
    $out[$k] = ['url' => $q['url'], 'code' => 0, 'h' => [], 'body' => '', 'err' => '', 'ssl' => false, 'time' => 0.0, 'size' => 0];
    if (!in_array($scheme, ['http', 'https'], true) || $host === '' || !in_array((int)$port, [80, 443], true)) { $out[$k]['err'] = 'blocked'; continue; }
    if (defined('AU_TEST') && !preg_match('~\.test$~', $host)) { $out[$k]['err'] = 'net'; continue; }
    $ip = au_resolve($host);
    if ($ip === null) { $out[$k]['err'] = 'dns'; continue; }
    if ($ip === false) { $out[$k]['err'] = 'blocked'; continue; }
    $ch = curl_init((string)$q['url']);
    $max = (int)($q['max'] ?? 1500000);
    $state = ['h' => [], 'body' => '', 'max' => $max];
    $hs[$k] = ['ch' => $ch, 'st' => &$state];
    curl_setopt_array($ch, [
      CURLOPT_RESOLVE => ["$host:$port:$ip"],
      CURLOPT_FOLLOWLOCATION => false,
      CURLOPT_PROXY => '', CURLOPT_NOPROXY => '*',
      CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
      CURLOPT_CONNECTTIMEOUT => 5,
      CURLOPT_TIMEOUT => (int)($q['timeout'] ?? 9),
      CURLOPT_USERAGENT => AU_UA,
      CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language: pl,en;q=0.8,uk;q=0.6'],
      CURLOPT_ENCODING => '',
      CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
      CURLOPT_NOBODY => !empty($q['head']),
      CURLOPT_HEADERFUNCTION => function ($c, $line) use (&$state) {
        $l = trim($line);
        if (preg_match('~^HTTP/~i', $l)) $state['h'] = [];
        elseif (strpos($l, ':') !== false) { [$n, $v] = explode(':', $l, 2); $state['h'][strtolower(trim($n))][] = trim($v); }
        return strlen($line);
      },
      CURLOPT_WRITEFUNCTION => function ($c, $data) use (&$state) {
        $state['body'] .= $data;
        return strlen($state['body']) > $state['max'] ? 0 : strlen($data);
      },
    ]);
    /* лише для локальних тестів (константу задає тестовий роутер, на сайті її немає) */
    if (defined('AU_TEST')) curl_setopt_array($ch, [CURLOPT_CONNECT_TO => ["$host:443:127.0.0.1:" . AU_TEST[0], "$host:80:127.0.0.1:" . AU_TEST[1]], CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0]);
    if (isset($q['post'])) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, (string)$q['post']); }
    curl_multi_add_handle($mh, $ch);
    unset($state);
  }
  do { $st = curl_multi_exec($mh, $running); if ($running) curl_multi_select($mh, 1.0); } while ($running && $st === CURLM_OK);
  foreach ($hs as $k => $x) {
    $ch = $x['ch'];
    $errno = curl_errno($ch);
    $out[$k]['code'] = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $out[$k]['time'] = (float)curl_getinfo($ch, CURLINFO_TOTAL_TIME);
    $out[$k]['h'] = $x['st']['h'];
    $out[$k]['body'] = $x['st']['body'];
    $out[$k]['size'] = (int)curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD);
    if ($errno && $errno !== CURLE_WRITE_ERROR) {
      $out[$k]['err'] = in_array($errno, [35, 51, 53, 54, 58, 59, 60, 64, 66, 77, 80, 82, 83, 90, 91], true) ? 'ssl' : ($errno === CURLE_OPERATION_TIMEDOUT ? 'timeout' : 'net');
      $out[$k]['ssl'] = $out[$k]['err'] === 'ssl';
    }
    curl_multi_remove_handle($mh, $ch);
  }
  curl_multi_close($mh);
  return $out;
}
function au_get(string $url, array $o = []): array { return au_multi(['x' => ['url' => $url] + $o])['x']; }
function au_hdr(array $r, string $name): string { return (string)(($r['h'][$name] ?? [''])[count($r['h'][$name] ?? ['']) - 1]); }
/* перенаправлення по кроках: кожен крок знову перевіряє, що адреса публічна */
function au_follow(string $url, int $hops = 6): array {
  $chain = [];
  for ($i = 0; $i <= $hops; $i++) {
    $r = au_get($url);
    $chain[] = ['url' => $url, 'code' => $r['code']];
    $loc = au_hdr($r, 'location');
    if ($r['code'] >= 300 && $r['code'] < 400 && $loc !== '') { $next = au_abs($url, $loc); if (!$next) break; $url = $next; continue; }
    return ['r' => $r, 'chain' => $chain, 'final' => $url];
  }
  return ['r' => $r ?? ['code' => 0, 'err' => 'loop', 'h' => [], 'body' => ''], 'chain' => $chain, 'final' => $url];
}

/* ---------- HTML ---------- */
function au_dom(string $html): DOMXPath {
  $d = new DOMDocument();
  libxml_use_internal_errors(true);
  @$d->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOWARNING | LIBXML_NOERROR | LIBXML_NONET);
  libxml_clear_errors();
  return new DOMXPath($d);
}
function au_meta(DOMXPath $x, string $attr, string $name): string {
  foreach ($x->query('//meta[@' . $attr . ']') as $m) if (strtolower(trim($m->getAttribute($attr))) === $name) return trim($m->getAttribute('content'));
  return '';
}

/* ---------- платформа і хостинг ---------- */
function au_platform(string $html, array $h, string $host, ?string $ip): array {
  $gen = '';
  if (preg_match('~<meta[^>]+name=["\']generator["\'][^>]*content=["\']([^"\']+)~i', $html, $m) || preg_match('~<meta[^>]+content=["\']([^"\']+)["\'][^>]*name=["\']generator~i', $html, $m)) $gen = trim($m[1]);
  $hs = strtolower(json_encode($h));
  $id = 'custom'; $name = ''; $ver = '';
  if (preg_match('~/wp-content/|/wp-includes/|wp-json~i', $html) || stripos($gen, 'wordpress') !== false) {
    $id = 'wp'; $name = 'WordPress';
    if (preg_match('~WordPress\s*([\d.]+)~i', $gen, $m)) $ver = $m[1];
    elseif (preg_match('~wp-(?:emoji-release|embed)\.min\.js\?ver=([\d.]+)~', $html, $m)) $ver = $m[1];
    if (stripos($html, 'woocommerce') !== false) $name = 'WordPress + WooCommerce';
    if (stripos($html, 'elementor') !== false) $name .= ' (Elementor)';
  }
  elseif (str_contains($hs, 'x-wix-request-id') || stripos($html, 'static.wixstatic.com') !== false || stripos($gen, 'wix.com') !== false) { $id = 'wix'; $name = 'Wix'; }
  elseif (stripos($html, 'tildacdn.com') !== false || stripos($html, 'tilda.ws') !== false) { $id = 'tilda'; $name = 'Tilda'; }
  elseif (stripos($html, 'cdn.shopify.com') !== false || str_contains($hs, 'x-shopid')) { $id = 'shopify'; $name = 'Shopify'; }
  elseif (stripos($html, 'squarespace.com') !== false) { $id = 'squarespace'; $name = 'Squarespace'; }
  elseif (stripos($html, 'data-wf-site') !== false || stripos($html, 'webflow') !== false) { $id = 'webflow'; $name = 'Webflow'; }
  elseif (stripos($html, 'framerusercontent.com') !== false || stripos($gen, 'framer') !== false) { $id = 'framer'; $name = 'Framer'; }
  elseif (stripos($gen, 'joomla') !== false) { $id = 'cms'; $name = 'Joomla'; }
  elseif (stripos($gen, 'drupal') !== false || str_contains($hs, 'x-drupal')) { $id = 'cms'; $name = 'Drupal'; }
  elseif (stripos($html, 'prestashop') !== false) { $id = 'cms'; $name = 'PrestaShop'; }
  elseif (stripos($html, '/_next/static') !== false) { $name = 'Next.js'; }
  elseif (stripos($html, '/_nuxt/') !== false) { $name = 'Nuxt'; }
  elseif (stripos($gen, 'astro') !== false) { $name = 'Astro'; }
  elseif (stripos($gen, 'gatsby') !== false) { $name = 'Gatsby'; }
  elseif (stripos($html, 'data-reactroot') !== false || stripos($html, 'id="root"') !== false) { $name = 'React'; }
  if ($id === 'cms' && preg_match('~([\d.]{3,})~', $gen, $m)) $ver = $m[1];

  /* хостинг */
  $srv = strtolower(au_hdr(['h' => $h], 'server'));
  $hosting = '';
  if (isset($h['cf-ray'])) $hosting = 'Cloudflare';
  if (isset($h['x-vercel-id'])) $hosting = 'Vercel';
  elseif (isset($h['x-nf-request-id'])) $hosting = 'Netlify';
  elseif (str_contains($srv, 'github.com')) $hosting = 'GitHub Pages';
  if (in_array($id, AU_HOSTED, true)) $hosting = $name;
  if ($hosting === '' || $hosting === 'Cloudflare') {
    $rdns = $ip ? strtolower((string)@gethostbyaddr($ip)) : '';
    $known = ['home.pl' => 'home.pl', 'lh.pl' => 'LH.pl', 'cyberfolks' => 'cyber_Folks', 'cyber-folks' => 'cyber_Folks', 'ovh' => 'OVH', 'hostinger' => 'Hostinger',
      'nazwa.pl' => 'nazwa.pl', 'zenbox' => 'Zenbox', 'dhosting' => 'dhosting', 'hetzner' => 'Hetzner', 'amazonaws' => 'AWS', 'googleusercontent' => 'Google Cloud',
      'digitalocean' => 'DigitalOcean', 'ukraine.com.ua' => 'Хостинг Україна', 'hostpro' => 'HostPro', 'ionos' => 'IONOS', 'linode' => 'Akamai Linode',
      'webd.pl' => 'webd.pl', 'superhost' => 'SuperHost', 'kei.pl' => 'Kei.pl', 'atthost' => 'Atthost', 'hostgator' => 'HostGator', 'bluehost' => 'Bluehost', 'siteground' => 'SiteGround'];
    foreach ($known as $k => $v) if ($rdns !== '' && str_contains($rdns, $k)) { $hosting = $hosting === 'Cloudflare' ? "Cloudflare → $v" : $v; break; }
  }
  if ($hosting === '') $hosting = $srv !== '' ? (str_contains($srv, 'litespeed') ? 'LiteSpeed' : (str_contains($srv, 'nginx') ? 'nginx' : (str_contains($srv, 'apache') ? 'Apache' : ''))) : '';
  return ['id' => $id, 'name' => $name !== '' ? $name : 'custom', 'ver' => $ver, 'host' => $hosting];
}

/* ---------- сама перевірка ---------- */
function au_scan(string $host): array {
  $items = [];
  $add = function (string $id, string $g, string $s, array $p = []) use (&$items) { $items[] = ['id' => $id, 'g' => $g, 's' => $s, 'p' => (object)$p]; };

  /* головна по https */
  $main = au_follow("https://$host/");
  $r = $main['r'];
  $httpsOk = $r['code'] >= 200 && $r['code'] < 400 && !$r['err'];
  if (!$httpsOk) {
    $alt = au_follow("http://$host/");
    if ($alt['r']['code'] >= 200 && $alt['r']['code'] < 300) { $main = $alt; $r = $alt['r']; }
    elseif ($r['err'] === 'dns' || ($r['code'] === 0 && $alt['r']['code'] === 0)) return ['error' => $r['err'] === 'dns' ? 'dns' : 'unreachable'];
  }
  if ($r['code'] >= 400 || $r['code'] === 0) return ['error' => 'status', 'code' => $r['code']];
  $final = $main['final'];
  $fu = parse_url($final);
  $fhost = strtolower($fu['host'] ?? $host);
  $root = ($fu['scheme'] ?? 'https') . '://' . $fhost;
  $html = (string)$r['body'];
  $h = $r['h'];
  $x = au_dom($html);
  $plat = au_platform($html, $h, $fhost, is_string(au_resolve($fhost)) ? au_resolve($fhost) : null);
  $isWp = $plat['id'] === 'wp';

  /* ---- Домен і HTTPS ---- */
  $cert = null;
  if ($httpsOk) {
    $ctx = stream_context_create(['ssl' => ['capture_peer_cert' => true, 'verify_peer' => false, 'verify_peer_name' => false, 'SNI_enabled' => true, 'peer_name' => $fhost]]);
    $ip = au_resolve($fhost);
    if (!defined('AU_TEST') && is_string($ip) && ($sock = @stream_socket_client("ssl://$ip:443", $en, $es, 5, STREAM_CLIENT_CONNECT, $ctx))) {
      $pc = stream_context_get_params($sock)['options']['ssl']['peer_certificate'] ?? null;
      if ($pc) { $ci = openssl_x509_parse($pc); if ($ci) $cert = (int)$ci['validTo_time_t']; }
      fclose($sock);
    }
  }
  $add('https', 'domain', $httpsOk ? ($cert && $cert < time() + 14 * 86400 ? 'warn' : 'ok') : 'bad',
    ['until' => $cert ? date('Y-m-d', $cert) : '', 'err' => $httpsOk ? '' : ($r['err'] ?: 'nossl')]);

  $alts = au_multi([
    'http' => ['url' => "http://$fhost/", 'max' => 2000],
    'www' => ['url' => 'https://' . (str_starts_with($fhost, 'www.') ? substr($fhost, 4) : "www.$fhost") . '/', 'max' => 2000],
    '404' => ['url' => "$root/deweb-check-" . bin2hex(random_bytes(4)) . '/', 'max' => 300000],
    'robots' => ['url' => "$root/robots.txt", 'max' => 200000],
    'fav' => ['url' => "$root/favicon.ico", 'head' => true],
  ]);
  $hr = $alts['http']; $loc = au_hdr($hr, 'location');
  if (!$httpsOk) $add('redir', 'domain', 'bad', ['code' => $hr['code']]);
  elseif ($hr['code'] === 0) $add('redir', 'domain', 'ok', ['code' => 0]);
  elseif (in_array($hr['code'], [301, 308], true) && str_starts_with(strtolower($loc), 'https://')) $add('redir', 'domain', 'ok', ['code' => $hr['code']]);
  elseif ($hr['code'] >= 300 && $hr['code'] < 400 && str_starts_with(strtolower($loc), 'https://')) $add('redir', 'domain', 'warn', ['code' => $hr['code']]);
  else $add('redir', 'domain', 'bad', ['code' => $hr['code']]);

  $wr = $alts['www']; $wl = strtolower(au_hdr($wr, 'location'));
  $other = str_starts_with($fhost, 'www.') ? substr($fhost, 4) : "www.$fhost";
  if ($wr['err'] === 'dns' || $wr['code'] === 0) $add('www', 'domain', 'ok', ['alt' => $other, 'nodns' => 1]);
  elseif ($wr['code'] >= 300 && $wr['code'] < 400 && str_contains($wl, "//$fhost")) $add('www', 'domain', $wr['code'] === 301 || $wr['code'] === 308 ? 'ok' : 'warn', ['alt' => $other, 'code' => $wr['code']]);
  else $add('www', 'domain', 'warn', ['alt' => $other, 'code' => $wr['code']]);

  $nf = $alts['404'];
  $add('404', 'domain', in_array($nf['code'], [404, 410], true) ? 'ok' : 'warn', ['code' => $nf['code']]);

  /* ---- Видимість у Google ---- */
  $rb = $alts['robots']; $rtxt = $rb['code'] === 200 && stripos(au_hdr($rb, 'content-type'), 'html') === false ? (string)$rb['body'] : '';
  $sitemaps = []; $blockAll = false;
  if ($rtxt !== '') {
    preg_match_all('~^\s*sitemap:\s*(\S+)~im', $rtxt, $m); $sitemaps = $m[1];
    /* група User-agent: * з «Disallow: /» */
    $groups = preg_split('~(?=^\s*user-agent:)~im', $rtxt);
    foreach ($groups as $gtxt) if (preg_match('~^\s*user-agent:\s*\*\s*$~im', $gtxt) && preg_match('~^\s*disallow:\s*/\s*$~im', $gtxt) && !preg_match('~^\s*allow:\s*/\s*$~im', $gtxt)) $blockAll = true;
  }
  $add('robots', 'google', $blockAll ? 'bad' : ($rtxt === '' ? 'warn' : 'ok'), ['found' => $rtxt !== '' ? 1 : 0, 'sitemap' => $sitemaps ? 1 : 0]);

  $smCand = array_slice(array_unique(array_merge($sitemaps, ["$root/sitemap.xml", "$root/sitemap_index.xml", "$root/wp-sitemap.xml"])), 0, 4);
  $sm = au_multi(array_map(fn($u) => ['url' => $u, 'max' => 3000000], $smCand));
  $smOk = null;
  foreach ($smCand as $i => $u) {
    $s = $sm[$i];
    if ($s['code'] === 200 && preg_match('~<(urlset|sitemapindex)~i', (string)$s['body'])) { $smOk = ['url' => $u, 'n' => preg_match_all('~<loc>~i', (string)$s['body']), 'index' => (int)(stripos((string)$s['body'], '<sitemapindex') !== false)]; break; }
  }
  $add('sitemap', 'google', $smOk ? 'ok' : 'warn', $smOk ?: []);

  $mr = strtolower(au_meta($x, 'name', 'robots') . ' ' . au_meta($x, 'name', 'googlebot') . ' ' . implode(' ', $h['x-robots-tag'] ?? []));
  $add('noindex', 'google', str_contains($mr, 'noindex') ? 'bad' : 'ok');

  $canon = '';
  foreach ($x->query('//link[@rel]') as $l) if (strtolower(trim($l->getAttribute('rel'))) === 'canonical') { $canon = trim($l->getAttribute('href')); break; }
  $cHost = $canon !== '' ? strtolower((string)parse_url((string)au_abs($final, $canon), PHP_URL_HOST)) : '';
  $add('canon', 'google', $canon === '' ? 'warn' : ($cHost !== '' && $cHost !== $fhost ? 'warn' : 'ok'), ['url' => mb_substr($canon, 0, 200), 'other' => $cHost !== '' && $cHost !== $fhost ? 1 : 0]);

  /* ---- Назви й прев'ю ---- */
  $title = trim(preg_replace('~\s+~u', ' ', (string)($x->query('//title')->item(0)->textContent ?? '')));
  $tl = mb_strlen($title);
  $add('title', 'preview', $tl === 0 ? 'bad' : ($tl < 15 || $tl > 65 ? 'warn' : 'ok'), ['text' => mb_substr($title, 0, 120), 'len' => $tl]);
  $desc = au_meta($x, 'name', 'description'); $dl = mb_strlen($desc);
  $add('desc', 'preview', $dl === 0 ? 'bad' : ($dl < 50 || $dl > 170 ? 'warn' : 'ok'), ['text' => mb_substr($desc, 0, 200), 'len' => $dl]);
  $ogImg = au_meta($x, 'property', 'og:image') ?: au_meta($x, 'name', 'og:image') ?: au_meta($x, 'name', 'twitter:image');
  $ogT = au_meta($x, 'property', 'og:title') !== '';
  $ogInfo = ['img' => $ogImg !== '' ? 1 : 0, 'title' => $ogT ? 1 : 0];
  if ($ogImg !== '' && ($ogAbs = au_abs($final, $ogImg))) {
    $oi = au_get($ogAbs, ['max' => 6000000, 'timeout' => 8]);
    $ogInfo['ok'] = $oi['code'] === 200 ? 1 : 0;
    $ogInfo['kb'] = (int)round(strlen((string)$oi['body']) / 1024);
    if ($oi['code'] === 200 && function_exists('getimagesizefromstring') && ($sz = @getimagesizefromstring((string)$oi['body']))) { $ogInfo['w'] = $sz[0]; $ogInfo['h'] = $sz[1]; }
  }
  $ogS = !$ogInfo['img'] ? 'bad' : (empty($ogInfo['ok']) || ($ogInfo['kb'] ?? 0) > 600 || (($ogInfo['w'] ?? 1200) < 600) ? 'warn' : 'ok');
  $add('og', 'preview', $ogS, $ogInfo);

  $icon = false; $apple = false;
  foreach ($x->query('//link[@rel]') as $l) { $rel = strtolower($l->getAttribute('rel')); if (str_contains($rel, 'icon')) $icon = true; if (str_contains($rel, 'apple-touch-icon')) $apple = true; }
  if (!$icon && $alts['fav']['code'] === 200) $icon = true;
  $add('fav', 'preview', $icon ? ($apple ? 'ok' : 'warn') : 'bad', ['apple' => $apple ? 1 : 0, 'icon' => $icon ? 1 : 0]);
  $vp = au_meta($x, 'name', 'viewport');
  $add('viewport', 'preview', str_contains($vp, 'width=device-width') ? 'ok' : 'bad');
  $lang = trim((string)($x->query('//html/@lang')->item(0)->nodeValue ?? ''));
  $add('lang', 'preview', $lang !== '' ? 'ok' : 'warn', ['lang' => mb_substr($lang, 0, 10)]);

  /* ---- Контент ---- */
  $h1s = []; foreach ($x->query('//h1') as $e) $h1s[] = mb_substr(trim(preg_replace('~\s+~u', ' ', $e->textContent)), 0, 80);
  $add('h1', 'content', count($h1s) === 1 ? 'ok' : (count($h1s) === 0 ? 'bad' : 'warn'), ['n' => count($h1s), 'text' => $h1s[0] ?? '']);
  $imgs = $x->query('//img'); $noAlt = 0; $imgSrc = [];
  foreach ($imgs as $i) {
    if (!$i->hasAttribute('alt')) $noAlt++;
    $src = $i->getAttribute('src') ?: $i->getAttribute('data-src') ?: $i->getAttribute('data-lazy-src');
    if ($src && !str_starts_with($src, 'data:') && ($a = au_abs($final, $src))) $imgSrc[$a] = 1;
  }
  $add('alt', 'content', $imgs->length === 0 || $noAlt === 0 ? 'ok' : ($noAlt / max(1, $imgs->length) > .5 ? 'bad' : 'warn'), ['n' => $imgs->length, 'miss' => $noAlt]);
  $types = []; $badJson = 0;
  foreach ($x->query('//script[@type="application/ld+json"]') as $s) {
    $j = json_decode(trim($s->textContent), true);
    if (!is_array($j)) { $badJson++; continue; }
    $walk = function ($n) use (&$walk, &$types) { if (!is_array($n)) return; if (isset($n['@type'])) foreach ((array)$n['@type'] as $t) if (is_string($t)) $types[$t] = 1; foreach ($n as $v) if (is_array($v)) $walk($v); };
    $walk($j);
  }
  $add('schema', 'content', $types ? ($badJson ? 'warn' : 'ok') : 'warn', ['types' => implode(', ', array_slice(array_keys($types), 0, 5)), 'bad' => $badJson]);

  /* внутрішні посилання: до 20 штук */
  $links = [];
  foreach ($x->query('//a[@href]') as $a) {
    $u = au_abs($final, $a->getAttribute('href')); if (!$u) continue;
    $u = preg_replace('~#.*$~', '', $u);
    $lh = strtolower((string)parse_url($u, PHP_URL_HOST));
    if ($lh === $fhost || $lh === "www.$fhost" || "www.$lh" === $fhost) $links[$u] = 1;
    if (count($links) >= 20) break;
  }
  $broken = [];
  if ($links) {
    $lr = au_multi(array_map(fn($u) => ['url' => $u, 'max' => 20000, 'timeout' => 7], array_keys($links)));
    foreach ($lr as $q) if ($q['code'] >= 400 || ($q['code'] === 0 && $q['err'] !== 'blocked')) $broken[] = (string)(parse_url($q['url'], PHP_URL_PATH) ?: '/');
  }
  $add('links', 'content', !$broken ? 'ok' : (count($broken) > 2 ? 'bad' : 'warn'), ['n' => count($links), 'broken' => count($broken), 'list' => array_slice($broken, 0, 4)]);

  $clone = au_dom($html);
  foreach ($clone->query('//script|//style|//noscript|//template|//svg') as $n) $n->parentNode->removeChild($n);
  $body = $clone->query('//body')->item(0);
  $words = $body ? count(preg_split('~\s+~u', trim($body->textContent), -1, PREG_SPLIT_NO_EMPTY)) : 0;
  $add('text', 'content', $words >= 150 ? 'ok' : 'warn', ['words' => $words]);

  /* ---- Швидкість (частина; PageSpeed — окремим запитом) ---- */
  $add('psi_m', 'speed', 'wait'); $add('psi_d', 'speed', 'wait');
  $imgList = array_slice(array_keys($imgSrc), 0, 15);
  $big = ['kb' => 0, 'name' => ''];
  if ($imgList) {
    $ir = au_multi(array_map(fn($u) => ['url' => $u, 'head' => true, 'timeout' => 6], $imgList));
    foreach ($ir as $q) {
      $len = (int)au_hdr($q, 'content-length');
      if ($len > $big['kb'] * 1024) $big = ['kb' => (int)round($len / 1024), 'name' => mb_substr(basename((string)parse_url($q['url'], PHP_URL_PATH)), 0, 60)];
    }
  }
  $add('img', 'speed', $big['kb'] > 1200 ? 'bad' : ($big['kb'] > 400 ? 'warn' : 'ok'), $big + ['n' => count($imgList)]);
  $enc = strtolower(au_hdr($r, 'content-encoding'));
  $asset = null;
  if (preg_match('~<(?:link[^>]+href|script[^>]+src)=["\']([^"\']+\.(?:css|js)(?:\?[^"\']*)?)["\']~i', $html, $m)) $asset = au_abs($final, $m[1]);
  $cacheOk = null;
  if ($asset && strtolower((string)parse_url($asset, PHP_URL_HOST)) === $fhost) {
    $ar = au_get($asset, ['head' => true]);
    $cc = strtolower(au_hdr($ar, 'cache-control'));
    $cacheOk = (preg_match('~max-age=(\d+)~', $cc, $mm) && (int)$mm[1] >= 604800) || au_hdr($ar, 'expires') !== '';
  }
  $gz = in_array($enc, ['gzip', 'br', 'zstd', 'deflate'], true);
  $add('gzip', 'speed', $gz && $cacheOk !== false ? 'ok' : (!$gz && $cacheOk === false ? 'bad' : 'warn'), ['enc' => $enc, 'cache' => $cacheOk === null ? -1 : (int)$cacheOk]);

  /* ---- Безпека ---- */
  $paths = ['/.env' => 'env', '/.git/config' => 'git', '/.git/HEAD' => 'githead', '/.DS_Store' => 'ds', '/backup.zip' => 'zip', '/backup.sql' => 'sql',
    '/dump.sql' => 'sql', '/db.sql' => 'sql', '/phpinfo.php' => 'phpinfo', '/info.php' => 'phpinfo', '/.htpasswd' => 'htpasswd', '/config.php.bak' => 'php', '/.svn/entries' => 'svn'];
  if ($isWp) $paths += ['/wp-config.php.bak' => 'wpc', '/wp-config.php~' => 'wpc', '/wp-config.php.save' => 'wpc', '/wp-config.php.old' => 'wpc', '/wp-config.bak' => 'wpc', '/debug.log' => 'log', '/wp-content/debug.log' => 'log'];
  $sig = [
    'env' => fn($b) => preg_match('~^[A-Z][A-Z0-9_]{2,}=~m', $b) && stripos($b, '<html') === false,
    'git' => fn($b) => str_contains($b, '[core]'), 'githead' => fn($b) => str_starts_with(trim($b), 'ref: refs/'),
    'ds' => fn($b) => str_contains(substr($b, 0, 16), 'Bud1'), 'zip' => fn($b) => str_starts_with($b, "PK\x03\x04"),
    'sql' => fn($b) => preg_match('~(CREATE TABLE|INSERT INTO)~i', $b) && stripos($b, '<html') === false,
    'phpinfo' => fn($b) => str_contains($b, 'phpinfo()') || (str_contains($b, 'PHP Version') && str_contains($b, 'Configuration')),
    'htpasswd' => fn($b) => preg_match('~^[\w.-]+:\$~m', $b) === 1, 'php' => fn($b) => str_contains($b, '<?php'),
    'svn' => fn($b) => preg_match('~^\d+\s*$~m', substr($b, 0, 20)) === 1, 'wpc' => fn($b) => str_contains($b, 'DB_PASSWORD'),
    'log' => fn($b) => preg_match('~PHP (Warning|Notice|Fatal|Deprecated)~', $b) === 1,
  ];
  $fr = au_multi(array_map(fn($p) => ['url' => $root . $p, 'max' => 20000, 'timeout' => 7], array_combine(array_keys($paths), array_keys($paths))));
  $exposed = [];
  foreach ($fr as $p => $q) if ($q['code'] === 200 && $q['body'] !== '' && $sig[$paths[$p]]((string)$q['body'])) $exposed[] = $p;
  $add('files', 'security', $exposed ? 'bad' : 'ok', ['list' => $exposed]);

  if ($isWp) {
    $latest = '';
    $vc = au_get('https://api.wordpress.org/core/version-check/1.7/', ['max' => 300000, 'timeout' => 6]);
    $vj = json_decode((string)$vc['body'], true); if (is_array($vj)) $latest = (string)($vj['offers'][0]['current'] ?? '');
    $ver = $plat['ver'];
    $old = $ver !== '' && $latest !== '' && version_compare($ver, $latest, '<') && implode('.', array_slice(explode('.', $ver), 0, 2)) !== implode('.', array_slice(explode('.', $latest), 0, 2));
    $add('cms', 'security', $ver === '' ? 'ok' : ($old ? 'bad' : 'warn'), ['ver' => $ver, 'latest' => $latest]);
    $wq = au_multi([
      'users' => ['url' => "$root/wp-json/wp/v2/users", 'max' => 100000],
      'xmlrpc' => ['url' => "$root/xmlrpc.php", 'max' => 5000],
    ]);
    $uj = json_decode((string)$wq['users']['body'], true);
    $slugs = is_array($uj) && isset($uj[0]['slug']) ? array_slice(array_map(fn($u) => (string)($u['slug'] ?? ''), $uj), 0, 3) : [];
    $add('users', 'security', $slugs ? 'warn' : 'ok', ['n' => count($slugs), 'names' => $slugs]);
    $add('xmlrpc', 'security', $wq['xmlrpc']['code'] === 405 || stripos((string)$wq['xmlrpc']['body'], 'XML-RPC server accepts') !== false ? 'warn' : 'ok');
  }
  $dirs = $isWp ? ['/wp-content/uploads/', '/wp-content/plugins/'] : ['/uploads/', '/images/', '/img/', '/assets/'];
  $dr = au_multi(array_map(fn($p) => ['url' => $root . $p, 'max' => 30000, 'timeout' => 6], array_combine($dirs, $dirs)));
  $listed = [];
  foreach ($dr as $p => $q) if ($q['code'] === 200 && preg_match('~<title>\s*Index of /|<h1>\s*Index of /~i', (string)$q['body'])) $listed[] = $p;
  $add('list', 'security', $listed ? 'warn' : 'ok', ['list' => $listed]);

  $want = ['strict-transport-security' => 'HSTS', 'x-content-type-options' => 'nosniff', 'referrer-policy' => 'Referrer-Policy', 'x-frame-options' => 'X-Frame-Options', 'permissions-policy' => 'Permissions-Policy', 'content-security-policy' => 'CSP'];
  $have = []; $miss = [];
  foreach ($want as $k => $n) {
    $on = isset($h[$k]) || ($k === 'x-frame-options' && str_contains(strtolower(au_hdr($r, 'content-security-policy')), 'frame-ancestors'));
    if ($on) $have[] = $n; else $miss[] = $n;
  }
  $leak = preg_match('~\d~', au_hdr($r, 'server')) || isset($h['x-powered-by']) ? trim(au_hdr($r, 'x-powered-by') ?: au_hdr($r, 'server')) : '';
  $add('heads', 'security', count($have) >= 4 && $leak === '' ? 'ok' : (count($have) <= 1 ? 'bad' : 'warn'), ['n' => count($have), 'miss' => $miss, 'leak' => mb_substr($leak, 0, 40)]);
  $mixed = 0;
  if (str_starts_with($final, 'https://')) $mixed = preg_match_all('~<(?:img|script|iframe|source|video|audio)[^>]+src=["\']http://|<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']http://~i', $html);
  $add('mixed', 'security', $mixed ? 'warn' : 'ok', ['n' => $mixed]);

  /* ---- Юридичне ---- */
  $priv = false;
  foreach ($x->query('//a[@href]') as $a) {
    $t = mb_strtolower($a->textContent . ' ' . $a->getAttribute('href'));
    if (preg_match('~privacy|prywatno|polityka|rodo|gdpr|datenschutz|конфіденц|приватн|політика|cookies-policy|cookie-policy~u', $t)) { $priv = true; break; }
  }
  $add('priv', 'legal', $priv ? 'ok' : 'bad');
  $cmp = (bool)preg_match('~cookiebot|cookieyes|cookie-law-info|complianz|onetrust|iubenda|usercentrics|klaro|borlabs|cookiehub|termly|osano|cookieconsent|cookie-consent|tarteaucitron|axeptio|didomi|quantcast|consentmanager|cookie-notice|cookie_notice|moove_gdpr|real-cookie-banner|gdpr-cookie|t-cookie|cookie-bar|cookiesbar|cookie_banner|cookie-banner|cmplz~i', $html);
  $trackers = [];
  if (preg_match('~googletagmanager\.com/gtm\.js|GTM-[A-Z0-9]{4,}~', $html)) $trackers[] = 'Google Tag Manager';
  if (preg_match('~gtag\(|G-[A-Z0-9]{6,}|google-analytics\.com~', $html)) $trackers[] = 'Google Analytics';
  if (preg_match('~connect\.facebook\.net|fbq\(~', $html)) $trackers[] = 'Meta Pixel';
  if (preg_match('~clarity\.ms~', $html)) $trackers[] = 'Microsoft Clarity';
  if (preg_match('~hotjar\.com~', $html)) $trackers[] = 'Hotjar';
  if (preg_match('~googleadservices|AW-\d{6,}~', $html)) $trackers[] = 'Google Ads';
  if (preg_match('~analytics\.tiktok\.com~', $html)) $trackers[] = 'TikTok Pixel';
  if (preg_match('~plausible\.io|matomo|umami~i', $html)) $trackers[] = 'Plausible/Matomo';
  if (preg_match('~mc\.yandex~', $html)) $trackers[] = 'Yandex Metrica';
  $ads = array_intersect($trackers, ['Meta Pixel', 'Google Ads', 'TikTok Pixel', 'Google Analytics', 'Google Tag Manager', 'Hotjar', 'Microsoft Clarity']);
  $add('cookie', 'legal', $cmp ? 'ok' : ($ads ? 'warn' : 'ok'), ['cmp' => $cmp ? 1 : 0, 'trackers' => $ads ? 1 : 0]);

  /* ---- Аналітика і форма ---- */
  $add('ga', 'track', $trackers ? 'ok' : 'warn', ['list' => $trackers]);
  $hasForm = $x->query('//form')->length > 0 || (bool)preg_match('~wpcf7|wpforms|gform_|elementor-form|t-form|wixforms|data-form~i', $html);
  $cap = preg_match('~challenges\.cloudflare\.com/turnstile|cf-turnstile~i', $html) ? 'Turnstile' : (preg_match('~recaptcha~i', $html) ? 'reCAPTCHA' : (preg_match('~hcaptcha~i', $html) ? 'hCaptcha' : (preg_match('~friendlycaptcha|honeypot|akismet~i', $html) ? 'інший захист' : '')));
  $add('captcha', 'track', !$hasForm ? 'na' : ($cap !== '' || in_array($plat['id'], AU_HOSTED, true) ? 'ok' : 'warn'), ['form' => $hasForm ? 1 : 0, 'cap' => $cap]);

  /* на конструкторах серверне — за платформою */
  if (in_array($plat['id'], AU_HOSTED, true)) foreach ($items as &$it) if (in_array($it['id'], AU_SERVER, true) && $it['s'] !== 'ok') $it['s'] = 'na';
  unset($it);

  return ['final' => $final, 'host' => $fhost, 'platform' => $plat, 'items' => $items, 'ms' => (int)round($r['time'] * 1000)];
}

function au_score(array $items): array {
  $got = 0.0; $max = 0; $c = ['ok' => 0, 'warn' => 0, 'bad' => 0];
  foreach ($items as $i) {
    if (!isset($c[$i['s']])) continue;
    $c[$i['s']]++;
    $w = AU_W[$i['id']] ?? 1; $max += $w;
    $got += $i['s'] === 'ok' ? $w : ($i['s'] === 'warn' ? $w / 2 : 0);
  }
  return [$max ? (int)round($got / $max * 100) : 0, $c];
}

/* PageSpeed Insights: мобільна і десктопна паралельно */
function au_speed(string $url): array {
  $key = au_cfg('PAGESPEED_API_KEY');
  $mk = fn($s) => 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' . http_build_query(['url' => $url, 'strategy' => $s, 'category' => 'performance']) . ($key !== '' ? '&key=' . rawurlencode($key) : '');
  $mh = curl_multi_init(); $ch = [];
  foreach (['m' => 'mobile', 'd' => 'desktop'] as $k => $s) {
    $ch[$k] = curl_init($mk($s));
    curl_setopt_array($ch[$k], [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 75, CURLOPT_CONNECTTIMEOUT => 8]);
    curl_multi_add_handle($mh, $ch[$k]);
  }
  do { $st = curl_multi_exec($mh, $run); if ($run) curl_multi_select($mh, 1.0); } while ($run && $st === CURLM_OK);
  $res = [];
  foreach ($ch as $k => $c) {
    $j = json_decode((string)curl_multi_getcontent($c), true);
    curl_multi_remove_handle($mh, $c);
    $lh = $j['lighthouseResult'] ?? null;
    if (!$lh) { $res[$k] = null; continue; }
    $a = $lh['audits'] ?? [];
    $res[$k] = [
      'score' => (int)round(((float)($lh['categories']['performance']['score'] ?? 0)) * 100),
      'lcp' => round(((float)($a['largest-contentful-paint']['numericValue'] ?? 0)) / 1000, 1),
      'cls' => round((float)($a['cumulative-layout-shift']['numericValue'] ?? 0), 2),
      'tbt' => (int)round((float)($a['total-blocking-time']['numericValue'] ?? 0)),
      'kb' => (int)round(((float)($a['total-byte-weight']['numericValue'] ?? 0)) / 1024),
    ];
  }
  curl_multi_close($mh);
  return $res;
}

/* що бачить відвідувач: без контакту — лише перша група з деталями */
function au_public(array $r, bool $full): array {
  $open = $full || !empty($r['contact']);
  $items = array_map(fn($i) => $open || in_array($i['g'], AU_FREE, true) ? $i : ['id' => $i['id'], 'g' => $i['g'], 's' => $i['s']], $r['items']);
  return ['id' => $r['id'], 'host' => $r['host'], 'url' => $r['url'], 'created' => $r['created'], 'platform' => $r['platform'], 'score' => $r['score'],
    'counts' => $r['counts'], 'speed' => $r['speed'], 'unlocked' => $open, 'items' => $items];
}

/* $topic — тема групи з api/_tg.php: перевірки окремо, контакти з перевірки — до заявок */
function au_tg(string $html, string $topic = 'audits'): void {
  require_once __DIR__ . '/_tg.php';
  dw_tg($topic, $html);
}
function au_site(): string { return 'https://' . preg_replace('~[^a-z0-9.:-]~i', '', (string)($_SERVER['HTTP_HOST'] ?? 'deweb.studio')); }
function au_link(array $r): string {
  $p = ['pl' => '/audyt/', 'en' => '/en/audit/', 'ua' => '/ua/audyt/'][$r['lang']] ?? '/audyt/';
  return au_site() . $p . '?r=' . $r['id'];
}
/* власник (увійшов у /stats) бачить звіт повністю */
function au_owner(): bool {
  $f = dirname(__DIR__) . '/stats/_lib.php';
  if (!is_file($f)) return false;
  try { require_once $f; return function_exists('dw_authed') && dw_authed(); } catch (Throwable $e) { return false; }
}

/* =================== запит =================== */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $r = au_load((string)($_GET['id'] ?? ''));
  if (!$r) au_out(404, ['ok' => false, 'error' => 'not_found']);
  au_out(200, ['ok' => true, 'report' => au_public($r, au_owner())]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') au_out(405, ['ok' => false]);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && strtolower((string)parse_url($origin, PHP_URL_HOST)) !== strtolower(preg_replace('~:\d+$~', '', (string)($_SERVER['HTTP_HOST'] ?? '')))) au_out(403, ['ok' => false, 'error' => 'origin']);

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 10000) au_out(413, ['ok' => false]);
$d = json_decode($raw, true);
if (!is_array($d)) au_out(400, ['ok' => false]);
$action = (string)($d['action'] ?? '');
$ip = dw_client_ip();
$lang = in_array($d['lang'] ?? '', ['pl', 'en', 'ua'], true) ? $d['lang'] : 'pl';

if ($action === 'scan') {
  if (au_clean($d['company'] ?? '', 100) !== '') au_out(400, ['ok' => false, 'error' => 'bad']);
  if ((int)($d['t'] ?? 0) < 1500) au_out(400, ['ok' => false, 'error' => 'bad']);
  $in = mb_strtolower(au_clean($d['url'] ?? '', 300));
  $in = preg_replace('~^[a-z]+://~', '', $in); $in = preg_replace('~[/?#].*$~', '', $in); $in = preg_replace('~:\d+$~', '', $in);
  if (function_exists('idn_to_ascii') && preg_match('~[^\x00-\x7F]~', $in)) $in = (string)idn_to_ascii($in, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
  if (!preg_match('~^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$~', $in)) au_out(400, ['ok' => false, 'error' => 'url']);
  $selfHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));

  /* ліміти: 4 за 10 хв і 20 за добу з однієї IP, 400 на добу загалом */
  if (count(au_hits("ip10|$ip", 600)) >= 4 || count(au_hits("ipday|$ip", 86400)) >= 20) au_out(429, ['ok' => false, 'error' => 'rate']);
  if (count(au_hits('all', 86400)) >= 400) au_out(429, ['ok' => false, 'error' => 'busy']);

  /* Turnstile, якщо налаштований: без токена — лише 1 перевірка за 10 хв */
  if (au_cfg('TURNSTILE_SECRET_KEY') !== '') {
    $tok = au_clean($d['turnstile'] ?? '', 4000);
    if ($tok === '') { if (count(au_hits("ip10|$ip", 600)) >= 1) au_out(400, ['ok' => false, 'error' => 'captcha']); }
    else {
      $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
      curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
        CURLOPT_POSTFIELDS => http_build_query(['secret' => au_cfg('TURNSTILE_SECRET_KEY'), 'response' => $tok, 'remoteip' => $ip])]);
      $j = json_decode((string)curl_exec($ch), true);
      if (is_array($j) && empty($j['success'])) au_out(400, ['ok' => false, 'error' => 'captcha']);
    }
  }
  au_hit("ip10|$ip", 600); au_hit("ipday|$ip", 86400); au_hit('all', 86400);

  @set_time_limit(60);
  try { $res = au_scan($in); }
  catch (Throwable $e) { error_log('deweb audit: ' . $e->getMessage()); au_out(500, ['ok' => false, 'error' => 'internal']); }
  if (isset($res['error'])) au_out(422, ['ok' => false, 'error' => $res['error'], 'code' => $res['code'] ?? 0]);

  [$score, $counts] = au_score($res['items']);
  $r = ['id' => substr(str_replace(['+', '/', '='], '', strtolower(base64_encode(random_bytes(12)))), 0, 10), 'v' => 1,
    'host' => $res['host'], 'url' => $res['final'], 'created' => time(), 'lang' => $lang, 'platform' => $res['platform'],
    'items' => $res['items'], 'score' => $score, 'counts' => $counts, 'speed' => 'pending', 'contact' => null,
    'ip' => substr(hash('sha256', $ip . '|deweb'), 0, 12), 'self' => $res['host'] === $selfHost ? 1 : 0];
  while (!preg_match('~^[a-z0-9]{10}$~', $r['id'])) $r['id'] = substr(bin2hex(random_bytes(8)), 0, 10);
  au_save($r); au_log($r);
  dw_log_event('audit', $lang);
  au_out(200, ['ok' => true, 'report' => au_public($r, false)]);
}

if ($action === 'speed') {
  $r = au_load((string)($d['id'] ?? ''));
  if (!$r) au_out(404, ['ok' => false]);
  /* один запуск PageSpeed на звіт; повторний запит (оновили сторінку) просто чекає результат */
  $busy = $r['speed'] === 'running' && ($r['speed_at'] ?? 0) > time() - 150;
  if ($r['speed'] === 'pending' || ($r['speed'] === 'running' && !$busy)) {
    $r['speed'] = 'running'; $r['speed_at'] = time(); au_save($r);
    @set_time_limit(120);
    $s = au_speed($r['url']);
    $r = au_load($r['id']) ?? $r; // поки чекали, людина могла залишити контакт
    foreach ($r['items'] as &$it) {
      $k = $it['id'] === 'psi_m' ? 'm' : ($it['id'] === 'psi_d' ? 'd' : null);
      if (!$k) continue;
      $v = $s[$k] ?? null;
      if (!$v) { $it['s'] = 'na'; $it['p'] = (object)['fail' => 1]; continue; }
      $good = $k === 'm' ? 80 : 90; $poor = $k === 'm' ? 50 : 70;
      $it['s'] = $v['score'] >= $good ? 'ok' : ($v['score'] >= $poor ? 'warn' : 'bad');
      $it['p'] = (object)$v;
    }
    unset($it);
    [$r['score'], $r['counts']] = au_score($r['items']);
    $r['speed'] = ($s['m'] ?? null) || ($s['d'] ?? null) ? 'done' : 'fail';
    au_save($r); au_log($r);
    /* повідомлення — коли оцінка остаточна */
    $P = $r['platform'];
    au_tg("🔎 <b>Перевірка сайту</b> · " . strtoupper($r['lang']) . "\n" . au_esc($r['host']) . ' — <b>' . $r['score'] . "/100</b>\n"
      . au_esc(($P['name'] === 'custom' ? 'Власний код' : $P['name']) . ($P['ver'] ? ' ' . $P['ver'] : '') . ($P['host'] ? ' · ' . $P['host'] : '')) . "\n"
      . '❌ ' . $r['counts']['bad'] . ' · ⚠️ ' . $r['counts']['warn'] . ' · ✅ ' . $r['counts']['ok']
      . ($r['contact'] ? "\n📬 " . au_esc($r['contact']['label']) : "\n📬 контакт ще не залишив") . "\n🔗 " . au_link($r));
  } elseif ($busy) {
    for ($i = 0; $i < 50 && ($r['speed'] ?? '') === 'running'; $i++) { sleep(2); $r = au_load($r['id']) ?? $r; }
  }
  au_out(200, ['ok' => true, 'report' => au_public($r, false)]);
}

if ($action === 'unlock') {
  $r = au_load((string)($d['id'] ?? ''));
  if (!$r) au_out(404, ['ok' => false]);
  if (count(au_hits("unlock|$ip", 600)) >= 6) au_out(429, ['ok' => false, 'error' => 'rate']);
  au_hit("unlock|$ip", 600);
  $way = in_array($d['way'] ?? '', ['email', 'ig', 'tg'], true) ? $d['way'] : 'email';
  $v = au_clean($d['contact'] ?? '', 120);
  if ($way === 'email') { if (!filter_var($v, FILTER_VALIDATE_EMAIL)) au_out(400, ['ok' => false, 'error' => 'contact']); }
  else { $v = '@' . ltrim($v, '@'); if (!preg_match('~^@[A-Za-z0-9_.]{2,40}$~', $v)) au_out(400, ['ok' => false, 'error' => 'contact']); }
  $label = ($way === 'email' ? '' : ($way === 'ig' ? 'Instagram ' : 'Telegram ')) . $v;
  $first = empty($r['contact']);
  $r['contact'] = ['way' => $way, 'value' => $v, 'label' => $label, 't' => time()];
  au_save($r); au_log($r);
  if ($first) {
    dw_log_event('audit_lead', $lang, $way);
    $crm = false;
    try {
      require_once dirname(__DIR__) . '/crm/_lib.php';
      crm_client_upsert(($way === 'email' ? ['email' => $v, 'name' => $r['host']] : ['contact' => $label, 'name' => $r['host']]), 'audit', $lang,
        'Перевірка сайту ' . $r['host'] . ' — ' . $r['score'] . '/100. Звіт: ' . au_link($r));
      $crm = true;
    } catch (Throwable $e) { error_log('deweb audit: crm ' . $e->getMessage()); }
    au_tg("📬 <b>Контакт з перевірки сайту</b> · " . strtoupper($lang) . "\n" . au_esc($r['host']) . ' — ' . $r['score'] . "/100\n"
      . ($way === 'email' ? '✉️ ' : ($way === 'ig' ? '📷 Instagram ' : '✈️ Telegram ')) . '<code>' . au_esc($v) . "</code>\n🔗 " . au_link($r)
      . ($crm ? "\n🗂 " . au_site() . '/crm/#clients' : ''), 'leads');
  }
  au_out(200, ['ok' => true, 'report' => au_public($r, true)]);
}

au_out(400, ['ok' => false, 'error' => 'action']);
