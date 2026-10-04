import Lenis from "lenis";

/* =========================================================
   Інтерактив сайту (перенесено з index.html без змін логіки).
   Кожна функція повертає cleanup(), щоб React міг прибрати
   слухачі при повторному монтуванні або зміні контенту в адмінці.
   ========================================================= */

function listen(signal) {
  return function on(el, type, fn, opts) {
    if (!el) return;
    el.addEventListener(type, fn, Object.assign({}, opts || {}, { signal: signal }));
  };
}

/* ---------- Бургер-меню (мобілка) ---------- */
export function initBurger() {
  var btn = document.querySelector('.burger');
  var nav = document.getElementById('main-nav');
  if (!btn || !nav) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);

  on(btn, 'click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  on(nav, 'click', function (e) {
    if (e.target.closest('a')) {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      btn.focus();
    }
  });
  return function () { ac.abort(); };
}

/* ---------- Sticky header: компактний після скролу, на мобілці ховається при скролі вниз; підсвітка пункту ---------- */
export function initHeader() {
  var hdr = document.querySelector('[data-site-header]');
  if (!hdr) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var mobile = window.matchMedia('(max-width: 767px)');
  var burger = hdr.querySelector('.burger');
  var lastY = window.scrollY, ticking = false;

  var links = Array.prototype.slice.call(hdr.querySelectorAll('.nav__link'));
  var spy = links.map(function (a) {
    var href = a.getAttribute('href') || '';
    var id = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#') + 1) : '';
    return { link: a, el: id ? document.getElementById(id) : null };
  }).filter(function (x) { return x.el; });

  function setActive(a) {
    links.forEach(function (l) {
      var isOn = l === a;
      l.classList.toggle('is-active', isOn);
      if (isOn) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
  }

  function update() {
    ticking = false;
    var y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 10);

    var menuOpen = burger && burger.getAttribute('aria-expanded') === 'true';
    if (mobile.matches && !menuOpen && y > 200 && y > lastY + 4) hdr.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 200 || !mobile.matches || menuOpen) hdr.classList.remove('is-hidden');
    lastY = y;

    /* активна — та секція, чий верх найближче над лінією 40% екрана */
    var line = window.innerHeight * 0.4, cur = null, best = -Infinity;
    spy.forEach(function (x) {
      var t = x.el.getBoundingClientRect().top;
      if (t <= line && t > best) { best = t; cur = x.link; }
    });
    setActive(cur);
  }
  on(window, 'scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  on(window, 'resize', update);
  update();
  return function () { ac.abort(); };
}

/* ---------- Recent work: нескінченна 3D-карусель (півколо) + стрілки + drag/swipe + курсор ---------- */
export function initCarousel() {
  var stage = document.querySelector('[data-work-track]');
  if (!stage || !stage.children.length) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var cards = Array.prototype.slice.call(stage.children);
  var n = cards.length;
  var prev = document.querySelector('[data-work-prev]');
  var next = document.querySelector('[data-work-next]');
  var live = document.querySelector('[data-work-live]');
  var cursor = document.querySelector('.drag-cursor');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mobile = window.matchMedia('(max-width: 767px)');

  var pos = 0, anim = null, activeIdx = -1;

  function mod(a, m) { return ((a % m) + m) % m; }

  function geo() {
    var w = cards[0].offsetWidth;
    var small = mobile.matches;
    var step = small ? 32 : 30;
    var R = w * (small ? 1.8 : 2.05);
    return { w: w, step: step, R: R, px: R * Math.sin(step * Math.PI / 180) };
  }

  function render() {
    var g = geo();
    for (var i = 0; i < n; i++) {
      var o = mod(i - pos + n / 2, n) - n / 2;
      var a = Math.abs(o);
      var th = o * g.step;
      var rad = th * Math.PI / 180;
      var x = g.R * Math.sin(rad);
      var z = g.R * (Math.cos(rad) - 1);
      var c = cards[i];
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + th.toFixed(2) + 'deg)';
      c.style.zIndex = String(100 - Math.round(a * 10));
      var vis = a < 1.6 ? 1 : Math.max(0, 1 - (a - 1.6) / 0.5);
      c.style.opacity = vis.toFixed(3);
      c.style.visibility = vis <= 0 ? 'hidden' : 'visible';
      var meta = c.lastElementChild;
      if (meta) meta.style.opacity = Math.max(0, 1 - a * 2).toFixed(3);
    }
    var idx = mod(Math.round(pos), n);
    if (idx !== activeIdx) {
      activeIdx = idx;
      cards.forEach(function (c, k) {
        var isOn = k === idx;
        c.classList.toggle('is-active', isOn);
        c.setAttribute('aria-hidden', isOn ? 'false' : 'true');
      });
      if (live) live.textContent = (stage.dataset.liveTpl || 'Project {i} of {n}').replace('{i}', idx + 1).replace('{n}', n);
    }
  }

  function animateTo(target) {
    if (anim) cancelAnimationFrame(anim.raf);
    if (reduce) { pos = target; render(); return; }
    var from = pos, t0 = performance.now();
    var dur = Math.min(900, 450 + Math.abs(target - from) * 180);
    anim = {};
    (function tick(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - t, 4);
      pos = from + (target - from) * e;
      render();
      if (t < 1) anim.raf = requestAnimationFrame(tick); else anim = null;
    })(t0);
  }

  on(prev, 'click', function () { animateTo(Math.round(pos) - 1); });
  on(next, 'click', function () { animateTo(Math.round(pos) + 1); });

  on(stage, 'keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); animateTo(Math.round(pos) + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); animateTo(Math.round(pos) - 1); }
  });

  cards.forEach(function (c, i) {
    on(c.querySelector('.work__media'), 'click', function (e) {
      if (i !== activeIdx) {
        e.preventDefault();
        var o = mod(i - pos + n / 2, n) - n / 2;
        animateTo(Math.round(pos + o));
      }
    });
  });

  var drag = null, moved = 0;
  on(stage, 'dragstart', function (e) { e.preventDefault(); });

  /* Важливо: "захоплюємо" курсор лише коли почалось справжнє перетягування (зсув > 8px).
     Якщо захопити одразу на pointerdown, браузер віддає клік каруселі, а не посиланню —
     і "View website" / клік по банеру не відкривають сайт. */
  on(stage, 'pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, pos: pos, start: Math.round(pos), lastX: e.clientX, lastT: performance.now(), v: 0, locked: false, mouse: e.pointerType === 'mouse' };
    moved = 0;
  });

  on(stage, 'pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (!drag.mouse && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      drag.locked = true;
      if (anim) { cancelAnimationFrame(anim.raf); anim = null; drag.pos = pos; }
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
      if (cursor) cursor.classList.add('is-down');
    }
    moved = Math.max(moved, Math.abs(dx));
    var now = performance.now(), dt = Math.max(1, now - drag.lastT);
    drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX; drag.lastT = now;
    pos = drag.pos - dx / geo().px;
    render();
  });

  function endDrag(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    var projected = pos - drag.v * 180 / geo().px;
    var target = Math.round(projected);
    if (target === drag.start && Math.abs(dx) > 40) target = drag.start + (dx < 0 ? 1 : -1);
    target = Math.max(drag.start - 2, Math.min(drag.start + 2, target));
    stage.classList.remove('is-dragging');
    if (cursor) cursor.classList.remove('is-down');
    var wasLocked = drag.locked;
    drag = null;
    if (wasLocked) animateTo(target);
  }
  on(stage, 'pointerup', endDrag);
  on(stage, 'pointercancel', endDrag);

  on(stage, 'click', function (e) {
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
  }, { capture: true });

  var wheelAcc = 0, wheelLock = 0;
  on(stage, 'wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    var now = performance.now();
    if (now < wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 50) {
      animateTo(Math.round(pos) + (wheelAcc > 0 ? 1 : -1));
      wheelAcc = 0; wheelLock = now + 550;
    }
  }, { passive: false });

  on(window, 'resize', render);

  if (cursor) {
    var lastX = -9999, lastY = -9999, frame = null, visible = false;
    var place = function () { frame = null; cursor.style.translate = lastX + 'px ' + lastY + 'px'; };
    var schedule = function () { if (!frame) frame = requestAnimationFrame(place); };
    var setVisible = function (v) { if (v === visible) return; visible = v; cursor.classList.toggle('is-visible', v); };
    var activeMediaAt = function (x, y) {
      var el = document.elementFromPoint(x, y);
      var m = el && el.closest('.work__media');
      return !!(m && m.parentElement.classList.contains('is-active'));
    };
    var onMove = function (e) {
      if (e.pointerType !== 'mouse' || !fine.matches) return;
      lastX = e.clientX; lastY = e.clientY;
      var v = drag ? visible : activeMediaAt(lastX, lastY);
      if (v && !visible) place(); else schedule();
      setVisible(v);
    };
    on(stage, 'pointermove', onMove);
    on(stage, 'pointerover', onMove);
    on(stage, 'pointerleave', function () { if (!drag) setVisible(false); });
    on(stage, 'pointerup', function () { setTimeout(function () { setVisible(activeMediaAt(lastX, lastY)); }, 0); });
    on(window, 'scroll', function () { if (!drag && lastX > -9999) setVisible(activeMediaAt(lastX, lastY)); }, { passive: true });
  }

  render();
  return function () {
    ac.abort();
    if (anim) cancelAnimationFrame(anim.raf);
    if (cursor) cursor.classList.remove('is-visible', 'is-down');
  };
}

