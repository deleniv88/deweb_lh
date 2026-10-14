<?php
/* IP відвідувача для лімітів (форма, чат, CRM, /stats).
   Заголовки CF-Connecting-IP і X-Forwarded-For може підставити будь-хто, тож їм віримо лише тоді,
   коли запит справді прийшов від Cloudflare (адреса з його мереж). Інакше — адреса з'єднання. */
declare(strict_types=1);

if (!function_exists('dw_client_ip')) {
  function dw_ip_in(string $ip, string $cidr): bool {
    [$net, $bits] = explode('/', $cidr);
    $a = @inet_pton($ip); $b = @inet_pton($net);
    if ($a === false || $b === false || strlen($a) !== strlen($b)) return false;
    $bits = (int)$bits; $bytes = intdiv($bits, 8); $rest = $bits % 8;
    if (strncmp($a, $b, $bytes) !== 0) return false;
    if ($rest === 0) return true;
    $mask = (0xFF << (8 - $rest)) & 0xFF;
    return (ord($a[$bytes]) & $mask) === (ord($b[$bytes]) & $mask);
  }

  function dw_client_ip(): string {
    $remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    $cf = trim((string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
    if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP)) {
      /* https://www.cloudflare.com/ips/ */
      foreach (['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
        '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22', '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32',
        '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'] as $net)
        if (dw_ip_in($remote, $net)) return $cf;
    }
    return $remote;
  }
}
