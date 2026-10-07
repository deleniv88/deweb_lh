<?php
/* Закрита сторінка статистики deweb.studio: Search Console + GA4 + Clarity + заявки.
   Дані готує щоденний workflow .github/workflows/stats.yml, сторінку малює app.js. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $r = dw_login((string)($_POST['password'] ?? ''));
  if ($r === 'ok') { header('Location: /stats/', true, 303); exit; }
  $err = ['wrong' => 'Невірний пароль.', 'locked' => 'Забагато спроб. Спробуй за 15 хвилин.',
          'not_configured' => 'Пароль ще не налаштований: додай секрет STATS_PASSWORD і запусти workflow Stats.'][$r] ?? 'Помилка.';
}
$authed = dw_authed();
$v = fn(string $f) => '/stats/' . $f . '?v=' . @filemtime(__DIR__ . '/' . $f);
?><!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Статистика · deweb.studio</title>
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700&family=Manrope:wght@400;500;600&family=Inter+Tight:wght@400;500;600&display=swap">
<link rel="stylesheet" href="<?= $v('app.css') ?>">
</head>
<body>
<?php if (!$authed): ?>
  <main class="login">
    <form method="post" class="panel login__box" autocomplete="on">
      <h1>deweb<b>.</b>studio / stats</h1>
      <label for="pw">Пароль</label>
      <input type="hidden" name="username" value="stats" autocomplete="username">
      <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
      <?php if ($err): ?><p class="login__err"><?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
      <button type="submit" class="btn">Увійти</button>
    </form>
  </main>
<?php else: ?>
  <div id="app" class="wrap"><p class="sub">Завантажую дані…</p></div>
  <script src="<?= $v('app.js') ?>"></script>
<?php endif; ?>
</body>
</html>