/* ---------- Services: картки наїжджають одна на одну + прилиплий заголовок ---------- */
export function initServices() {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.svc-card'));
  var svc = document.querySelector('.svc');
  var head = document.querySelector('.svc__head');
  if (!svc || !head || cards.length < 1) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  svc.style.setProperty('--n', cards.length);

  var compact = window.matchMedia('(max-width: 1279px)');
  function layout() {
    svc.style.setProperty('--head-h', head.offsetHeight + 'px');
    /* планшет/мобілка: висота карток = найвища картка за вмістом (без порожнього місця знизу) */
    svc.style.removeProperty('--card-h');
    if (compact.matches) {
      var max = 0;
      cards.forEach(function (c) { c.style.height = 'auto'; max = Math.max(max, c.offsetHeight); });
      cards.forEach(function (c) { c.style.height = ''; });
      if (max) svc.style.setProperty('--card-h', Math.ceil(max) + 'px');
    }
    svc.classList.remove('svc--free');
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:calc(var(--head-top) + var(--head-h) + var(--head-gap) + (var(--n) - 1) * var(--peek) + var(--card-h))';
    svc.appendChild(probe);
    var need = probe.offsetHeight;
    svc.removeChild(probe);
    svc.classList.toggle('svc--free', need > window.innerHeight);
  }
  layout();
  on(window, 'resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!ac.signal.aborted) layout(); });

  var SCALE = 0.05, FADE = 0.4, ticking = false;

  function update() {
    ticking = false;
    var p = [];
    for (var j = 0; j < cards.length; j++) {
      if (j === 0) { p.push(0); continue; }
      var c = cards[j];
      var stickTop = parseFloat(getComputedStyle(c).top) || 0;
      var dist = c.getBoundingClientRect().top - stickTop;
      var h = cards[j - 1].offsetHeight;
      p.push(Math.max(0, Math.min(1, 1 - dist / h)));
    }
    for (var i = 0; i < cards.length; i++) {
      var depth = 0;
      for (var k = i + 1; k < cards.length; k++) depth += p[k];
      cards[i].style.transform = depth ? 'scale(' + (1 - depth * SCALE).toFixed(4) + ')' : '';
      cards[i].style.setProperty('--veil', Math.min(0.75, depth * FADE).toFixed(3));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  if (!reduce) {
    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', onScroll);
    update();
  }
  return function () { ac.abort(); };
}

/* ---------- Every site includes: клік + автоперемикання + стрілки ---------- */
export function initFeatures() {
  var root = document.querySelector('[data-feat]');
  if (!root) return function () {};
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.feat__item'));
  if (!tabs.length) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var items = tabs.map(function (t) { return t.parentElement; });
  var panels = Array.prototype.slice.call(root.querySelectorAll('.feat__panelimg'));
  /* на мобільному — акордеон без автоперемикання (інакше сторінка "стрибала б") */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches;
  var DURATION = 5000;
  var current = 0, start = 0, elapsed = 0, raf = null, inView = false, paused = false, hideT = null;

  function show(i, focus) {
    current = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) {
      var isOn = k === current;
      t.classList.toggle('is-active', isOn);
      t.setAttribute('aria-selected', isOn ? 'true' : 'false');
      t.tabIndex = isOn ? 0 : -1;
      if (items[k]) items[k].classList.toggle('is-open', isOn);
      if (panels[k]) {
        panels[k].classList.toggle('is-active', isOn);
        if (isOn) panels[k].hidden = false;
      }
    });
    clearTimeout(hideT);
    hideT = setTimeout(function () { panels.forEach(function (p, k) { if (k !== current) p.hidden = true; }); }, 550);
    items.forEach(function (li) { li.style.setProperty('--p', 0); });
    elapsed = 0; start = performance.now();
    if (focus) tabs[current].focus();
  }

  function tick(now) {
    raf = null;
    if (!inView || paused || reduce) return;
    elapsed += now - start; start = now;
    var p = Math.min(1, elapsed / DURATION);
    items[current].style.setProperty('--p', p.toFixed(3));
    if (p >= 1) show(current + 1);
    raf = requestAnimationFrame(tick);
  }
  function run() { if (!raf && inView && !paused && !reduce) { start = performance.now(); raf = requestAnimationFrame(tick); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  tabs.forEach(function (t, k) {
    on(t, 'click', function () { show(k); });
    on(t, 'keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
      else if (d) { e.preventDefault(); show(current + d, true); }
    });
  });

  on(root, 'mouseenter', function () { paused = true; stop(); });
  on(root, 'mouseleave', function () { paused = false; run(); });
  on(root, 'focusin', function () { paused = true; stop(); });
  on(root, 'focusout', function (e) { if (!root.contains(e.relatedTarget)) { paused = false; run(); } });

  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView) run(); else stop();
    }, { threshold: 0.35 });
    io.observe(root);
  }

  show(0);
  return function () { ac.abort(); stop(); clearTimeout(hideT); if (io) io.disconnect(); };
}

