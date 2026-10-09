<?php
/* Короткий звіт для Telegram з тих самих даних, що й /stats (усі мови).
   Рахує так само, як app.js: GA4, форма й Clarity — до вчора, Search Console — до останнього дня з даними.
   Бот і чат ті самі, що й для заявок: api/config.php, який створює деплой сайту. */
declare(strict_types=1);

function dw_tg_cfg(): array {
  $f = dirname(__DIR__) . '/api/config.php';
  $c = is_file($f) ? (include $f) : [];
  return ['token' => trim((string)($c['TELEGRAM_BOT_TOKEN'] ?? '')), 'chat' => trim((string)($c['TELEGRAM_CHAT_ID'] ?? ''))];
}

function dw_tg_send(string $html): string {
  $c = dw_tg_cfg();
  if ($c['token'] === '' || $c['chat'] === '') return 'tg_config';
  $ch = curl_init('https://api.telegram.org/bot' . $c['token'] . '/sendMessage');
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['chat_id' => $c['chat'], 'text' => $html, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true])]);
  curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return $code === 200 ? 'ok' : 'tg_http_' . $code;
}

/* $P — 7/30/90 останніх днів (Search Console — до останнього дня з даними); або свій період $from…$to для всіх джерел */
function dw_digest(int $P, string $site = 'https://deweb.studio', ?string $from = null, ?string $to = null): ?string {
  $H = dw_read_json('history.json'); $E = dw_read_json('events.json'); $N = dw_read_json('notes.json') ?? [];
  $daily = $H['daily'] ?? [];
  if (!$daily) return null;

  $e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
  $n0 = fn($v) => $v === null ? '—' : number_format((float)$v, 0, ',', ' ');
  $n1 = fn($v) => $v === null ? '—' : number_format((float)$v, 1, ',', ' ');
  $dm = fn(string $d) => substr($d, 8, 2) . '.' . substr($d, 5, 2);
  $add = fn(string $d, int $k) => gmdate('Y-m-d', strtotime("$d 12:00:00 UTC") + $k * 86400);
  $range = function (string $end, int $n) use ($add) { $a = []; for ($i = $n - 1; $i >= 0; $i--) $a[] = $add($end, -$i); return $a; };
  $lastWith = function (string $k) use ($daily) { $ds = array_keys(array_filter($daily, fn($x) => !empty($x[$k]))); sort($ds); return $ds ? end($ds) : null; };

  /* метрики за день — як у app.js для «усі мови» */
  $D = fn(string $d) => $daily[$d] ?? [];
  $sessions = function (string $d) use ($D) { $g = $D($d)['ga'] ?? null; return $g ? (int)($g['all']['s'] ?? 0) : null; };
  $srv = function (string $d, string $ev) use ($E) {
    if (empty($E['since']) || $d < $E['since']) return null;
    return array_sum((array)($E['days'][$d][$ev] ?? []));
  };
  $leads = function (string $d) use ($srv, $D) {
    $s = $srv($d, 'lead'); if ($s !== null) return $s;
    $g = $D($d)['ga'] ?? null; if (!$g) return null; $ev = $g['ev'] ?? [];
    return max($ev['generate_lead'] ?? 0, ($ev['conversion_event_submit_lead_form'] ?? 0) + ($ev['conversion_event_submit_lead_form_1'] ?? 0));
  };
  $opens = function (string $d) use ($srv, $D) { $s = $srv($d, 'quote_open'); if ($s !== null) return $s; $ev = $D($d)['ga']['ev'] ?? null; return $ev !== null ? (int)($ev['quote_open'] ?? 0) : null; };
  $total = function (array $days, callable $f) { $a = array_filter(array_map($f, $days), fn($v) => $v !== null); return $a ? array_sum($a) : null; };
  $gscAgg = function (array $days) use ($D) {
    $c = 0; $i = 0; $pi = 0; $any = false;
    foreach ($days as $d) { $g = $D($d)['gsc']['all'] ?? null; if (!$g) continue; $any = true; $c += $g['c']; $i += $g['i']; $pi += ($g['p'] ?? 0) * $g['i']; }
    return $any ? ['c' => $c, 'i' => $i, 'p' => $i ? $pi / $i : null] : null;
  };
  $rage = function (array $days) use ($D) {
    $w = 0; $r = 0; foreach ($days as $d) { $c = $D($d)['cl'] ?? null; if (empty($c['s'])) continue; $w += $c['s']; $r += ($c['rage'] ?? 0) * $c['s']; }
    return $w ? $r / $w : null;
  };
  /* зміна: відсоток для кількостей, різниця для позиції й частки */
  $pct = function ($cur, $prev) {
    if ($cur === null || $prev === null) return '';
    if (!$prev) return $cur ? ' (було 0)' : '';
    $ch = ($cur - $prev) / $prev * 100;
    return abs($ch) < 0.5 ? ' (без змін)' : ' (' . ($ch > 0 ? '▲ ' : '▼ ') . round(abs($ch)) . '%)';
  };
  $better = function ($cur, $prev, string $unit = '') use ($n1) {
    if ($cur === null || $prev === null) return '';
    $ch = $cur - $prev;
    return abs($ch) < 0.05 ? ' (без змін)' : ' (' . ($ch < 0 ? 'краще' : 'гірше') . ' на ' . $n1(abs($ch)) . $unit . ')';
  };

  $gaEnd = $lastWith('ga') ?? gmdate('Y-m-d', time() - 86400);
  $gscEnd = $H['gscLast'] ?? $lastWith('gsc') ?? $gaEnd;
  if ($from !== null && $to !== null) {
    $P = (int)round((strtotime("$to 12:00 UTC") - strtotime("$from 12:00 UTC")) / 86400) + 1;
    $cur = $gcur = $range($to, $P); $prev = $gprev = $range($add($from, -1), $P);
  } else {
    $cur = $range($gaEnd, $P); $prev = $range($add($gaEnd, -$P), $P);
    $gcur = $range($gscEnd, $P); $gprev = $range($add($gscEnd, -$P), $P);
  }
  $end = end($cur); $gend = end($gcur);

  $L = $total($cur, $leads); $Lp = $total($prev, $leads);
  $S = $total($cur, $sessions); $Sp = $total($prev, $sessions);
  $O = $total($cur, $opens);
  $G = $gscAgg($gcur); $Gp = $gscAgg($gprev);
  $R = $rage($cur); $Rp = $rage($prev);

  $m = [];
  $m[] = '📊 <b>deweb.studio · ' . $dm($cur[0]) . '–' . $dm($end) . '</b>';
  $m[] = $P . ' дн., порівняно з попередніми ' . $P . ' дн.';
  $m[] = '';
  $m[] = '🎯 Заявки: <b>' . $n0($L) . '</b>' . $pct($L, $Lp);
  /* відкриття форми рахує сайт; до запуску лічильника цього рядка немає */
  $since = (string)($E['since'] ?? '');
  if ($since !== '' && $since <= $end) $m[] = '📝 Відкрили форму: <b>' . $n0($O) . '</b>' . ($since > $cur[0] ? ' (рахуємо з ' . $dm($since) . ')' : '');
  $m[] = '👥 Відвідування: <b>' . $n0($S) . '</b>' . $pct($S, $Sp);
  if ($S) $m[] = '↳ конверсія в заявку: <b>' . number_format(($L ?? 0) / $S * 100, 2, ',', ' ') . '%</b>';
  if ($G) {
    $m[] = '';
    $m[] = '🔎 Google (' . $dm($gcur[0]) . '–' . $dm(min($gend, $gscEnd)) . ($gend > $gscEnd ? ', далі Google ще не віддав дані' : '') . ')';
    $m[] = 'Кліки <b>' . $n0($G['c']) . '</b>' . $pct($G['c'], $Gp['c'] ?? null) . ' · покази <b>' . $n0($G['i']) . '</b>' . $pct($G['i'], $Gp['i'] ?? null);
    if ($G['p'] !== null) $m[] = 'Сер. позиція <b>' . $n1($G['p']) . '</b>' . $better($G['p'], $Gp['p'] ?? null);
  }
  if ($R !== null) $m[] = '😤 Rage clicks: <b>' . $n1($R) . '%</b> сесій' . $better($R, $Rp, ' п.п.');

  /* звідки приходять */
  $CH = ['Organic Search' => 'Пошук', 'Direct' => 'Пряме', 'Paid Search' => 'Google Ads', 'Organic Social' => 'Соцмережі', 'Paid Social' => 'Реклама в соцмережах',
         'Referral' => 'Посилання', 'Unassigned' => 'Без джерела', 'Cross-network' => 'Google Ads (кілька мереж)', 'Email' => 'Email', 'Display' => 'Медійна реклама'];
  /* розбивки по днях → за період */
  $sumDays = function (array $days, string $key) use ($D) { $o = []; foreach ($days as $d) foreach (($D($d)[$key] ?? []) as $k => $v) $o[$k] = ($o[$k] ?? 0) + $v; arsort($o); return $o; };
  $cipDays = function (array $days, string $key) use ($D) {
    $o = [];
    foreach ($days as $d) foreach (($D($d)[$key] ?? []) as $k => $v) { $a = $o[$k] ?? ['k' => (string)$k, 'c' => 0, 'i' => 0, 'pi' => 0]; $a['c'] += $v[0]; $a['i'] += $v[1]; $a['pi'] += $v[2] * $v[1]; $o[$k] = $a; }
    foreach ($o as &$a) $a['p'] = $a['i'] ? $a['pi'] / $a['i'] : null;
    return array_values($o);
  };
  $ch = []; foreach ($sumDays($cur, 'gch') as $k => $v) if ($v > 0) $ch[] = ['k' => $k, 's' => $v];
  if ($ch) {
    $t = array_sum(array_column($ch, 's')) ?: 1;
    $m[] = '';
    $m[] = '📈 Звідки: ' . implode(' · ', array_map(fn($r) => $e($CH[$r['k']] ?? $r['k']) . ' ' . round($r['s'] / $t * 100) . '%', array_slice($ch, 0, 4)));
  }

  /* запити: найкращі й «можливості» (позиції 4–20, багато показів) */
  $q = $cipDays($gcur, 'gq');
  $top = array_values(array_filter($q, fn($r) => $r['c'] > 0));
  usort($top, fn($a, $b) => $b['c'] <=> $a['c']);
  $top = array_slice($top, 0, 3);
  if ($top) $m[] = '🔑 Топ запити: ' . implode(', ', array_map(fn($r) => '«' . $e($r['k']) . '» ' . $r['c'], $top));
  if ($q) {
    $imps = array_column($q, 'i'); rsort($imps);
    $thr = max($P, $imps[(int)floor(count($imps) * 0.3)] ?? 0);
    $opp = array_values(array_filter($q, fn($r) => $r['p'] >= 4 && $r['p'] <= 20 && $r['i'] >= $thr));
    usort($opp, fn($a, $b) => $b['i'] <=> $a['i']);
    if ($opp) $m[] = '💡 Можна підтягнути: ' . implode(', ', array_map(fn($r) => '«' . $e($r['k']) . '» (позиція ' . $n1($r['p']) . ', ' . $n0($r['i']) . ' показів)', array_slice($opp, 0, 2)));
  }

  /* сторінки, на яких варто глянути записи Clarity */
  $cl = [];
  foreach ($cur as $d) foreach (($D($d)['clp'] ?? []) as $k => $v) {
    $a = $cl[$k] ?? ['s' => 0, 'scroll' => 0, 'rage' => 0, 'dead' => 0]; $a['s'] += $v['s'];
    foreach (['scroll', 'rage', 'dead'] as $f) $a[$f] += ($v[$f] ?? 0) * $v['s'];
    $cl[$k] = $a;
  }
  $bad = [];
  foreach ($cl as $k => $a) {
    if ($a['s'] < 5) continue;
    $r = $a['rage'] / $a['s']; $dd = $a['dead'] / $a['s']; $sc = $a['scroll'] / $a['s'];
    $why = $r > 5 ? 'rage ' . $n1($r) . '%' : ($dd > 20 ? 'dead ' . $n1($dd) . '%' : ($sc < 25 ? 'скрол ' . round($sc) . '%' : ''));
    if ($why) $bad[] = $e($k) . ' (' . $why . ')';
  }
  if ($bad) $m[] = '⚠️ Глянути записи Clarity: ' . implode(', ', array_slice($bad, 0, 3));

  $notes = array_filter($N, fn($n) => ($n['date'] ?? '') >= $cur[0] && ($n['date'] ?? '') <= $end);
  if ($notes) $m[] = '📌 ' . implode('; ', array_map(fn($n) => $dm($n['date']) . ' ' . $e($n['text']), $notes));

  $m[] = '';
  $m[] = '<a href="' . $e(rtrim($site, '/')) . '/stats/">Відкрити статистику</a>';
  return implode("\n", $m);
}
