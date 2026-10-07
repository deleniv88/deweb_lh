/* /stats — малює дашборд із /stats/api.php. Без бібліотек.
   history: щоденні дані GSC/GA4/Clarity (workflow Stats), events: заявки й відкриття форми (рахує сервер),
   notes: власні позначки на графіку («запустив рекламу», «нова сторінка»). */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var H, E, N;
  var st = { P: 28, L: 'all' };
  try { var s = JSON.parse(localStorage.getItem('dwStats') || '{}'); if ([7, 28, 90].indexOf(s.P) >= 0) st.P = s.P; if (['all', 'en', 'pl', 'ua'].indexOf(s.L) >= 0) st.L = s.L; } catch (e) {}
  var save = function () { try { localStorage.setItem('dwStats', JSON.stringify(st)); } catch (e) {} };

  /* ---------- утиліти ---------- */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var addDays = function (s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var range = function (end, n) { var a = []; for (var i = n - 1; i >= 0; i--) a.push(addDays(end, -i)); return a; };
  var dm = function (s) { return s.slice(8, 10) + '.' + s.slice(5, 7); };
  var sum = function (a) { return a.reduce(function (x, y) { return x + (y || 0); }, 0); };
  var fmt = function (n) { if (n == null || isNaN(n)) return '—'; n = Math.round(n); return n >= 10000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : n.toLocaleString('uk-UA'); };
  var f1 = function (n) { return n == null || isNaN(n) ? '—' : n.toFixed(1).replace('.', ','); };
  var mmss = function (s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  var langOf = function (p) { return /^\/pl(\/|$)/.test(p) ? 'pl' : /^\/ua(\/|$)/.test(p) ? 'ua' : 'en'; };
  var api = function (body) {
    return fetch('/stats/api.php', body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { if (r.status === 401) { location.reload(); throw new Error('auth'); } return r.json(); });
  };

  /* ---------- метрики за день ---------- */
  var D = function (d) { return (H.daily || {})[d] || {}; };
  var gsc = function (d) { var g = D(d).gsc; return g ? g[st.L] || (st.L === 'all' ? null : { c: 0, i: 0, p: null }) : null; };
  var sessions = function (d) { var g = D(d).ga; if (!g) return null; var x = g[st.L]; return x ? x.s : 0; };
  var srv = function (d, ev) {
    if (!E || !E.since || d < E.since) return null;
    var x = ((E.days || {})[d] || {})[ev] || {};
    return st.L === 'all' ? sum(Object.keys(x).map(function (k) { return x[k]; })) : x[st.L] || 0;
  };
  /* до запуску серверного лічильника — події з GA4 (лише «усі мови») */
  var leads = function (d) {
    var s = srv(d, 'lead'); if (s != null) return s;
    var ev = (D(d).ga || {}).ev; if (!ev || st.L !== 'all') return D(d).ga ? 0 : null;
    return Math.max(ev.generate_lead || 0, (ev.conversion_event_submit_lead_form || 0) + (ev.conversion_event_submit_lead_form_1 || 0));
  };
  var opens = function (d) { var s = srv(d, 'quote_open'); if (s != null) return s; var ev = (D(d).ga || {}).ev; return ev && st.L === 'all' ? ev.quote_open || 0 : null; };
  var clarity = function (days) {
    var w = 0, o = { rage: 0, dead: 0, quick: 0, scroll: 0, s: 0 }, n = 0;
    days.forEach(function (d) { var c = D(d).cl; if (!c || !c.s) return; n++; w += c.s; ['rage', 'dead', 'quick', 'scroll'].forEach(function (k) { o[k] += (c[k] || 0) * c.s; }); });
    if (!n) return null;
    ['rage', 'dead', 'quick', 'scroll'].forEach(function (k) { o[k] /= w; }); o.s = w; o.days = n; return o;
  };
  var gscAgg = function (days) {
    var c = 0, i = 0, pi = 0, any = false;
    days.forEach(function (d) { var g = gsc(d); if (!g) return; any = true; c += g.c; i += g.i; pi += (g.p || 0) * g.i; });
    return any ? { c: c, i: i, p: i ? pi / i : null } : null;
  };
  var series = function (days, f) { return days.map(f); };
  var total = function (days, f) { var a = days.map(f).filter(function (v) { return v != null; }); return a.length ? sum(a) : null; };

  /* ---------- дати ---------- */
  var lastWith = function (key) { var k = Object.keys(H.daily || {}).filter(function (d) { return H.daily[d][key]; }).sort(); return k[k.length - 1]; };

  /* ---------- KPI ---------- */
  function spark(a, color) {
    var v = a.map(function (x) { return x == null ? null : x; }), ok = v.filter(function (x) { return x != null; });
    if (ok.length < 2) return '<svg viewBox="0 0 120 34"></svg>';
    var w = 120, h = 34, mx = Math.max.apply(0, ok), mn = Math.min.apply(0, ok), r = mx - mn || 1, pts = [];
    v.forEach(function (x, i) { if (x != null) pts.push([i / (v.length - 1) * w, h - 3 - (x - mn) / r * (h - 8)]); });
    var l = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), e = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polygon points="' + pts[0][0].toFixed(1) + ',' + h + ' ' + l + ' ' + e[0].toFixed(1) + ',' + h + '" fill="' + color + '" opacity=".12"/><polyline points="' + l + '" fill="none" stroke="' + color + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="2.5" fill="' + color + '"/></svg>';
  }
  function delta(cur, prev, mode, better, unit) {
    /* mode: 'pct' — відсоток, 'abs' — різниця (позиція, частка) */
    if (cur == null || prev == null) return '<span>немає з чим порівняти</span>';
    var ch = mode === 'pct' ? (prev ? (cur - prev) / prev * 100 : (cur ? Infinity : 0)) : cur - prev;
    if (ch === Infinity) return '<b class="up">новий</b> <span>було 0</span>';
    if (Math.abs(ch) < (mode === 'pct' ? 0.5 : 0.05)) return '<b class="flat">без змін</b>';
    var good = better === 'down' ? ch < 0 : ch > 0;
    var txt = mode === 'pct' ? Math.abs(ch).toFixed(0) + '%' : f1(Math.abs(ch)) + (unit || '');
    return '<b class="' + (good ? 'up' : 'down') + '">' + (ch > 0 ? '▲ ' : '▼ ') + txt + '</b> <span>vs попер. ' + st.P + ' дн.</span>';
  }

  function render() {
    if (!H || !H.daily || !Object.keys(H.daily).length) {
      app.innerHTML = header() + '<section class="panel"><h2>Даних ще немає</h2><p class="sub" style="margin-top:6px">Вони з’являться після першого запуску workflow <b>Stats</b>: GitHub → deweb_lh → Actions → Stats → Run workflow. Далі він оновлює дані щодня о 06:00.</p></section>';
      bindHeader(); return;
    }
    var P = st.P;
    var gaEnd = lastWith('ga') || addDays(new Date().toISOString().slice(0, 10), -1);
    var gscEnd = H.gscLast || lastWith('gsc') || gaEnd;
    var cur = range(gaEnd, P), prev = range(addDays(gaEnd, -P), P);
    var gcur = range(gscEnd, P), gprev = range(addDays(gscEnd, -P), P);
    var G = gscAgg(gcur), Gp = gscAgg(gprev), C = clarity(cur), Cp = clarity(prev);

    var kpis = [
      ['Заявки', 'Форма', total(cur, leads), total(prev, leads), 'pct', 'up', series(cur, leads), 'var(--s3)', fmt],
      ['Відвідування', 'GA4', total(cur, sessions), total(prev, sessions), 'pct', 'up', series(cur, sessions), 'var(--s2)', fmt],
      ['Кліки з Google', 'GSC', G && G.c, Gp && Gp.c, 'pct', 'up', series(gcur, function (d) { var g = gsc(d); return g && g.c; }), 'var(--accent)', fmt],
      ['Покази в Google', 'GSC', G && G.i, Gp && Gp.i, 'pct', 'up', series(gcur, function (d) { var g = gsc(d); return g && g.i; }), 'var(--accent)', fmt],
      ['Сер. позиція', 'GSC', G && G.p, Gp && Gp.p, 'abs', 'down', series(gcur, function (d) { var g = gsc(d); return g && g.p; }), 'var(--accent)', f1],
      ['Rage clicks', 'Clarity', C && C.rage, Cp && Cp.rage, 'abs', 'down', series(cur, function (d) { var c = D(d).cl; return c && c.rage; }), 'var(--bad)', function (v) { return v == null ? '—' : f1(v) + '%'; }, ' п.п.'],
    ];
    var kpiHtml = kpis.map(function (k) {
      return '<div class="panel kpi"><div class="lbl"><span>' + k[0] + '</span><span class="src">' + k[1] + '</span></div><div class="val num">' + k[8](k[2]) + '</div><div class="d num">' + delta(k[2], k[3], k[4], k[5], k[9]) + '</div>' + spark(k[6], k[7]) + '</div>';
    }).join('');

    app.innerHTML = header() + banner()
      + '<section class="kpis">' + kpiHtml + '</section>'
      + '<p class="sub">Відвідування, заявки й Clarity: ' + dm(cur[0]) + '–' + dm(gaEnd) + '. Google: ' + dm(gcur[0]) + '–' + dm(gscEnd) + ' (Search Console відстає на 2–3 дні).' + (st.L !== 'all' ? ' Rage clicks — по всіх мовах.' : '') + '</p>'
      + trendPanel(cur, gaEnd)
      + '<div class="grid2">' + funnelPanel(cur) + sourcesPanel() + queriesPanel() + pagesPanel(cur) + '</div>';
    bindHeader(); drawTrend(cur); bindNotes(); bindQueries();
  }

  /* ---------- шапка ---------- */
  function header() {
    var s = (H && H.sources) || {}, u = H && H.updated ? new Date(H.updated) : null;
    var dot = function (name) { var ok = s[name]; return '<span><i class="dot" style="background:var(' + (ok ? '--good' : H ? '--bad' : '--muted') + ')"></i>' + name + '</span>'; };
    var seg = function (key, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button type="button" data-' + key + '="' + o[0] + '" aria-pressed="' + (String(st[key]) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    return '<header class="top"><div><h1>deweb<b>.</b>studio / stats</h1><p>'
      + (u ? '<span>Оновлено ' + u.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</span>' : '')
      + dot('Search Console') + dot('GA4') + dot('Clarity')
      + '<a href="https://clarity.microsoft.com/projects/view/omjbunx06m/dashboard" target="_blank" rel="noopener">Записи Clarity</a>'
      + '<a href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fdeweb.studio%2F" target="_blank" rel="noopener">Search Console</a>'
      + '<button type="button" class="link" id="logout">Вийти</button></p></div>'
      + '<div class="ctrls">' + seg('P', [[7, '7 днів'], [28, '28 днів'], [90, '90 днів']]) + seg('L', [['all', 'Усі'], ['en', 'EN'], ['pl', 'PL'], ['ua', 'UA']]) + '</div></header>';
  }
  function banner() {
    var e = (H && H.errors) || [];
    return e.length ? '<div class="banner"><b>Під час останнього оновлення частина даних не завантажилась</b> (показую попередні):<ul>' + e.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
  }
  function bindHeader() {
    app.querySelectorAll('[data-P]').forEach(function (b) { b.onclick = function () { st.P = +b.getAttribute('data-P'); save(); render(); }; });
    app.querySelectorAll('[data-L]').forEach(function (b) { b.onclick = function () { st.L = b.getAttribute('data-L'); save(); render(); }; });
    var lo = document.getElementById('logout'); if (lo) lo.onclick = function () { api({ action: 'logout' }).then(function () { location.reload(); }); };
  }

  /* ---------- графік по днях ---------- */
  function trendPanel(cur, end) {
    var notes = (N || []).filter(function (n) { return n.date >= cur[0] && n.date <= end; });
    return '<section class="panel"><div class="ph"><h2>Динаміка по днях</h2><div class="legend">'
      + '<span><i style="background:var(--accent)"></i>Кліки з Google</span><span><i style="background:var(--s2)"></i>Відвідування</span>'
      + '<span><i style="background:var(--s3);height:8px;width:8px;border-radius:50%"></i>Заявки</span><span><i style="background:var(--muted);width:2px;height:10px"></i>Твої позначки</span></div></div>'
      + '<div class="chart" id="trend"></div>'
      + '<div class="notes">' + (notes.length ? notes.map(function (n) { return '<span class="note">' + dm(n.date) + ' · ' + esc(n.text) + '<button type="button" data-del="' + esc(n.id) + '" aria-label="Видалити позначку">×</button></span>'; }).join('') : '<span class="sub">Познач, що змінилось на сайті чи в рекламі, і буде видно, як це вплинуло.</span>') + '</div>'
      + '<form class="noteform" id="noteform"><input type="date" id="nf-date" required value="' + end + '"><input type="text" id="nf-text" maxlength="80" placeholder="Напр.: нова сторінка робіт, запустив Google Ads" required><button class="btn" type="submit">Додати позначку</button></form></section>';
  }
  function drawTrend(days) {
    var el = document.getElementById('trend'); if (!el) return;
    var A = days.map(function (d) { var g = gsc(d); return g ? g.c : null; }), B = days.map(sessions), L = days.map(leads);
    var W = 1000, Hh = 280, l = 40, r = 14, t = 20, b = 30, iw = W - l - r, ih = Hh - t - b;
    var mxv = Math.max.apply(0, A.concat(B).filter(function (v) { return v != null; }).concat([4]));
    var stepY = Math.pow(10, Math.floor(Math.log10(mxv / 4))), nice = [1, 2, 2.5, 5, 10].map(function (m) { return m * stepY; }).filter(function (s) { return s * 4 >= mxv; })[0] || stepY * 10;
    var mx = nice * 4;
    var x = function (i) { return l + (days.length > 1 ? i / (days.length - 1) : 0.5) * iw; }, y = function (v) { return t + ih - v / mx * ih; };
    var path = function (a) { var s = '', pen = false; a.forEach(function (v, i) { if (v == null) { pen = false; return; } s += (pen ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); pen = true; }); return s; };
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = nice * k; g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/><text x="' + (l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)" font-family="Inter Tight,sans-serif">' + v + '</text>'; }
    var step = Math.ceil(days.length / 8);
    days.forEach(function (d, i) { if (i % step === 0 || i === days.length - 1) g += '<text x="' + x(i) + '" y="' + (Hh - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="Inter Tight,sans-serif">' + dm(d) + '</text>'; });
    (N || []).forEach(function (n) { var i = days.indexOf(n.date); if (i < 0) return; g += '<line x1="' + x(i) + '" x2="' + x(i) + '" y1="' + t + '" y2="' + (t + ih) + '" stroke="var(--muted)" stroke-dasharray="3 4"/><text x="' + (x(i) + (i > days.length * 0.8 ? -5 : 5)) + '" y="' + (t - 6) + '" text-anchor="' + (i > days.length * 0.8 ? 'end' : 'start') + '" font-size="11" fill="var(--muted)">' + esc(n.text.length > 28 ? n.text.slice(0, 27) + '…' : n.text) + '</text>'; });
    var bp = path(B); if (bp) g += '<path d="' + bp + '" fill="none" stroke="var(--s2)" stroke-width="2"/>';
    var ap = path(A); if (ap) g += '<path d="' + ap + '" fill="none" stroke="var(--accent)" stroke-width="2.4"/>';
    L.forEach(function (v, i) { if (v) g += '<circle cx="' + x(i) + '" cy="' + y(B[i] || 0) + '" r="' + Math.min(10, 4 + v * 1.5) + '" fill="var(--s3)" stroke="var(--surface)" stroke-width="2"/>'; });
    g += '<line id="tx" x1="0" x2="0" y1="' + t + '" y2="' + (t + ih) + '" stroke="var(--fg)" stroke-opacity=".25" visibility="hidden"/>';
    g += '<rect id="hit" x="' + l + '" y="' + t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Кліки з Google, відвідування і заявки по днях">' + g + '</svg><div class="tip" hidden></div>';

    var svg = el.querySelector('svg'), tip = el.querySelector('.tip'), tx = el.querySelector('#tx');
    var move = function (ev) {
      var rc = svg.getBoundingClientRect(), px = (ev.clientX - rc.left) / rc.width * W;
      var i = Math.max(0, Math.min(days.length - 1, Math.round((px - l) / iw * (days.length - 1)))), d = days[i], gg = gsc(d), c = D(d).cl;
      tx.setAttribute('x1', x(i)); tx.setAttribute('x2', x(i)); tx.setAttribute('visibility', 'visible');
      var note = (N || []).filter(function (n) { return n.date === d; }).map(function (n) { return '📌 ' + esc(n.text); }).join('<br>');
      tip.innerHTML = '<b>' + new Date(d + 'T12:00:00Z').toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'long' }) + '</b><br>'
        + 'Відвідування: <b>' + fmt(B[i]) + '</b><br>Кліки з Google: <b>' + (gg ? fmt(gg.c) : '—') + '</b> · покази <b>' + (gg ? fmt(gg.i) : '—') + '</b><br>'
        + 'Позиція: <b>' + (gg ? f1(gg.p) : '—') + '</b> · заявки <b>' + (L[i] == null ? '—' : L[i]) + '</b>' + (c && c.s ? '<br>Clarity: <b>' + fmt(c.s) + '</b> сесій, rage <b>' + f1(c.rage) + '%</b>' : '') + (note ? '<br>' + note : '');
      tip.hidden = false;
      tip.style.left = Math.max(110, Math.min(rc.width - 110, x(i) / W * rc.width)) + 'px';
      tip.style.top = (t / Hh * rc.height + 6) + 'px';
    };
    svg.addEventListener('mousemove', move);
    svg.addEventListener('mouseleave', function () { tip.hidden = true; tx.setAttribute('visibility', 'hidden'); });
  }
  function bindNotes() {
    var f = document.getElementById('noteform');
    if (f) f.onsubmit = function (e) {
      e.preventDefault();
      api({ action: 'note_add', date: document.getElementById('nf-date').value, text: document.getElementById('nf-text').value })
        .then(function (r) { if (r.notes) { N = r.notes; render(); } });
    };
    app.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { api({ action: 'note_del', id: b.getAttribute('data-del') }).then(function (r) { if (r.notes) { N = r.notes; render(); } }); }; });
  }

  /* ---------- шлях до заявки ---------- */
  function funnelPanel(cur) {
    var s = total(cur, sessions) || 0, o = total(cur, opens), ld = total(cur, leads) || 0;
    var steps = [['Відвідування', s], ['Відкрили форму', o], ['Надіслали заявку', ld]];
    var html = steps.map(function (x, i) {
      var pv = i ? steps[i - 1][1] : null;
      return '<div class="fstep"><span>' + x[0] + '</span><div class="bar"><span style="width:' + (x[1] == null || !s ? 0 : Math.max(1.5, x[1] / s * 100)) + '%"></span></div><span class="pc num">' + fmt(x[1]) + (i && pv && x[1] != null ? ' · ' + (x[1] / pv * 100).toFixed(x[1] / pv < 0.1 ? 1 : 0).replace('.', ',') + '%' : '') + '</span></div>';
    }).join('');
    var since = E && E.since ? 'Відкриття форми і заявки рахує сам сайт з ' + dm(E.since) + '.' : 'Відкриття форми і заявки почне рахувати сайт після оновлення.';
    return '<section class="panel"><div class="ph"><h2>Шлях до заявки</h2><span class="src">GA4 + сайт</span></div><div class="funnel">' + html + '</div>'
      + '<p class="sub" style="margin-top:10px">Конверсія у заявку: <b class="num">' + (s ? (ld / s * 100).toFixed(2).replace('.', ',') + '%' : '—') + '</b>. ' + since + '</p></section>';
  }

  /* ---------- джерела ---------- */
  var CH = { 'Organic Search': 'Органічний пошук', 'Direct': 'Пряме', 'Paid Search': 'Google Ads (пошук)', 'Organic Social': 'Соцмережі', 'Paid Social': 'Реклама в соцмережах', 'Referral': 'Посилання з сайтів', 'Unassigned': 'Без джерела', 'Cross-network': 'Google Ads (кілька мереж)', 'Email': 'Email', 'Display': 'Медійна реклама', 'Organic Video': 'Відео', 'Paid Video': 'Відеореклама', 'Paid Other': 'Інша реклама', 'Organic Shopping': 'Покупки', 'Paid Shopping': 'Покупки (реклама)', 'SMS': 'SMS', 'Affiliates': 'Партнери', 'Audio': 'Аудіо', 'Mobile Push Notifications': 'Push' };
  var CO = { 'Poland': 'Польща', 'Ukraine': 'Україна', 'Germany': 'Німеччина', 'United States': 'США', 'United Kingdom': 'Велика Британія', 'Netherlands': 'Нідерланди', 'Czechia': 'Чехія', 'France': 'Франція', 'Italy': 'Італія', 'Spain': 'Іспанія', 'Ireland': 'Ірландія', 'Lithuania': 'Литва', 'Sweden': 'Швеція', 'Austria': 'Австрія', 'Canada': 'Канада', '(not set)': 'Невідомо' };
  var DV = { desktop: 'Комп’ютер', mobile: 'Телефон', tablet: 'Планшет', 'smart tv': 'Телевізор' };
  function bars(rows, map) {
    if (!rows || !rows.length) return '<p class="empty">Немає даних</p>';
    var t = sum(rows.map(function (r) { return r.s; })) || 1, top = rows.slice(0, 6), mx = top[0].s || 1;
    return '<div class="hb">' + top.map(function (r) { return '<div class="hrow"><span title="' + esc(r.k) + '">' + esc((map && map[r.k]) || r.k) + '</span><div class="bar"><span style="width:' + (r.s / mx * 100) + '%"></span></div><span class="num" style="text-align:right">' + Math.round(r.s / t * 100) + '%</span></div>'; }).join('') + '</div>';
  }
  function sourcesPanel() {
    var g = ((H.periods || {})[st.P] || {}).ga || {};
    return '<section class="panel"><div class="ph"><h2>Звідки приходять</h2><span class="src">GA4 · усі мови</span></div>' + bars(g.channels, CH)
      + '<div class="cols3" style="grid-template-columns:1fr 1fr;margin-top:18px"><div><h2 style="margin-bottom:8px">Країни</h2>' + bars(g.countries, CO) + '</div><div><h2 style="margin-bottom:8px">Пристрої</h2>' + bars(g.devices, DV) + '</div></div></section>';
  }

  /* ---------- пошукові запити ---------- */
  var qState = { q: '', opp: false };
  function queriesPanel() {
    return '<section class="panel full"><div class="ph"><h2>Пошукові запити</h2><div class="tools"><input type="search" id="qf" placeholder="Знайти запит" value="' + esc(qState.q) + '"><label><input type="checkbox" id="qo"' + (qState.opp ? ' checked' : '') + '> Тільки можливості</label><span class="src">Search Console · усі мови</span></div></div><div class="tbl" id="qt">' + queriesTable() + '</div>'
      + '<p class="sub" style="margin-top:8px">«Можливість»: запит на позиціях 4–20 з помітною кількістю показів. Покращений заголовок або текст під нього дає найбільший приріст кліків. Зміна позиції ▲ означає, що сайт піднявся.</p></section>';
  }
  function queriesTable() {
    var g = ((H.periods || {})[st.P] || {}).gsc;
    if (!g || !g.queries || !g.queries.length) return '<p class="empty">Немає даних за цей період</p>';
    var imps = g.queries.map(function (r) { return r.i; }).sort(function (a, b) { return b - a; });
    var thr = Math.max(st.P, imps[Math.floor(imps.length * 0.3)] || 0);
    var rows = g.queries.map(function (r) { r.opp = r.p >= 4 && r.p <= 20 && r.i >= thr; return r; })
      .filter(function (r) { return (!qState.q || r.k.toLowerCase().indexOf(qState.q.toLowerCase()) >= 0) && (!qState.opp || r.opp); }).slice(0, 40);
    if (!rows.length) return '<p class="empty">Нічого не знайдено</p>';
    return '<table><tr><th>Запит</th><th>Кліки</th><th>Було</th><th>Покази</th><th>CTR</th><th>Позиція</th><th>Зміна</th><th></th></tr>' + rows.map(function (r) {
      var dp = r.pp == null ? null : r.pp - r.p;
      return '<tr><td title="' + esc(r.k) + '">' + esc(r.k) + '</td><td>' + r.c + '</td><td class="m">' + (r.pc == null ? '—' : r.pc) + '</td><td>' + fmt(r.i) + '</td><td>' + (r.i ? (r.c / r.i * 100).toFixed(1).replace('.', ',') : '0') + '%</td><td>' + f1(r.p) + '</td><td class="' + (dp == null ? 'm' : dp > 0.05 ? 'up' : dp < -0.05 ? 'down' : 'm') + '">' + (dp == null ? 'новий' : Math.abs(dp) < 0.05 ? '–' : (dp > 0 ? '▲ ' : '▼ ') + f1(Math.abs(dp))) + '</td><td>' + (r.opp ? '<span class="chip opp">Можливість</span>' : '') + '</td></tr>';
    }).join('') + '</table>';
  }
  function bindQueries() {
    var q = document.getElementById('qf'), o = document.getElementById('qo'), t = document.getElementById('qt');
    if (q) q.oninput = function () { qState.q = q.value; t.innerHTML = queriesTable(); };
    if (o) o.onchange = function () { qState.opp = o.checked; t.innerHTML = queriesTable(); };
  }

  /* ---------- сторінки: GA4 + GSC + Clarity ---------- */
  function pagesPanel(cur) {
    var per = (H.periods || {})[st.P] || {}, m = {};
    var row = function (k) { k = k || '/'; return (m[k] = m[k] || { k: k }); };
    ((per.ga || {}).pages || []).forEach(function (r) { var o = row(r.k); o.v = r.v; o.eng = r.eng; });
    ((per.gsc || {}).pages || []).forEach(function (r) { var o = row(r.k); o.c = (o.c || 0) + r.c; o.i = (o.i || 0) + r.i; o.p = r.p; });
    var cl = {};
    cur.forEach(function (d) { var p = D(d).clp; if (!p) return; Object.keys(p).forEach(function (k) { var v = p[k], a = (cl[k] = cl[k] || { s: 0, scroll: 0, rage: 0, dead: 0 }); a.s += v.s; ['scroll', 'rage', 'dead'].forEach(function (f) { a[f] += (v[f] || 0) * v.s; }); }); });
    Object.keys(cl).forEach(function (k) { var a = cl[k], o = row(k); o.cs = a.s; o.scroll = a.scroll / a.s; o.rage = a.rage / a.s; o.dead = a.dead / a.s; });
    var rows = Object.keys(m).map(function (k) { return m[k]; }).filter(function (r) { return st.L === 'all' || langOf(r.k) === st.L; })
      .sort(function (a, b) { return (b.v || 0) - (a.v || 0) || (b.c || 0) - (a.c || 0); }).slice(0, 30);
    var body = rows.length ? '<table><tr><th>Сторінка</th><th>Перегляди</th><th>Сер. час</th><th>Кліки Google</th><th>Позиція</th><th>Глибина скролу</th><th>Rage clicks</th><th>Dead clicks</th><th></th></tr>' + rows.map(function (r) {
      var flag = r.cs >= 5 && (r.rage > 5 || r.dead > 20 || r.scroll < 25);
      return '<tr><td title="' + esc(r.k) + '">' + esc(r.k) + '</td><td>' + fmt(r.v) + '</td><td>' + (r.eng != null ? mmss(r.eng) : '—') + '</td><td>' + (r.c != null ? r.c : '—') + '</td><td>' + (r.p != null ? f1(r.p) : '—') + '</td><td>' + (r.scroll != null ? Math.round(r.scroll) + '%' : '—') + '</td><td>' + (r.rage != null ? f1(r.rage) + '%' : '—') + '</td><td>' + (r.dead != null ? f1(r.dead) + '%' : '—') + '</td><td>' + (flag ? '<span class="chip warn">Глянути записи</span>' : '') + '</td></tr>';
    }).join('') + '</table>' : '<p class="empty">Немає даних за цей період</p>';
    return '<section class="panel full"><div class="ph"><h2>Сторінки: трафік і поведінка</h2><span class="src">GA4 + GSC + Clarity</span></div><div class="tbl">' + body + '</div>'
      + '<p class="sub" style="margin-top:8px">Сер. час — активний час на сторінці на одного відвідувача. «Глянути записи» з’являється, коли rage clicks понад 5%, dead clicks понад 20% або скролять менше чверті сторінки.</p></section>';
  }

  /* ---------- старт ---------- */
  api().then(function (r) { H = r.history; E = r.events; N = r.notes || []; render(); })
    .catch(function (e) { if (e.message !== 'auth') app.innerHTML = '<p class="sub">Не вдалося завантажити дані: ' + esc(e.message) + '</p>'; });
})();