/* ---------- Вибір мови: відкрити/закрити дропдаун ---------- */
export function initLang() {
  var root = document.querySelector('[data-lang]');
  if (!root) return function () {};
  var btn = root.querySelector('.lang__btn');
  var items = Array.prototype.slice.call(root.querySelectorAll('.lang__item'));
  var ac = new AbortController();
  var on = listen(ac.signal);

  function setOpen(open, focusBtn) {
    root.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open && items[0]) items[0].focus();
    if (!open && focusBtn) btn.focus();
  }
  on(btn, 'click', function (e) {
    e.stopPropagation();
    setOpen(!root.classList.contains('is-open'));
  });
  on(document, 'click', function (e) {
    if (root.classList.contains('is-open') && !root.contains(e.target)) setOpen(false);
  });
  on(root, 'keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false, true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var i = items.indexOf(document.activeElement);
      var n = e.key === 'ArrowDown' ? i + 1 : i - 1;
      if (i === -1) { setOpen(true); return; }
      items[(n + items.length) % items.length].focus();
    }
  });
  /* мови без сторінок поки не ведуть нікуди */
  items.forEach(function (a) {
    on(a, 'click', function (e) { if (a.getAttribute('href') === '#') { e.preventDefault(); setOpen(false, true); } });
  });
  return function () { ac.abort(); };
}

