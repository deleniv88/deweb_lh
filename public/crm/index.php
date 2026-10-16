<?php
/* Закрита CRM deweb.studio: клієнти, зустрічі, графік для AI-агента, Google Календар.
   Сторінку малює app.js, дані — api.php. */
declare(strict_types=1);
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
/* у вкладці «Сайти» розшифровуються паролі — сторінці дозволено вантажити скрипти лише з себе і cdnjs, а надсилати дані лише собі */
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
$v = fn(string $f) => '/crm/' . $f . '?v=' . @filemtime(__DIR__ . '/' . $f);
?><!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>CRM · deweb.studio</title>
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap">
<link rel="stylesheet" href="<?= $v('app.css') ?>">
</head>
<body>
<div id="app"><p class="boot">Завантажую…</p></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js" defer></script>
<script src="<?= $v('app.js') ?>" defer></script>
</body>
</html>