/* ---------- Project line: смуги "малюються", коли секцію видно ---------- */
export function initProjectLine() {
  var root = document.querySelector('[data-pl]');
  if (!root) return function () {};
  var bars = root.querySelectorAll('.pl__bar');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = null, io = null;
  function go() {
    root.classList.add('go');
    /* після анімації прибираємо затримки, щоб hover реагував одразу */
    t = setTimeout(function () { root.classList.add('done'); }, reduce ? 0 : 400 + bars.length * 220 + 900);
  }
  /* старт лише коли до секції реально дійшли: графік видно щонайменше на 60%
     (на мобілці, де список довгий, — коли перші етапи вже на екрані) */
  var target = root.querySelector('.pl__gantt') || root;
  if (reduce || !('IntersectionObserver' in window)) { go(); }
  else {
    var mobile = window.matchMedia('(max-width: 767px)').matches;
    var need = mobile ? 0.15 : Math.min(0.6, 0.9 * window.innerHeight / Math.max(1, target.offsetHeight));
    io = new IntersectionObserver(function (en) {
      if (en[0].intersectionRatio >= need - 0.001) { go(); io.disconnect(); }
    }, { threshold: [0, need, 1] });
    io.observe(target);
  }
  return function () { clearTimeout(t); if (io) io.disconnect(); };
}

/* ---------- Clients about us: колода відео-відгуків ----------
   • активне відео грає на фоні без звуку (muted loop)
   • Play — вмикає з початку зі звуком прямо в картці (без модалки)
   • іконка звуку: вимкнений → увімкнений, поки кейс переглядається
   • стрілки / клік по бічній картці / ← → гортають по колу */
export function initTestimonials() {
  var root = document.querySelector('[data-tst]');
  if (!root) return function () {};
  var deck = root.querySelector('.tst__deck');
  var cards = Array.prototype.slice.call(root.querySelectorAll('.tst__card'));
  var n = cards.length;
  if (!n) return function () {};
  var cur = root.querySelector('[data-tst-cur]');
  var ac = new AbortController();
  var on = listen(ac.signal);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = 0, inView = false, loaded = false, raf = null;

  function vid(i) { return cards[i].querySelector('video'); }
  function mod(a, m) { return ((a % m) + m) % m; }

  /* відео підвантажуємо лише коли секція біля екрана */
  function loadAll() {
    if (loaded) return;
    loaded = true;
    cards.forEach(function (c) {
      var v = c.querySelector('video');
      if (v && v.dataset.src && !v.src) { v.src = v.dataset.src; v.load(); }
    });
  }

  function setSound(i, sound) {
    var v = vid(i), c = cards[i];
    if (!v) return;
    v.muted = !sound;
    v.loop = !sound;
    c.classList.toggle('is-sound', sound);
    var btn = c.querySelector('.tst__sound');
    if (btn) btn.setAttribute('aria-label', sound ? (root.dataset.mute || 'Mute') : (root.dataset.unmute || 'Unmute'));
  }

  function playPreview(i) {
    var v = vid(i);
    if (!v) return;
    setSound(i, false);
    if (inView && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }

  function layout() {
    cards.forEach(function (c, i) {
      var o = mod(i - active + Math.floor(n / 2), n) - Math.floor(n / 2);
      if (n === 2 && o !== 0) o = 1;
      var pos = o === 0 ? 'center' : o === -1 ? 'left' : o === 1 ? 'right' : 'hidden';
      c.dataset.pos = pos;
      c.setAttribute('aria-hidden', pos === 'center' ? 'false' : 'true');
      var v = c.querySelector('video');
      if (i !== active && v) { setSound(i, false); v.pause(); c.classList.remove('is-playing'); }
    });
    if (cur) cur.textContent = active + 1;
    playPreview(active);
  }

  function go(i) { active = mod(i, n); layout(); }

  /* смужки прогресу: попередні — повні, поточна — за часом відео */
  function tick() {
    raf = null;
    var v = vid(active);
    var bars = cards[active].querySelectorAll('.tst__bars i');
    for (var k = 0; k < bars.length; k++) {
      var p = k < active ? 1 : k > active ? 0 : (v && v.duration ? v.currentTime / v.duration : 0);
      bars[k].style.setProperty('--p', p.toFixed(4));
    }
    if (inView) raf = requestAnimationFrame(tick);
  }

  cards.forEach(function (c, i) {
    var v = c.querySelector('video');
    if (v) {
      on(v, 'playing', function () { c.classList.add('is-ready', 'is-playing'); });
      on(v, 'pause', function () { c.classList.remove('is-playing'); });
      /* після перегляду зі звуком — назад у тихий фон */
      on(v, 'ended', function () { if (i === active) { v.currentTime = 0; playPreview(i); } });
    }
    /* клік по бічній картці — вона стає активною */
    on(c, 'click', function (e) {
      if (c.dataset.pos !== 'center') { e.preventDefault(); go(i); }
    });
    var play = c.querySelector('.tst__play');
    on(play, 'click', function (e) {
      e.stopPropagation();
      if (c.dataset.pos !== 'center' || !v) return;
      loadAll();
      if (!c.classList.contains('is-sound')) v.currentTime = 0;
      setSound(i, true);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    /* клік по відео під час перегляду зі звуком — пауза / продовження */
    on(v, 'click', function () {
      if (c.dataset.pos !== 'center' || !c.classList.contains('is-sound')) return;
      if (v.paused) v.play(); else v.pause();
    });
    var snd = c.querySelector('.tst__sound');
    on(snd, 'click', function (e) {
      e.stopPropagation();
      if (!v) return;
      loadAll();
      var turnOn = !c.classList.contains('is-sound');
      setSound(i, turnOn);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  });

  on(root.querySelector('[data-tst-prev]'), 'click', function () { go(active - 1); });
  on(root.querySelector('[data-tst-next]'), 'click', function () { go(active + 1); });
  on(deck, 'keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  });

  /* свайп на тачі */
  var sx = null;
  on(deck, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  on(deck, 'touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* відео грають лише поки секцію видно; при виході — пауза і без звуку */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView) { loadAll(); playPreview(active); if (!raf) raf = requestAnimationFrame(tick); }
      else { cards.forEach(function (c, i) { var v = vid(i); if (v) { setSound(i, false); v.pause(); } }); }
    }, { rootMargin: '200px 0px', threshold: 0.15 });
    io.observe(root);
  } else { inView = true; loadAll(); }

  layout();
  return function () {
    ac.abort();
    if (io) io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    cards.forEach(function (c, i) { var v = vid(i); if (v) v.pause(); });
  };
}

/* ---------- FAQ: акордеон (відкрите одне питання) ---------- */
export function initFaq() {
  var list = document.querySelector('[data-faq]');
  if (!list) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var items = Array.prototype.slice.call(list.querySelectorAll('.qa'));
  items.forEach(function (qa) {
    var b = qa.querySelector('.qa__q');
    on(b, 'click', function () {
      var open = !qa.classList.contains('is-open');
      items.forEach(function (x) { x.classList.remove('is-open'); x.querySelector('.qa__q').setAttribute('aria-expanded', 'false'); });
      if (open) { qa.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });
  return function () { ac.abort(); };
}

/* ---------- Поп-ап заявки: усі кнопки з data-open-quote і посилання на #contact ---------- */
export function initQuote() {
  var md = document.querySelector('[data-quote]');
  if (!md) return function () {};
  var ac = new AbortController();
  var on = listen(ac.signal);
  var html = document.documentElement;
  var form = md.querySelector('form');
  var nameIn = md.querySelector('#qf-name');
  var cIn = md.querySelector('#qf-contact');
  var mIn = form.querySelector('[name="method"]');
  var chips = Array.prototype.slice.call(md.querySelectorAll('.qf__chip'));
  var send = form.querySelector('.qf__send');
  var fab = document.querySelector('[data-fab]');
  var hint = function (k, t) { var el = md.querySelector('[data-hint="' + k + '"]'); if (el) el.textContent = t || ''; };
  var last = null;

  var openedAt = 0;
  function open(e) {
    if (e) e.preventDefault();
    openedAt = Date.now();
    last = document.activeElement;
    md.classList.remove('is-sent');
    md.classList.add('is-open');
    md.setAttribute('aria-hidden', 'false');
    html.classList.add('is-locked');
    if (window.__lenis) window.__lenis.stop();
    setTimeout(function () { nameIn.focus(); }, 150);
  }
  function close() {
    md.classList.remove('is-open');
    md.setAttribute('aria-hidden', 'true');
    html.classList.remove('is-locked');
    if (window.__lenis) window.__lenis.start();
    if (last && last.focus) last.focus();
  }

  /* відкриття: делегування, тож працює і для кнопок, доданих пізніше */
  on(document, 'click', function (e) {
    var t = e.target.closest('[data-open-quote], a[href="#contact"], a[href="/#contact"]');
    if (t) open(e);
  });
  md.querySelectorAll('[data-close]').forEach(function (b) { on(b, 'click', close); });
  on(document, 'keydown', function (e) {
    if (!md.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(md.querySelectorAll('button,input:not([type=hidden]):not(.qf__hp),textarea')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });

  var L = {}; try { L = JSON.parse(md.dataset.i18n || '{}'); } catch (err) {}
  var METHODS = {
    telegram: { ph: L.telegramPh || 'Telegram username, e.g. @name', type: 'text', mode: 'text', ac: 'off', check: function (v) { return /^@?[A-Za-z0-9_]{4,32}$/.test(v) || v.replace(/\D/g, '').length >= 9; }, err: L.telegramErr || 'Enter your Telegram username, e.g. @name' },
    instagram: { ph: L.instagramPh || 'Instagram handle, e.g. @name', type: 'text', mode: 'text', ac: 'off', check: function (v) { return /^@?[A-Za-z0-9._]{2,30}$/.test(v); }, err: L.instagramErr || 'Enter your Instagram handle, e.g. @name' },
    whatsapp: { ph: L.whatsappPh || 'WhatsApp, e.g. +48 600 000 000', type: 'tel', mode: 'tel', ac: 'tel', check: function (v) { return v.replace(/\D/g, '').length >= 9; }, err: L.whatsappErr || 'Enter a phone number with country code' },
    email: { ph: L.emailPh || 'Email, e.g. name@company.com', type: 'email', mode: 'email', ac: 'email', check: function (v) { return /^\S+@\S+\.\S+$/.test(v); }, err: L.emailErr || 'Enter a valid email address' },
  };
  var method = 'telegram';
  function setMethod(k, focus) {
    method = k; mIn.value = k;
    chips.forEach(function (c) { var isOn = c.dataset.k === k; c.setAttribute('aria-checked', String(isOn)); c.tabIndex = isOn ? 0 : -1; });
    var m = METHODS[k];
    cIn.placeholder = m.ph; cIn.type = m.type; cIn.inputMode = m.mode; cIn.autocomplete = m.ac;
    cIn.classList.remove('is-err'); hint('contact');
    if (focus) cIn.focus();
  }
  chips.forEach(function (c, i) {
    on(c, 'click', function () { setMethod(c.dataset.k, true); });
    on(c, 'keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = chips[(i + d + chips.length) % chips.length];
      setMethod(n.dataset.k); n.focus();
    });
  });
  setMethod('telegram');

  on(form, 'submit', function (e) {
    e.preventDefault();
    var ok = true;
    if (!nameIn.value.trim()) { nameIn.classList.add('is-err'); hint('name', L.errName || 'Please enter your name'); ok = false; }
    else { nameIn.classList.remove('is-err'); hint('name'); }
    var m = METHODS[method], v = cIn.value.trim();
    if (!m.check(v)) { cIn.classList.add('is-err'); hint('contact', m.err); ok = false; }
    else { cIn.classList.remove('is-err'); hint('contact'); }
    hint('form');
    if (!ok) { (nameIn.classList.contains('is-err') ? nameIn : cIn).focus(); return; }

    var data = {};
    new FormData(form).forEach(function (val, key) { data[key] = String(val); });
    data.t = Date.now() - openedAt;                       /* скільки часу заповнювали — проти ботів */
    if (data['cf-turnstile-response']) { data.turnstile = data['cf-turnstile-response']; delete data['cf-turnstile-response']; }
    send.disabled = true;
    fetch('/api/quote.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return r.ok && j.ok; }); })
      .catch(function () { return false; })
      .then(function (sent) {
        send.disabled = false;
        if (window.turnstile && window.turnstile.reset) { try { window.turnstile.reset(); } catch (err) {} }
        if (sent) { md.classList.add('is-sent'); form.reset(); setMethod('telegram'); }
        else hint('form', L.errSend || "Couldn't send the request. Please try again or write to me directly.");
      });
  });

  /* плаваюча кнопка: з'являється, щойно кнопка "Get a free quote" у hero зникає з екрана
     (ніби вона "прилипає" до низу), і ховається над футером, де є своя кнопка */
  var io = null, io2 = null, io3 = null, ftVisible = false, heroVisible = true, svcVisible = false;
  var heroCta = document.querySelector('.hero .cta');
  /* у блоці послуг кнопку ховаємо — там у кожній картці своя кнопка, і плаваюча її закривала б */
  /* на мобільному кнопка з'являється лише тоді, коли блок послуг закінчився і ми прокрутили ще ~50px
     (тобто вже видно секцію "Every site includes"); на першому екрані її немає */
  var mq = window.matchMedia('(max-width:767px)');
  var svcBox = document.querySelector('.svc');
  function pastSvc() {
    if (!svcBox) return true;
    var fabTop = fab ? fab.getBoundingClientRect().top : window.innerHeight;
    if (fab && !fab.classList.contains('is-shown')) fabTop = window.innerHeight - fab.offsetHeight - 16;
    return svcBox.getBoundingClientRect().bottom < fabTop - 50;
  }
  var lastUndocked = false;
  function upd() {
    if (!fab) return;
    /* ноут/десктоп: щойно почали скролити з hero — кнопка "з'їжджає" вниз і лишається на всіх секціях,
       крім футера (Idea → Reality), де є своя кнопка */
    /* мобільний: з hero кнопка теж "з'їжджає" вниз і видна на кейсах; на послугах ховається
       (там у кожній картці своя кнопка) і знову з'являється після них */
    /* ховаємо, коли перша картка послуг доходить до кнопки */
    var svcFirst = svcBox && (svcBox.querySelector('.svc-card') || svcBox);
    var fabTopNow = window.innerHeight - (fab ? fab.offsetHeight : 0) - 16;
    var beforeSvc = !svcFirst || svcFirst.getBoundingClientRect().top > fabTopNow;
    /* мобільний: кнопка не піднімається вище свого місця в hero. Поки її місце в hero нижче
       плаваючої позиції — видно саму кнопку hero; щойно воно доходить до низу екрана,
       кнопка «прилипає» і далі їде як плаваюча (і навпаки при скролі вгору) */
    var undocked = window.scrollY > 4;
    if (mq.matches && heroCta) {
      var fabSpot = window.innerHeight - (parseFloat(getComputedStyle(fab).bottom) || 0) - fab.offsetHeight;
      undocked = heroCta.getBoundingClientRect().top <= fabSpot + 1;
    }
    var show = mq.matches
      ? (!ftVisible && (pastSvc() || (undocked && beforeSvc)))
      : (undocked && !ftVisible);
    if (mq.matches && undocked !== lastUndocked) {
      /* перехід hero ↔ плаваюча — миттєвий, без фейду */
      html.classList.add('fab-instant');
      requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.remove('fab-instant'); }); });
    }
    lastUndocked = undocked;
    fab.classList.toggle('is-shown', show);
    html.classList.toggle('fab-on', undocked);
  }
  if (fab) {
    window.addEventListener('scroll', upd, { passive: true, signal: ac.signal });
    window.addEventListener('resize', upd, { passive: true, signal: ac.signal });
  }
  var ft = document.querySelector('.ft__card');
  if (fab && 'IntersectionObserver' in window) {
    if (ft) { io = new IntersectionObserver(function (en) { ftVisible = en[0].isIntersecting; upd(); }, { threshold: 0.2 }); io.observe(ft); }
    if (heroCta) { io2 = new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; upd(); }, { threshold: 0 }); io2.observe(heroCta); }
    var svcEl = document.querySelector('.svc');
    if (svcEl) { io3 = new IntersectionObserver(function (en) { svcVisible = en[0].isIntersecting; upd(); }, { threshold: 0 }); io3.observe(svcEl); }
    else heroVisible = false;
  }
  upd();

  return function () { ac.abort(); if (io) io.disconnect(); if (io2) io2.disconnect(); if (io3) io3.disconnect(); html.classList.remove('is-locked', 'fab-on', 'fab-instant'); };
}


/* ---------- Плавний скрол (Lenis) + плавні переходи по якорях меню ---------- */
export function initSmoothScroll() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ac = new AbortController();
  var on = listen(ac.signal);
  var lenis = null, raf = null;
  if (!reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    var loop = function (time) { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  function offset() {
    var v = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return isNaN(v) ? 0 : v;
  }

  /* усі посилання на #секцію (крім #contact — він відкриває поп-ап) */
  on(document, 'click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var hash = href.slice(href.indexOf('#'));
    var samePage = href.charAt(0) === '#' || (href.indexOf('/#') === 0 && location.pathname === '/');
    if (!samePage || hash === '#' || hash === '#contact') return;
    var el = document.querySelector(hash);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -offset(), duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', hash);
  });

  return function () {
    ac.abort();
    if (raf) cancelAnimationFrame(raf);
    if (lenis) { lenis.destroy(); if (window.__lenis === lenis) window.__lenis = null; }
  };
}
