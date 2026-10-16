/* CRM deweb.studio: вхід, зустрічі, клієнти, утримання (домени й сервери), налаштування. Дані — /crm/api.php. Без бібліотек. */
(() => {
  "use strict";
  const app = document.getElementById("app");
  const TZ = "Europe/Warsaw";
  const STATUS = { new: "Новий", contacted: "На зв'язку", call: "Дзвінок", proposal: "Пропозиція", won: "В роботі", lost: "Закрито" };
  const MSTATUS = { scheduled: "Заплановано", done: "Відбулась", cancelled: "Скасовано", no_show: "Не прийшов" };
  const SOURCE = { manual: "вручну", chat: "AI-чат", form: "форма", audit: "перевірка сайту" };
  const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  let S = null; // стан з сервера
  let clientFilter = { q: "", status: "" };

  /* ---------- утиліти ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className = v;
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }
  async function api(action, data) {
    try {
      const r = await fetch("/crm/api.php", { method: "POST", headers: { "Content-Type": "application/json", "X-CRM": "1" }, credentials: "same-origin", body: JSON.stringify({ action, ...data }) });
      const j = await r.json().catch(() => ({ ok: false, error: "server" }));
      if (j.error === "auth" && action !== "state") { S = null; route(); }
      return j;
    } catch { return { ok: false, error: "network" }; }
  }
  function toast(text) {
    const t = h("div", { class: "toast", role: "status" }, text);
    document.body.append(t);
    setTimeout(() => t.remove(), 3200);
  }
  const fmt = (ts, o) => new Intl.DateTimeFormat("uk-UA", { timeZone: TZ, ...o }).format(new Date(ts * 1000));
  const fTime = (ts) => fmt(ts, { hour: "2-digit", minute: "2-digit" });
  const fDate = (ts) => fmt(ts, { day: "numeric", month: "long", weekday: "short" });
  const fShort = (ts) => fmt(ts, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const ymd = (ts) => fmt(ts, { year: "numeric", month: "2-digit", day: "2-digit" }).split(".").reverse().join("-");
  const hm = (ts) => fTime(ts);
  function dayLabel(ts) {
    const today = ymd(Date.now() / 1000), d = ymd(ts), tomorrow = ymd(Date.now() / 1000 + 86400);
    return d === today ? "Сьогодні · " + fDate(ts) : d === tomorrow ? "Завтра · " + fDate(ts) : fDate(ts);
  }
  const clientById = (id) => S.clients.find((c) => c.id === id);
  const badge = (key, label) => h("span", { class: "badge badge--" + key }, label);
  function field(label, input) { return h("label", null, h("span", null, label), input); }

  /* ---------- вхід і перше налаштування ---------- */
  function authView(configured) {
    app.replaceChildren();
    if (!configured) return setupView();
    const pw = h("input", { type: "password", autocomplete: "current-password", required: true });
    const otp = h("input", { type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", class: "otp", placeholder: "000000", required: true });
    const err = h("p", { class: "err", role: "alert" });
    const btn = h("button", { class: "btn", type: "submit" }, "Увійти");
    const form = h("form", { class: "panel", onsubmit: async (e) => {
      e.preventDefault(); btn.disabled = true; err.textContent = "";
      const r = await api("login", { password: pw.value, totp: otp.value });
      btn.disabled = false;
      if (r.ok) return load();
      err.textContent = { locked: "Забагато спроб. Спробуй за 15 хвилин.", wrong: "Невірний пароль або код." }[r.error] || "Помилка, спробуй ще раз.";
      otp.value = "";
    } },
      h("h1", null, "deweb", h("b", null, "."), "studio / CRM"),
      h("input", { type: "hidden", autocomplete: "username", value: "crm" }),
      field("Пароль", pw), field("Код з Google Authenticator", otp), err, btn);
    app.append(h("main", { class: "auth" }, form));
    pw.focus();
  }

  function setupView() {
    const box = h("div", { class: "panel" });
    app.append(h("main", { class: "auth" }, box));
    const step1 = () => {
      const err = h("p", { class: "err", role: "alert" });
      const btn = h("button", { class: "btn", onclick: async () => {
        btn.disabled = true; err.textContent = "";
        const r = await api("setup_send", {});
        btn.disabled = false;
        if (r.ok) return step2();
        err.textContent = { wait: "Код уже надіслано, зачекай хвилину.", telegram: "Не вдалося надіслати в Telegram: перевір ключі бота." }[r.error] || "Помилка.";
      } }, "Надіслати код у Telegram");
      box.replaceChildren(h("h1", null, "Налаштування CRM"),
        h("p", { class: "muted" }, "Крок 1 з 3. Щоб ніхто інший не зміг створити доступ, код прийде в твій Telegram-бот."), err, btn);
    };
    const step2 = () => {
      const code = h("input", { type: "text", inputmode: "numeric", maxlength: "6", class: "otp", placeholder: "000000", autocomplete: "one-time-code" });
      const pw = h("input", { type: "password", autocomplete: "new-password", minlength: "10" });
      const pw2 = h("input", { type: "password", autocomplete: "new-password" });
      const err = h("p", { class: "err", role: "alert" });
      const btn = h("button", { class: "btn", type: "submit" }, "Далі");
      box.replaceChildren(h("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault(); err.textContent = "";
        if (pw.value.length < 10) return (err.textContent = "Пароль — щонайменше 10 символів.");
        if (pw.value !== pw2.value) return (err.textContent = "Паролі не збігаються.");
        btn.disabled = true;
        const r = await api("setup_verify", { code: code.value, password: pw.value });
        btn.disabled = false;
        if (r.ok) return step3(r);
        err.textContent = { code: "Невірний код.", expired: "Код застарів, почни спочатку.", weak: "Пароль закороткий." }[r.error] || "Помилка.";
        if (r.error === "expired") setTimeout(step1, 1500);
      } },
        h("h1", null, "Налаштування CRM"), h("p", { class: "muted" }, "Крок 2 з 3. Введи код з Telegram і придумай пароль."),
        field("Код з Telegram", code), field("Новий пароль (від 10 символів)", pw), field("Ще раз пароль", pw2), err, btn));
      code.focus();
    };
    const step3 = (r) => {
      const qr = h("div", { class: "qr" });
      try { const q = qrcode(0, "M"); q.addData(r.uri); q.make(); qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
      catch { qr.append(h("a", { href: r.uri }, "Відкрити в застосунку")); }
      const otp = h("input", { type: "text", inputmode: "numeric", maxlength: "6", class: "otp", placeholder: "000000", autocomplete: "one-time-code" });
      const err = h("p", { class: "err", role: "alert" });
      const btn = h("button", { class: "btn", type: "submit" }, "Завершити");
      box.replaceChildren(h("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault(); btn.disabled = true; err.textContent = "";
        const x = await api("setup_finish", { totp: otp.value });
        btn.disabled = false;
        if (x.ok) return load();
        err.textContent = x.error === "totp" ? "Код не підходить. Перевір, що час на телефоні правильний." : "Час вийшов, почни спочатку.";
      } },
        h("h1", null, "Налаштування CRM"),
        h("p", { class: "muted" }, "Крок 3 з 3. Відкрий Google Authenticator (або 1Password, Authy), натисни «+» і відскануй код. Потім введи 6 цифр, які покаже застосунок."),
        qr, h("p", { class: "small muted" }, "Якщо сканувати незручно, введи ключ вручну:"), h("div", { class: "secret" }, r.secret),
        field("Код із застосунку", otp), err, btn));
    };
    step1();
  }

  /* ---------- основний екран ---------- */
  function shell(active, body, wide) {
    const tab = (id, label) => h("a", { href: "#" + id, "aria-current": active === id ? "page" : null }, label);
    app.replaceChildren(h("div", { class: "wrap" + (wide ? " wrap--wide" : "") },
      h("header", { class: "top" },
        h("h1", null, "deweb", h("b", null, "."), "studio / CRM"),
        h("span", { class: "spacer" }),
        h("nav", { class: "tabs" }, tab("meetings", "Зустрічі"), tab("clients", "Клієнти"), tab("retention", "Утримання"), tab("sites", "Сайти"), tab("settings", "Налаштування")),
        h("button", { class: "btn btn--sm", onclick: () => meetingDialog() }, "+ Зустріч"),
        h("button", { class: "btn btn--sm btn--ghost", onclick: () => clientDialog() }, "+ Клієнт")),
      body));
  }

  function meetingItem(m, withDate) {
    const c = m.client_id ? clientById(m.client_id) : null;
    return h("button", { class: "item", onclick: () => meetingDialog(m) },
      h("span", { class: "time" }, withDate ? fShort(m.start_at) : hm(m.start_at)),
      h("span", { class: "item__main" }, h("b", null, c ? c.name : "Без клієнта"), h("span", null, [m.topic, m.minutes + " хв", SOURCE[m.source]].filter(Boolean).join(" · "))),
      m.status !== "scheduled" ? badge(m.status, MSTATUS[m.status]) : null,
      m.meet_url && m.status === "scheduled" ? h("a", { class: "btn btn--sm", href: m.meet_url, target: "_blank", rel: "noopener", onclick: (e) => e.stopPropagation() }, "Meet") : null);
  }

  /* ---------- спільне для «Зустрічей» і «Клієнтів» ---------- */
  const COLORS = ["#5E6CFF", "#16935F", "#B9770E", "#9a4cc0", "#D04545", "#0E8FA8", "#C2549A", "#4B5563"];
  const SCOLOR = { new: "#5E6CFF", contacted: "#0E8FA8", call: "#B9770E", proposal: "#9a4cc0", won: "#16935F", lost: "#9AA0B8" };
  const SRCCLS = { chat: "src--chat", form: "src--form", audit: "src--audit" };
  const ui = { day: "", cView: (() => { try { return localStorage.getItem("crm_cview") === "list" ? "list" : "board"; } catch { return "board"; } })(), src: "", drawer: 0, slots: null, slotsAt: 0 };
  const now = () => Date.now() / 1000;
  const initials = (n) => (n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const avatar = (c, lg) => h("span", { class: "av" + (lg ? " av--lg" : ""), style: "background:" + COLORS[(c ? c.id : 0) % COLORS.length], "aria-hidden": "true" }, initials(c ? c.name : ""));
  const srcBadge = (s) => h("span", { class: "badge " + (SRCCLS[s] || "") }, SOURCE[s] || s || "вручну");
  const statusBadge = (s) => h("span", { class: "badge", style: `color:${SCOLOR[s]};background:${SCOLOR[s]}1f` }, STATUS[s] || s);
  const weekday = (d) => { const n = new Date(d + "T12:00:00Z").getUTCDay(); return n || 7; };
  const ago = (ts) => { const d = Math.round((Date.parse(ymd(now()) + "T00:00:00Z") - Date.parse(ymd(ts) + "T00:00:00Z")) / 864e5); return d <= 0 ? "сьогодні" : d === 1 ? "вчора" : d + " дн. тому"; };
  const nextCall = (id) => S.meetings.filter((m) => m.client_id === id && m.status === "scheduled" && m.start_at + m.minutes * 60 > now()).sort((a, b) => a.start_at - b.start_at)[0];
  const meetLink = (m, cls, label) => h("a", { class: cls, href: m.meet_url, target: "_blank", rel: "noopener", onclick: (e) => e.stopPropagation() }, label);
  function countdown(ts) {
    const min = Math.round((ts - now()) / 60);
    if (min <= 0) return ["зараз", ""];
    if (min < 60) return [min + " хв", "через"];
    if (min < 1440) return [Math.round(min / 60) + " год", "через"];
    return [Math.round(min / 1440) + " дн.", "через"];
  }
  async function setMeetingStatus(m, status) {
    const r = await api("meeting_save", { meeting: { id: m.id, minutes: m.minutes, topic: m.topic, notes: m.notes, status, meet_url: m.meet_url } });
    if (!r.ok) return toast("Не вдалося зберегти");
    S = r;
    if (status === "done" && m.client_id) { ui.drawer = m.client_id; toast("Позначено. Можеш дописати нотатку в картці клієнта."); }
    else toast(status === "done" ? "Позначено: відбулась" : "Позначено: не прийшов");
    render();
  }
  async function setClientStatus(c, status) {
    if (c.status === status) return;
    const r = await api("client_save", { id: c.id, client: { status } });
    if (!r.ok) return toast("Не вдалося змінити статус");
    S = r; render(); toast((c.name || "Клієнт") + ": " + STATUS[status]);
  }
  async function loadSlots() {
    if (ui.slotsAt && Date.now() - ui.slotsAt < 120000) return;
    ui.slotsAt = Date.now();
    const r = await api("free_slots", {});
    ui.slots = r.ok ? r.slots : "error";
    if ((location.hash.slice(1) || "meetings").startsWith("meetings")) render();
  }

  /* ---------- Зустрічі ---------- */
  function meetingsView() {
    const t = now();
    const upcoming = S.meetings.filter((m) => m.status === "scheduled" && m.start_at + m.minutes * 60 > t).sort((a, b) => a.start_at - b.start_at);
    const unresolved = S.meetings.filter((m) => m.status === "scheduled" && m.start_at + m.minutes * 60 <= t).sort((a, b) => b.start_at - a.start_at);
    const archive = S.meetings.filter((m) => m.status !== "scheduled").sort((a, b) => b.start_at - a.start_at).slice(0, 40);
    const today = ymd(t), tomorrow = ymd(t + 86400);
    const days = [...Array(7)].map((_, i) => ymd(t + i * 86400));
    const week = upcoming.filter((m) => days.includes(ymd(m.start_at))).length;
    const newLeads = S.clients.filter((c) => c.status === "new");
    const freshLeads = S.clients.filter((c) => c.created_at > t - 7 * 86400).length;
    const fromChat = S.meetings.filter((m) => m.source === "chat" && m.start_at > t - 30 * 86400).length;

    /* найближча зустріч */
    const nx = upcoming[0], nc = nx && nx.client_id ? clientById(nx.client_id) : null;
    let hero = null;
    if (nx) {
      const [big, small] = countdown(nx.start_at);
      const note = (nx.notes || (nc && nc.notes) || "").split("\n").find((l) => l.trim()) || "";
      hero = h("section", { class: "m-next" },
        h("div", { class: "m-next__when" }, h("span", null, small || "триває"), h("b", { class: "num" }, big), h("span", { class: "num" }, (ymd(nx.start_at) === today ? "" : fShort(nx.start_at) + " ") + hm(nx.start_at))),
        h("div", { class: "m-next__main" },
          h("div", { class: "eyebrow" }, "Наступна зустріч"),
          h("h2", null, nc ? [nc.name, nc.company].filter(Boolean).join(" · ") : "Без клієнта"),
          h("div", { class: "m-next__meta" }, [nx.topic, nx.minutes + " хв", SOURCE[nx.source]].filter(Boolean).join(" · ")),
          note ? h("div", { class: "m-next__note" }, "📝 " + note) : null),
        h("div", { class: "row" },
          nx.meet_url ? meetLink(nx, "btn", "Приєднатися до Meet") : null,
          nc ? h("button", { class: "btn btn--light", onclick: () => openClient(nc.id) }, "Картка клієнта") : null,
          h("button", { class: "btn btn--light", onclick: () => meetingDialog(nx) }, "Деталі")));
    }

    const stat = (n, l, extra) => h("div", { class: "panel kpi" }, h("b", { class: "num" }, n), h("span", null, l), extra ? h("i", null, " " + extra) : null);

    /* тиждень і розклад */
    if (ui.day && !days.includes(ui.day)) ui.day = "";
    const strip = h("div", { class: "m-week" }, days.map((d) => {
      const n = upcoming.filter((m) => ymd(m.start_at) === d).length;
      const ts = Date.parse(d + "T12:00:00Z") / 1000;
      const off = !S.schedule.days.includes(weekday(d)) || S.schedule.blocked.includes(d);
      return h("button", { class: "m-day" + (off ? " off" : ""), "aria-pressed": String(ui.day === d), title: off ? "Неробочий день у графіку" : null,
        onclick: () => { ui.day = ui.day === d ? "" : d; render(); } },
        h("small", null, d === today ? "сьогодні" : fmt(ts, { weekday: "short" })), h("b", { class: "num" }, fmt(ts, { day: "numeric" })),
        h("span", { class: "dots" }, [...Array(Math.min(n, 4))].map(() => h("i"))));
    }));
    const shown = ui.day ? upcoming.filter((m) => ymd(m.start_at) === ui.day) : upcoming;
    const agenda = h("div", { class: "m-agenda" });
    let lastDay = "";
    for (const m of shown) {
      const c = m.client_id ? clientById(m.client_id) : null, d = ymd(m.start_at);
      if (d !== lastDay) { agenda.append(h("div", { class: "m-dhead" }, dayLabel(m.start_at))); lastDay = d; }
      agenda.append(h("button", { class: "m-slot", onclick: () => (c ? openClient(c.id) : meetingDialog(m)) },
        h("span", { class: "m-slot__t num" }, hm(m.start_at), h("small", null, m.minutes + " хв")),
        h("span", { class: "m-slot__bar", style: "background:" + COLORS[(c ? c.id : 0) % COLORS.length] }),
        h("span", { class: "who" }, avatar(c), h("span", { class: "who__txt" }, h("b", null, c ? c.name : "Без клієнта"), h("span", null, [c && c.company, m.topic].filter(Boolean).join(" · ") || "—"))),
        h("span", { class: "m-slot__act row" }, srcBadge(m.source),
          m.meet_url ? meetLink(m, "btn btn--sm", "Meet") : h("span", { class: "badge badge--soon" }, "без Meet"),
          h("span", { class: "icon-btn", role: "button", tabindex: "0", title: "Змінити зустріч", "aria-label": "Змінити зустріч",
            onclick: (e) => { e.stopPropagation(); meetingDialog(m); }, onkeydown: (e) => { if (e.key === "Enter") { e.stopPropagation(); meetingDialog(m); } } }, "✎"))));
    }
    if (!shown.length) agenda.append(h("p", { class: "empty" }, ui.day ? "У цей день зустрічей немає." : "Запланованих зустрічей немає."));

    /* бокова колонка */
    const review = h("section", { class: "panel side-box" },
      h("h3", null, "Як пройшло? ", unresolved.length ? h("span", { class: "badge badge--soon num" }, unresolved.length) : null),
      unresolved.length
        ? [h("p", { class: "small muted" }, "Минулі дзвінки без підсумку. Один клік, і зустріч піде в архів."),
          h("div", { class: "todo" }, unresolved.slice(0, 6).map((m) => {
            const c = m.client_id ? clientById(m.client_id) : null;
            return h("div", { class: "todo__it" },
              h("button", { class: "who who--btn", onclick: () => (c ? openClient(c.id) : meetingDialog(m)) }, avatar(c),
                h("span", { class: "who__txt" }, h("b", null, c ? c.name : "Без клієнта"), h("span", null, fShort(m.start_at) + ", " + hm(m.start_at) + (m.topic ? " · " + m.topic : "")))),
              h("div", { class: "row" },
                h("button", { class: "btn btn--sm", onclick: () => setMeetingStatus(m, "done") }, "Відбулась"),
                h("button", { class: "btn btn--ghost btn--sm", onclick: () => setMeetingStatus(m, "no_show") }, "Не прийшов")));
          }))]
        : h("p", { class: "small muted" }, "Усі минулі дзвінки підсумовані 👌"));

    if (ui.slots == null || Date.now() - ui.slotsAt > 120000) loadSlots();
    const sl = ui.slots;
    const slotDay = Array.isArray(sl) && sl.length ? ymd(sl[0]) : "";
    const free = h("section", { class: "panel side-box" },
      h("h3", null, "Вільні вікна" + (slotDay ? " · " + (slotDay === today ? "сьогодні" : slotDay === tomorrow ? "завтра" : fDate(sl[0])) : "")),
      h("p", { class: "small muted" }, "Саме їх AI-агент зараз пропонує клієнтам на сайті."),
      sl == null ? h("p", { class: "small muted" }, "Рахую…")
        : sl === "error" ? h("p", { class: "small err" }, "Не вдалося отримати зайнятість з Google Календаря.")
        : sl.length ? h("div", { class: "free" }, sl.slice(0, 12).map((ts) => h("span", { class: "num" }, hm(ts))), sl.length > 12 ? h("em", null, "ще " + (sl.length - 12)) : null)
        : h("p", { class: "small muted" }, "Вільних вікон на найближчі два тижні немає."),
      h("a", { class: "small", href: "#settings" }, "Змінити графік →"));

    const leads = newLeads.slice().sort((a, b) => b.created_at - a.created_at);
    const leadsBox = h("section", { class: "panel side-box" },
      h("h3", null, "Нові заявки ", leads.length ? h("span", { class: "badge badge--new num" }, leads.length) : null),
      leads.length ? h("div", { class: "todo" }, leads.slice(0, 5).map((c) => h("button", { class: "lead", onclick: () => openClient(c.id) },
        h("span", { class: "who" }, avatar(c), h("span", { class: "who__txt" }, h("b", null, c.name || "Без імені"), h("span", null, (c.notes || c.company || c.email || "").split("\n")[0] || ago(c.created_at)))),
        srcBadge(c.source))))
        : h("p", { class: "small muted" }, "Нових заявок немає."),
      leads.length > 5 ? h("a", { class: "small", href: "#clients" }, "Усі заявки →") : null);

    shell("meetings", h("div", { class: "wrap wrap--wide" },
      hero,
      googleBanner(),
      h("div", { class: "kpis" }, stat(upcoming.length, "заплановано"), stat(week, "за 7 днів"), stat(newLeads.length, "нових заявок", freshLeads ? "+" + freshLeads + " за тиждень" : ""), stat(fromChat, "записів через AI-чат за 30 днів")),
      h("div", { class: "m-grid" },
        h("section", { class: "panel m-sched" },
          h("div", { class: "row" }, h("h2", null, "Розклад"), h("span", { class: "spacer" }), ui.day ? h("button", { class: "btn btn--ghost btn--sm", onclick: () => { ui.day = ""; render(); } }, "Показати всі") : null),
          strip, agenda,
          archive.length ? h("details", { class: "m-archive" }, h("summary", null, "Минулі й скасовані · " + archive.length), h("div", { class: "sub-list" }, archive.map((m) => meetingItem(m, true)))) : null),
        h("aside", { class: "m-side" }, review, free, leadsBox))), true);
  }

  function googleBanner() {
    if (S.google.on && !S.google.error) return null;
    return h("div", { class: "panel small" },
      S.google.error ? "Google Календар відключився (доступ відкликано або минув). " : "Google Календар ще не підключений, тому зустрічі створюються без посилання на Meet. ",
      h("a", { href: "#settings" }, "Підключити в налаштуваннях"));
  }

  /* ---------- Клієнти ---------- */
  function clientsView() {
    const q = clientFilter.q.trim().toLowerCase();
    const rows = S.clients.filter((c) => (!ui.src || c.source === ui.src)
      && (!q || [c.name, c.company, c.email, c.phone, c.contact, c.notes].join(" ").toLowerCase().includes(q)));
    const counts = {};
    for (const c of S.clients) counts[c.status] = (counts[c.status] || 0) + 1;
    const max = Math.max(1, ...Object.values(counts));
    const funnel = h("section", { class: "c-funnel" }, Object.entries(STATUS).map(([k, l]) => h("div", null,
      h("b", { class: "num" }, counts[k] || 0), h("span", null, l),
      h("div", { class: "c-funnel__bar" }, h("i", { style: `width:${((counts[k] || 0) / max) * 100}%;background:${SCOLOR[k]}` })))));

    const search = h("input", { type: "search", placeholder: "Пошук: ім'я, компанія, email, нотатки", value: clientFilter.q, oninput: (e) => { clientFilter.q = e.target.value; render(true); } });
    const srcs = [["", "Усі джерела"], ...Object.entries(SOURCE).filter(([k]) => k === "manual" || S.clients.some((c) => c.source === k))];
    const seg = (v, l) => h("button", { "aria-pressed": String(ui.cView === v), onclick: () => { ui.cView = v; try { localStorage.setItem("crm_cview", v); } catch {} render(); } }, l);
    const tools = h("div", { class: "row" },
      h("div", { class: "c-search" }, search),
      h("div", { class: "chips" }, srcs.map(([k, l]) => h("button", { "aria-pressed": String(ui.src === k), onclick: () => { ui.src = k; render(); } }, l))),
      h("span", { class: "spacer" }),
      h("div", { class: "seg" }, seg("board", "Дошка"), seg("list", "Список")));

    let body;
    if (!S.clients.length) body = h("section", { class: "panel" }, h("p", { class: "empty" }, "Клієнтів поки немає. Вони з'являться тут із чату й форми, або додай вручну."));
    else if (ui.cView === "board") {
      let dragId = 0;
      body = h("section", { class: "c-board" }, Object.entries(STATUS).map(([k, l]) => {
        const items = rows.filter((c) => c.status === k).sort((a, b) => b.updated_at - a.updated_at);
        const col = h("div", { class: "c-col", "data-col": k,
          ondragover: (e) => { if (!dragId) return; e.preventDefault(); col.classList.add("over"); },
          ondragleave: (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove("over"); },
          ondrop: (e) => { e.preventDefault(); col.classList.remove("over"); const c = clientById(dragId); dragId = 0; if (c) setClientStatus(c, k); } },
          h("h3", null, h("span", { class: "dot", style: "background:" + SCOLOR[k] }), l, h("span", { class: "n num" }, items.length)),
          items.map((c) => {
            const n = nextCall(c.id);
            return h("button", { class: "c-card", draggable: "true", onclick: () => openClient(c.id),
              ondragstart: (e) => { dragId = c.id; e.currentTarget.classList.add("drag"); try { e.dataTransfer.setData("text/plain", String(c.id)); e.dataTransfer.effectAllowed = "move"; } catch {} },
              ondragend: (e) => { e.currentTarget.classList.remove("drag"); document.querySelectorAll(".c-col.over").forEach((x) => x.classList.remove("over")); } },
              h("span", { class: "who" }, avatar(c), h("span", { class: "who__txt" }, h("b", null, c.name || "Без імені"), h("span", null, c.company || c.email || c.contact || c.phone || "—"))),
              h("span", { class: "c-card__foot" }, srcBadge(c.source), n ? h("span", { class: "call num" }, "📞 " + fShort(n.start_at) + ", " + hm(n.start_at)) : h("span", { class: "muted" }, ago(c.updated_at))));
          }),
          items.length ? null : h("p", { class: "c-col__empty" }, "Порожньо"));
        return col;
      }));
    } else {
      body = h("div", { class: "c-table" }, h("table", null,
        h("thead", null, h("tr", null, ["Клієнт", "Статус", "Джерело", "Наступний дзвінок", "Контакт", "Додано"].map((x) => h("th", null, x)))),
        h("tbody", null, rows.slice().sort((a, b) => b.updated_at - a.updated_at).map((c) => {
          const n = nextCall(c.id);
          return h("tr", { tabindex: "0", onclick: () => openClient(c.id), onkeydown: (e) => { if (e.key === "Enter") openClient(c.id); } },
            h("td", null, h("span", { class: "who" }, avatar(c), h("span", { class: "who__txt" }, h("b", null, c.name || "Без імені"), h("span", null, c.company)))),
            h("td", null, statusBadge(c.status)), h("td", null, srcBadge(c.source)),
            h("td", { class: "num" }, n ? fShort(n.start_at) + ", " + hm(n.start_at) : "—"),
            h("td", { class: "muted" }, c.email || c.phone || c.contact || "—"),
            h("td", { class: "num muted" }, ago(c.created_at)));
        }))));
      if (!rows.length) body.append(h("p", { class: "empty" }, "Нічого не знайдено."));
    }
    shell("clients", h("div", { class: "wrap wrap--wide" }, funnel, tools, body), true);
    if (clientFilter.focus) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
  }

  /* картка клієнта: панель справа */
  let drawerEl = null, scrimEl = null;
  function openClient(id) { ui.drawer = id; drawClient(); }
  function closeClient() {
    ui.drawer = 0;
    if (drawerEl) { drawerEl.classList.remove("open"); scrimEl.classList.remove("open"); }
  }
  function drawClient() {
    const c = ui.drawer ? clientById(ui.drawer) : null;
    if (!c) return closeClient();
    if (!drawerEl) {
      scrimEl = h("div", { class: "scrim", onclick: closeClient });
      drawerEl = h("aside", { class: "drawer", role: "dialog", "aria-label": "Картка клієнта" });
      document.body.append(scrimEl, drawerEl);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ui.drawer && !document.querySelector("dialog[open]")) closeClient(); });
    }
    const wasOpen = drawerEl.classList.contains("open");
    const ms = S.meetings.filter((m) => m.client_id === c.id).sort((a, b) => b.start_at - a.start_at);
    const keys = [c.name, c.company].map((x) => (x || "").trim().toLowerCase()).filter(Boolean);
    const svcs = (S.retention || []).filter((r) => keys.includes((r.client || "").trim().toLowerCase()));
    const sel = h("select", { "aria-label": "Статус", onchange: (e) => setClientStatus(c, e.target.value) }, Object.entries(STATUS).map(([k, l]) => h("option", { value: k }, l)));
    sel.value = c.status;
    const close = h("button", { class: "x", "aria-label": "Закрити", onclick: closeClient }, "×");
    const kv = [];
    const add = (k, v) => { if (v) kv.push(h("span", null, k), h("div", null, v)); };
    add("Email", c.email ? h("a", { href: "mailto:" + c.email }, c.email) : null);
    add("Телефон", c.phone ? h("a", { class: "num", href: "tel:" + c.phone.replace(/[^\d+]/g, "") }, c.phone) : null);
    add("Контакт", c.contact);
    add("Додано", fShort(c.created_at) + " · " + (SOURCE[c.source] || c.source) + (c.lang ? " · " + c.lang.toUpperCase() : ""));
    drawerEl.replaceChildren(
      h("header", null,
        h("div", { class: "row", style: "flex-wrap:nowrap" }, avatar(c, true), h("div", { style: "flex:1;min-width:0" }, h("h2", null, c.name || "Без імені"), c.company ? h("div", { class: "muted small" }, c.company) : null), close),
        h("div", { class: "row" }, h("div", { class: "drawer__status" }, sel), srcBadge(c.source), h("span", { class: "spacer" }),
          h("button", { class: "btn btn--sm", onclick: () => meetingDialog(null, c.id) }, "+ Зустріч"),
          h("button", { class: "btn btn--ghost btn--sm", onclick: () => clientDialog(c) }, "Редагувати"))),
      h("div", { class: "drawer__body" },
        h("section", null, h("h3", null, "Контакти"), h("div", { class: "kv" }, kv)),
        h("section", null, h("h3", null, "Нотатки"), c.notes ? h("div", { class: "notes-box" }, c.notes) : h("p", { class: "small muted" }, "Нотаток ще немає. ", h("button", { class: "link", onclick: () => clientDialog(c) }, "Додати"))),
        h("section", null, h("h3", null, "Історія"), h("div", { class: "timeline" },
          ms.map((m) => h("button", { class: "ev", onclick: () => meetingDialog(m) },
            h("b", null, (m.status === "scheduled" ? (m.start_at > now() ? "📞 " : "⏳ ") : m.status === "done" ? "✓ " : "✕ ") + "Дзвінок" + (m.topic ? ": " + m.topic : "")),
            h("small", null, fShort(m.start_at) + ", " + hm(m.start_at) + " · " + m.minutes + " хв" + (m.status !== "scheduled" ? " · " + MSTATUS[m.status] : "")))),
          h("div", { class: "ev" }, h("b", null, c.source === "manual" ? "Додано вручну" : "Заявка: " + (SOURCE[c.source] || c.source)), h("small", null, fShort(c.created_at))))),
        svcs.length ? h("section", null, h("h3", null, "Утримання"),
          h("div", { class: "svc-list" }, svcs.map((r) => h("a", { class: "svc", href: "#retention", onclick: closeClient },
            h("span", null, (r.type === "dom" ? "🌐 " : r.type === "srv" ? "🖥 " : "• ") + (r.name || RTYPES[r.type] || "")), leftBadge(r))))) : null));
    if (!wasOpen) { drawerEl.classList.add("open"); scrimEl.classList.add("open"); close.focus(); }
  }

  function settingsView(note) {
    const s = S.schedule;
    const days = h("div", { class: "days" }, DAYS.map((d, i) => h("label", null, h("input", { type: "checkbox", value: i + 1, checked: s.days.includes(i + 1) }), d)));
    const inp = (type, value, attrs) => h("input", { type, value, ...attrs });
    const from = inp("time", s.from), to = inp("time", s.to);
    const minutes = inp("number", s.minutes, { min: 15, max: 120, step: 5 });
    const buffer = inp("number", s.buffer, { min: 0, max: 60, step: 5 });
    const notice = inp("number", s.notice, { min: 0, max: 168 });
    const horizon = inp("number", s.horizon, { min: 1, max: 60 });
    let blocked = [...s.blocked];
    const blockedBox = h("div", { class: "blocked" });
    const drawBlocked = () => blockedBox.replaceChildren(...blocked.sort().map((d) =>
      h("span", { class: "badge" }, d.split("-").reverse().join("."), " ", h("button", { class: "link", onclick: () => { blocked = blocked.filter((x) => x !== d); drawBlocked(); } }, "×"))));
    drawBlocked();
    const newBlock = inp("date", "");
    const save = h("button", { class: "btn", onclick: async () => {
      save.disabled = true;
      const r = await api("schedule_save", { schedule: {
        days: [...days.querySelectorAll("input:checked")].map((x) => +x.value), from: from.value, to: to.value,
        minutes: +minutes.value, buffer: +buffer.value, notice: +notice.value, horizon: +horizon.value, blocked } });
      save.disabled = false;
      if (r.ok) { S = r; toast("Графік збережено"); render(); } else toast("Не вдалося зберегти");
    } }, "Зберегти графік");

    const g = S.google;
    const gBox = h("section", { class: "panel", style: "display:grid;gap:12px" }, h("h2", null, "Google Календар і Meet"));
    if (note) gBox.append(h("p", { class: note === "ok" ? "ok" : "err" }, {
      ok: "Готово, Google Календар підключено.", denied: "Доступ не надано.", scope: "Потрібно дозволити доступ до календаря (постав галочки).",
      fail: "Google не повернув доступ. Спробуй ще раз.", state: "Сесія підключення застаріла, спробуй ще раз.", not_configured: "Спершу додай ключі Google (кроки нижче)." }[note] || ""));
    if (!g.configured) {
      gBox.append(h("p", { class: "muted small" }, "Щоб агент створював зустрічі з Google Meet і надсилав запрошення клієнтам, потрібні ключі Google. Це один раз, близько 10 хвилин:"),
        h("ol", { class: "steps" },
          h("li", null, "Відкрий ", h("a", { href: "https://console.cloud.google.com/projectcreate", target: "_blank", rel: "noopener" }, "Google Cloud Console"), " і створи проєкт, наприклад «Deweb CRM»."),
          h("li", null, "У ", h("a", { href: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com", target: "_blank", rel: "noopener" }, "бібліотеці API"), " увімкни Google Calendar API."),
          h("li", null, "У розділі ", h("a", { href: "https://console.cloud.google.com/auth/overview", target: "_blank", rel: "noopener" }, "Google Auth Platform"), " налаштуй екран згоди: тип External, назва Deweb CRM, твій email. Потім у Audience натисни Publish app (In production), інакше доступ злітатиме щотижня."),
          h("li", null, "У Clients створи OAuth client: тип Web application, у Authorized redirect URIs встав ", h("code", null, g.redirect)),
          h("li", null, "Скопіюй Client ID і Client secret у секрети GitHub: ", h("code", null, "GOOGLE_CLIENT_ID"), " і ", h("code", null, "GOOGLE_CLIENT_SECRET"), ". Після деплою тут з'явиться кнопка підключення.")));
    } else if (g.on && !g.error) {
      gBox.append(h("p", null, "✅ Підключено", g.email ? ": " + g.email : "", ". Агент бачить зайнятий час у календарі й створює зустрічі з Google Meet."),
        h("div", { class: "row" }, h("a", { class: "btn btn--ghost btn--sm", href: "/crm/google.php?start=1" }, "Підключити заново"),
          h("button", { class: "btn btn--danger btn--sm", onclick: async () => { if (confirm("Відключити Google Календар?")) { const r = await api("google_disconnect", {}); if (r.ok) { S = r; render(); } } } }, "Відключити")));
    } else {
      gBox.append(h("p", { class: "muted small" }, g.error ? "Доступ до Google відкликано або минув. Підключи ще раз." : "Ключі Google на місці. Залишилось дати дозвіл на календар."),
        h("p", { class: "muted small" }, "Google може показати «застосунок не перевірено» — це твій власний застосунок, натисни Advanced → Go to Deweb CRM."),
        h("div", null, h("a", { class: "btn", href: "/crm/google.php?start=1" }, "Підключити Google Календар")));
    }

    shell("settings", h("div", { class: "wrap" },
      gBox,
      h("section", { class: "panel", style: "display:grid;gap:14px" },
        h("h2", null, "Графік для дзвінків"),
        h("p", { class: "muted small", style: "margin:0" }, "AI-агент пропонує клієнтам лише ці вікна, мінус зустрічі в CRM і зайнятий час у Google Календарі. Час — Варшава."),
        field("Робочі дні", days),
        h("div", { class: "grid2" }, field("Від", from), field("До", to), field("Тривалість дзвінка, хв", minutes), field("Перерва між дзвінками, хв", buffer),
          field("Мінімум годин до дзвінка", notice), field("Показувати днів наперед", horizon)),
        field("Вихідні й відпустка (дні без дзвінків)", h("div", { style: "display:grid;gap:8px" }, blockedBox,
          h("div", { class: "row" }, newBlock, h("button", { class: "btn btn--ghost btn--sm", onclick: () => { if (newBlock.value && !blocked.includes(newBlock.value)) { blocked.push(newBlock.value); drawBlocked(); } newBlock.value = ""; } }, "Додати")))),
        h("div", null, save)),
      h("section", { class: "panel row" },
        h("span", { class: "muted small spacer" }, "Вхід триває до 12 годин без дій. Дані клієнтів зашифровані."),
        h("button", { class: "btn btn--ghost btn--sm", onclick: async () => { await api("logout", {}); S = null; authView(true); } }, "Вийти"))));
  }

  /* ---------- утримання: домени, сервери, продовження ---------- */
  const RTYPES = { dom: "Домен", srv: "Сервер", sup: "Підтримка", oth: "Інше" };
  const ret = { filter: "all", q: "", sort: "client", edit: null, del: null, focus: false };
  const isoToUa = (s) => (s && /^\d{4}-\d\d-\d\d$/.test(s) ? s.split("-").reverse().join(".") : s || "");
  const isoDay = (s) => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || ""); return m ? Date.UTC(+m[1], m[2] - 1, +m[3]) : null; };
  const todayUtc = () => { const [y, mo, d] = ymd(Date.now() / 1000).split("-").map(Number); return Date.UTC(y, mo - 1, d); };
  const daysLeft = (r) => { const d = isoDay(r.renew); return d == null ? null : Math.round((d - todayUtc()) / 864e5); };
  const suspicious = (r) => { const a = isoDay(r.bought), b = isoDay(r.renew); return a != null && b != null && b <= a; };
  const money = (v) => { const n = parseFloat(String(v || "").replace(",", ".").replace(/[^\d.]/g, "")); return isNaN(n) ? null : n; };
  const fmtMoney = (n) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 }) + " zł";
  const retVal = (r, c) => (c.custom ? (r.x || {})[c.key] || "" : c.key === "bought" || c.key === "renew" ? isoToUa(r[c.key]) : r[c.key] ?? "");
  function leftBadge(r) {
    const n = daysLeft(r);
    if (n == null) return h("span", { class: "muted" }, "—");
    const cls = r.paid ? "ok" : n < 0 ? "over" : n <= 30 ? "soon" : "ok";
    return h("span", null, h("span", { class: "badge num badge--" + cls }, n < 0 ? -n + " дн. тому" : n === 0 ? "сьогодні" : n + " дн."),
      suspicious(r) ? h("span", { class: "warn-ico", title: "Дата продовження не пізніша за дату покупки. Перевір." }, "!") : null);
  }
  const typeBadge = (t) => h("span", { class: "badge badge--" + t }, RTYPES[t] || t);

  async function retSave(id, row) {
    const r = await api("retention_save", { id, row });
    if (!r.ok) { toast(r.error === "date" ? "Дата має бути у форматі дд.мм.рррр" : r.error === "client" ? "Вкажи клієнта" : "Не вдалося зберегти"); return false; }
    S = r; return true;
  }
  async function retCols(cols) { const r = await api("retention_cols", { cols }); if (r.ok) { S = r; render(); } else toast("Не вдалося зберегти колонки"); }
  function retRows() {
    const q = ret.q.trim().toLowerCase();
    let rows = S.retention.filter((r) => {
      const n = daysLeft(r);
      if (ret.filter === "dom" && r.type !== "dom") return false;
      if (ret.filter === "srv" && r.type !== "srv") return false;
      if (ret.filter === "soon" && !(n != null && n >= 0 && n <= 30)) return false;
      if (ret.filter === "over" && !(n != null && n < 0 && !r.paid)) return false;
      if (ret.filter === "unpaid" && r.paid) return false;
      return !q || [r.client, r.contact, r.name, r.note].join(" ").toLowerCase().includes(q);
    });
    if (ret.sort === "date") rows = rows.slice().sort((a, b) => (isoDay(a.renew) ?? 9e15) - (isoDay(b.renew) ?? 9e15));
    else { const order = [...new Set(S.retention.map((r) => r.client))]; rows = rows.slice().sort((a, b) => order.indexOf(a.client) - order.indexOf(b.client) || a.id - b.id); }
    return rows;
  }
  /* наступне нагадування для послуги: дата, коли спрацює стадія 30/7/0, яку ще не надсилали */
  function nextReminder(r) {
    if (r.paid || !r.renew) return null;
    const n = daysLeft(r), open = [30, 7, 0].filter((s) => !r.sent.includes(s));
    const now = open.filter((s) => n <= s);
    if (now.length) return { stage: Math.min(...now), inDays: 0, n };
    const next = open.filter((s) => s < n);
    return next.length ? { stage: Math.max(...next), inDays: n - Math.max(...next), n } : null;
  }

  function retentionView() {
    const cols = S.retention_cols;
    const vis = cols.filter((c) => c.on);
    const rows = retRows();
    let over = 0, soon = 0, sum = 0;
    for (const r of S.retention) { const n = daysLeft(r); if (!r.paid && n != null && n < 0) over++; else if (!r.paid && n != null && n <= 30) soon++; const m = money(r.price); if (m) sum += m; }
    const clients = new Set(S.retention.map((r) => r.client)).size;
    const setFilter = (f) => { ret.filter = f; render(); };

    /* колонки */
    let dragFrom = null;
    const move = (from, to) => { if (to < 0 || to >= cols.length) return; const c = cols.slice(); const [x] = c.splice(from, 1); c.splice(to, 0, x); retCols(c); };
    const colChip = (c, i) => {
      const el = h("div", { class: "colrow" + (c.on ? "" : " off"), draggable: "true",
        ondragstart: (e) => { dragFrom = i; el.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(i)); } catch {} },
        ondragover: (e) => { if (dragFrom != null) { e.preventDefault(); el.classList.add("over"); } },
        ondragleave: () => el.classList.remove("over"),
        ondrop: (e) => { e.preventDefault(); if (dragFrom != null && dragFrom !== i) move(dragFrom, i); dragFrom = null; },
        ondragend: () => { dragFrom = null; el.classList.remove("drag"); } },
        h("span", { class: "grip", title: "Перетягни" }, "⋮⋮"),
        h("input", { type: "checkbox", checked: c.on, "aria-label": "Показувати колонку", onchange: (e) => retCols(cols.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x))) }),
        h("input", { type: "text", value: c.label, size: Math.max(4, c.label.length), "aria-label": "Назва колонки",
          onchange: (e) => { const v = e.target.value.trim(); if (v) retCols(cols.map((x, j) => (j === i ? { ...x, label: v } : x))); },
          onkeydown: (e) => { if (e.key === "Enter") e.target.blur(); } }),
        c.custom ? h("button", { class: "mv", title: "Видалити колонку", "aria-label": "Видалити колонку", onclick: () => retCols(cols.filter((_, j) => j !== i)) }, "✕") : null,
        h("button", { class: "mv", "aria-label": "Лівіше", onclick: () => move(i, i - 1) }, "◀"),
        h("button", { class: "mv", "aria-label": "Правіше", onclick: () => move(i, i + 1) }, "▶"));
      return el;
    };
    const newCol = h("input", { type: "text", placeholder: "+ своя колонка", "aria-label": "Нова колонка", onkeydown: (e) => { if (e.key === "Enter") addCol(); } });
    const addCol = () => { const label = newCol.value.trim(); if (!label) return newCol.focus(); retCols([...cols, { key: "c" + Date.now().toString(36), label, on: true }]); };
    const colbar = h("section", { class: "colbar", "aria-label": "Колонки таблиці" },
      h("span", { class: "colbar__label" }, "Колонки"),
      h("div", { class: "colset" }, h("div", { class: "colrow" }, h("input", { type: "checkbox", checked: true, disabled: true, "aria-label": "Клієнт завжди видно" }), h("input", { type: "text", value: "Клієнт", size: 6, disabled: true })), cols.map(colChip)),
      h("div", { class: "colbar__add" }, newCol, h("button", { class: "btn btn--ghost btn--sm", onclick: addCol }, "Додати")));

    /* плитки */
    const kpi = (n, label, f, cls) => h("button", { class: "panel kpi kpi--btn", onclick: () => setFilter(f) }, h("b", { class: "num " + (cls || "") }, n), h("span", null, label));
    const upcoming = S.retention.map((r) => ({ r, nx: nextReminder(r) })).filter((x) => x.nx).sort((a, b) => a.nx.inDays - b.nx.inDays).slice(0, 3);
    const remindBtn = h("button", { class: "link", onclick: async () => {
      remindBtn.disabled = true;
      const r = await api("retention_remind", {});
      remindBtn.disabled = false;
      if (r.ok) { S = r; render(); toast(r.remind.error ? "Telegram не відповів" : r.remind.sent ? "Надіслано в Telegram: " + r.remind.sent : "Зараз нічого надсилати"); } else toast("Не вдалося перевірити");
    } }, "Перевірити зараз");
    const tg = h("div", { class: "panel kpi kpi--tg" },
      h("h3", null, "✈ Нагадування в Telegram"),
      upcoming.length ? upcoming.map(({ r, nx }) => h("div", { class: "tg-line", title: r.client + ": " + (RTYPES[r.type] || "") + (r.name ? " " + r.name : "") },
        h("b", null, nx.inDays === 0 ? "Сьогодні" : "Через " + nx.inDays + " дн."), " · ", r.name || r.client,
        h("span", { class: "muted" }, nx.n < 0 ? " · прострочено" : nx.stage === 0 ? " · день терміну" : " · за " + nx.stage + " дн. до терміну")))
        : h("div", { class: "muted" }, "Немає неоплачених послуг з датою продовження."),
      h("span", { class: "muted small" }, "Щоранку: за 30 днів, за 7 днів і в день терміну, поки не «Оплачено». ", remindBtn));
    const kpis = h("section", { class: "kpis kpis--5" },
      kpi(over, "Прострочено, не оплачено", "over", "bad"), kpi(soon, "Термін за 30 днів", "soon", "warn"),
      kpi(S.retention.length, "Послуг у " + clients + " клієнтів", "all"), kpi(fmtMoney(sum), "Сума за рік", "all"), tg);

    /* фільтри */
    const chip = (k, l) => h("button", { "aria-pressed": String(ret.filter === k), onclick: () => setFilter(k) }, l);
    const search = h("input", { type: "search", placeholder: "Пошук клієнта чи домену", value: ret.q, oninput: (e) => { ret.q = e.target.value; ret.focus = true; render(); } });
    const sortSel = h("select", { style: "width:auto", "aria-label": "Сортування", onchange: (e) => { ret.sort = e.target.value; render(); } },
      h("option", { value: "client" }, "По клієнтах"), h("option", { value: "date" }, "По терміну"));
    sortSel.value = ret.sort;
    const toolbar = h("div", { class: "row" },
      h("div", { class: "chips" }, chip("all", "Усі"), chip("dom", "Домени"), chip("srv", "Сервери"), chip("soon", "≤ 30 днів"), chip("over", "Прострочені"), chip("unpaid", "Не оплачені")),
      h("span", { class: "spacer" }), h("div", { style: "width:min(240px,100%)" }, search), sortSel,
      h("button", { class: "btn btn--ghost btn--sm", onclick: importDialog }, "Імпорт з таблиці"),
      h("button", { class: "btn btn--sm", onclick: () => retDialog() }, "+ Послуга"));

    /* таблиця */
    const commit = async (r, key, value) => {
      ret.edit = null;
      const c = cols.find((x) => x.key === key);
      const row = c && c.custom ? { x: { [key]: value } } : { [key]: value };
      if (await retSave(r.id, row)) render(); else render();
    };
    const editor = (r, key) => {
      const cur = key === "client" ? r.client : retVal(r, cols.find((c) => c.key === key));
      let el;
      if (key === "type") el = h("select", { onchange: (e) => commit(r, key, e.target.value), onblur: () => { if (ret.edit) { ret.edit = null; render(); } } }, Object.entries(RTYPES).map(([k, l]) => h("option", { value: k }, l)));
      else el = h("input", { type: "text", value: cur, placeholder: key === "bought" || key === "renew" ? "дд.мм.рррр" : null });
      if (key === "type") el.value = cur;
      else {
        let done = false;
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); done = true; commit(r, key, el.value.trim()); }
          if (e.key === "Escape") { done = true; ret.edit = null; render(); }
        });
        el.addEventListener("blur", () => { if (!done) { done = true; if (el.value.trim() !== String(cur)) commit(r, key, el.value.trim()); else { ret.edit = null; render(); } } });
      }
      setTimeout(() => { el.focus(); if (el.select) el.select(); }, 0);
      return h("td", { class: "editing" }, el);
    };
    const startEdit = (r, key) => { ret.edit = { id: r.id, key }; ret.del = null; render(); };
    const cell = (r, c, first) => {
      if (ret.edit && ret.edit.id === r.id && ret.edit.key === c.key) return editor(r, c.key);
      const ed = (cls, ...kids) => h("td", { class: "ed " + (cls || ""), onclick: () => startEdit(r, c.key), title: "Клікни, щоб змінити" }, ...kids);
      switch (c.key) {
        case "contact": return ret.sort === "client" && !first ? h("td") : ed("muted", r.contact);
        case "type": return ed("", typeBadge(r.type));
        case "left": return h("td", null, leftBadge(r));
        case "paid": return h("td", null, h("button", { class: "badge" + (r.paid ? " badge--paid" : ""), title: "Клікни, щоб перемкнути",
          onclick: async () => { if (await retSave(r.id, { paid: !r.paid })) { render(); toast(!r.paid ? "Оплачено. Нагадування для цієї послуги зупинені." : "Позначку оплати знято"); } } }, r.paid ? "✓ Оплачено" : "Не оплачено"));
        case "bought": case "renew": case "price": return ed("num", retVal(r, c));
        case "note": return ed("muted small", retVal(r, c));
        default: return ed("", retVal(r, c));
      }
    };
    const extend = async (r) => {
      const d = isoDay(r.renew); if (d == null) return toast("Спершу вкажи дату продовження");
      const nd = new Date(d); nd.setUTCFullYear(nd.getUTCFullYear() + 1);
      if (await retSave(r.id, { renew: nd.toISOString().slice(0, 10), paid: false })) { render(); toast("Продовжено до " + isoToUa(nd.toISOString().slice(0, 10))); }
    };
    let prev = null;
    const body = rows.map((r) => {
      const first = ret.sort !== "client" || r.client !== prev; prev = r.client;
      const clientCell = ret.edit && ret.edit.id === r.id && ret.edit.key === "client" ? editor(r, "client")
        : first ? h("td", { class: "ed client", onclick: () => startEdit(r, "client"), title: "Клікни, щоб змінити" }, h("b", null, r.client)) : h("td");
      const act = ret.del === r.id
        ? h("td", { class: "act" }, h("button", { class: "btn btn--danger btn--sm", onclick: async () => { const x = await api("retention_delete", { id: r.id }); ret.del = null; if (x.ok) { S = x; toast("Рядок видалено"); } render(); } }, "Видалити"),
            h("button", { class: "icon-btn", "aria-label": "Не видаляти", onclick: () => { ret.del = null; render(); } }, "✕"))
        : h("td", { class: "act" },
            h("button", { class: "icon-btn", title: "Продовжено на рік: дата +1 рік, оплата скидається", "aria-label": "Продовжити на рік", onclick: () => extend(r) }, "↻"),
            h("button", { class: "icon-btn", title: "Відкрити всі поля", "aria-label": "Відкрити", onclick: () => retDialog(r) }, "✎"),
            h("button", { class: "icon-btn", title: "Видалити рядок", "aria-label": "Видалити рядок", onclick: () => { ret.del = r.id; render(); } }, "🗑"));
      return h("tr", { class: first && ret.sort === "client" ? "first" : null }, clientCell, vis.map((c) => cell(r, c, first)), act);
    });
    const table = h("div", { class: "ret-table" }, h("table", null,
      h("thead", null, h("tr", null, h("th", null, "Клієнт"), vis.map((c) => h("th", null, c.label)), h("th"))),
      h("tbody", null, body.length ? body : h("tr", null, h("td", { colspan: vis.length + 2, class: "empty" },
        S.retention.length ? "Нічого не знайдено за цим фільтром." : "Тут поки порожньо. Натисни «Імпорт з таблиці» і встав рядки з Google-таблиці, або додай послугу вручну.")))));
    const cardCols = vis.filter((c) => !["type", "name", "left", "contact"].includes(c.key));
    const cards = h("div", { class: "ret-cards" }, rows.length ? rows.map((r) => h("button", { class: "ret-card", onclick: () => retDialog(r) },
      h("div", { class: "row" }, h("b", { style: "flex:1;font-family:var(--f-display)" }, r.client), typeBadge(r.type)),
      h("div", { class: "r" }, h("span", null, r.name || "—"), leftBadge(r)),
      cardCols.map((c) => h("div", { class: "r" }, h("span", null, c.label), c.key === "paid" ? h("span", { class: "badge" + (r.paid ? " badge--paid" : "") }, r.paid ? "✓ Оплачено" : "Не оплачено") : h("span", { class: "num" }, retVal(r, c) || "—")))))
      : h("p", { class: "empty" }, S.retention.length ? "Нічого не знайдено." : "Тут поки порожньо. Додай послугу або імпортуй з таблиці."));
    const legend = h("p", { class: "legend" },
      h("span", { class: "badge badge--over" }, "прострочено"), h("span", { class: "badge badge--soon" }, "≤ 30 днів"), h("span", { class: "badge badge--ok" }, "ще є час або оплачено"),
      h("span", null, h("span", { class: "warn-ico" }, "!"), " продовження раніше за покупку"),
      h("span", null, "Клік по клітинці редагує, Enter зберігає, Esc скасовує. ↻ — продовжено на рік."));

    shell("retention", h("div", { class: "wrap wrap--wide" }, colbar, kpis, toolbar, h("div", null, table, cards), legend), true);
    if (ret.focus) { ret.focus = false; search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
  }

  function retDialog(r) {
    const isNew = !r;
    r = r || { client: "", contact: "", type: "dom", name: "", bought: "", renew: "", price: "", paid: false, note: "", x: {} };
    const inp = (v, attrs) => h("input", { type: "text", value: v, ...attrs });
    const clientsList = h("datalist", { id: "ret-clients" }, [...new Set(S.retention.map((x) => x.client))].map((c) => h("option", { value: c })));
    const f = {
      client: inp(r.client, { list: "ret-clients", autocomplete: "off" }), contact: inp(r.contact, { placeholder: "@telegram, телефон…" }),
      type: h("select", null, Object.entries(RTYPES).map(([k, l]) => h("option", { value: k }, l))), name: inp(r.name, { placeholder: "домен або сервер" }),
      bought: inp(isoToUa(r.bought), { placeholder: "дд.мм.рррр", inputmode: "numeric" }), renew: inp(isoToUa(r.renew), { placeholder: "дд.мм.рррр", inputmode: "numeric" }),
      price: inp(r.price, { inputmode: "decimal" }), paid: h("select", null, h("option", { value: "0" }, "Не оплачено"), h("option", { value: "1" }, "Оплачено")),
      note: inp(r.note),
    };
    f.type.value = r.type; f.paid.value = r.paid ? "1" : "0";
    const custom = S.retention_cols.filter((c) => c.custom).map((c) => [c, inp((r.x || {})[c.key] || "")]);
    const err = h("p", { class: "err" });
    const body = h("div", { style: "display:grid;gap:12px" }, clientsList,
      h("div", { class: "grid2" }, field("Клієнт", f.client), field("Контакт", f.contact), field("Послуга", f.type), field("Домен / сервер", f.name),
        field("Куплено", f.bought), field("Продовження до", f.renew), field("Вартість brutto, zł", f.price), field("Оплата", f.paid),
        custom.map(([c, el]) => field(c.label, el))),
      field("Нотатки", f.note), err);
    let sure = false;
    dialog(isNew ? "Нова послуга" : r.client || "Послуга", body, (close) => [
      h("button", { class: "btn", onclick: async () => {
        const row = { client: f.client.value, contact: f.contact.value, type: f.type.value, name: f.name.value, bought: f.bought.value, renew: f.renew.value,
          price: f.price.value, paid: f.paid.value === "1", note: f.note.value, x: Object.fromEntries(custom.map(([c, el]) => [c.key, el.value])) };
        if (!row.client.trim()) return (err.textContent = "Вкажи клієнта.");
        if (await retSave(isNew ? 0 : r.id, row)) { close(); render(); toast(isNew ? "Послугу додано" : "Збережено"); }
      } }, "Зберегти"),
      h("span", { class: "spacer" }),
      isNew ? null : h("button", { class: "btn btn--danger btn--sm", onclick: async (e) => {
        if (!sure) { sure = true; e.currentTarget.textContent = "Точно видалити?"; return; }
        const x = await api("retention_delete", { id: r.id });
        if (x.ok) { S = x; close(); render(); toast("Рядок видалено"); }
      } }, "Видалити"),
    ]);
    if (isNew) setTimeout(() => f.client.focus(), 50);
  }

  /* імпорт: виділи рядки в Google-таблиці разом із заголовком, скопіюй і встав сюди.
     Розуміє і широку таблицю (Клієнт, Контакт, потім блоки «Домен …» і «Сервер …» з датами, вартістю й оплатою). */
  function parseSheet(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
    const split = (l) => l.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    const head = split(lines[0]).map((x) => x.toLowerCase());
    const find = (re) => head.findIndex((x) => re.test(x));
    const iClient = find(/клієнт|клиент|client/), iContact = find(/контакт|contact/);
    const groups = [];
    head.forEach((x, i) => {
      const type = /домен|domain/.test(x) ? "dom" : /сервер|хостинг|server|hosting/.test(x) ? "srv" : /підтрим|support/.test(x) ? "sup" : null;
      if (type) groups.push({ type, i });
    });
    if (iClient < 0 || !groups.length) return null;
    const out = [];
    for (const l of lines.slice(1)) {
      const c = split(l);
      const client = c[iClient] || "";
      if (!client) continue;
      groups.forEach((g, gi) => {
        const end = gi + 1 < groups.length ? groups[gi + 1].i : head.length;
        const part = head.slice(g.i + 1, end), val = (re) => { const k = part.findIndex((x) => re.test(x)); return k < 0 ? "" : c[g.i + 1 + k] || ""; };
        const dates = part.map((x, k) => (/дата|date/.test(x) ? c[g.i + 1 + k] || "" : null)).filter((x) => x !== null);
        const row = { client, contact: iContact >= 0 ? c[iContact] || "" : "", type: g.type,
          name: (c[g.i] || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
          bought: val(/покуп|куплен|purchase|bought/) || dates[0] || "", renew: val(/продов|renew|термін/) || dates[1] || "",
          price: val(/варт|цін|price|brutto/).replace(/\s*(zł|zl|pln)\s*$/i, ""), paid: /так|yes|оплач|✓|true|\+/i.test(val(/оплат|paid/)), note: "" };
        if (row.name || row.renew || row.price) out.push(row);
      });
    }
    return out;
  }
  function importDialog() {
    const ta = h("textarea", { rows: 9, placeholder: "Встав сюди рядки з Google-таблиці разом із рядком заголовків" });
    const info = h("p", { class: "small muted", style: "margin:0" }, "У Google-таблиці виділи все від заголовків до останнього рядка (Ctrl+A), скопіюй і встав сюди. Кожен домен і сервер стане окремим рядком.");
    const prevBox = h("p", { class: "small", style: "margin:0" });
    let parsed = [];
    ta.addEventListener("input", () => {
      const p = parseSheet(ta.value);
      parsed = p || [];
      prevBox.className = p === null ? "err" : "ok";
      prevBox.textContent = p === null ? "Не бачу колонок «Клієнт» і «Домен» або «Сервер» у першому рядку." : parsed.length ? "Знайдено послуг: " + parsed.length + " у " + new Set(parsed.map((x) => x.client)).size + " клієнтів." : "";
    });
    dialog("Імпорт з Google-таблиці", h("div", { style: "display:grid;gap:10px" }, info, ta, prevBox,
      S.retention.length ? h("p", { class: "small muted", style: "margin:0" }, "Нові рядки додадуться до тих, що вже є (" + S.retention.length + ").") : null), (close) => [
      h("button", { class: "btn", onclick: async (e) => {
        if (!parsed.length) return ta.focus();
        e.currentTarget.disabled = true;
        const r = await api("retention_import", { rows: parsed });
        if (r.ok) { S = r; close(); render(); toast("Імпортовано: " + r.imported); } else { e.currentTarget.disabled = false; toast("Не вдалося імпортувати"); }
      } }, "Імпортувати"),
    ]);
    setTimeout(() => ta.focus(), 50);
  }

  /* ---------- сейф доступів («Сайти») ----------
     Майстер-пароль → PBKDF2-SHA256 (600 000 ітерацій) → ключ AES-GCM 256, який живе лише в пам'яті цієї вкладки.
     На сервер ідуть тільки зашифровані записи. Забутий майстер-пароль = записи не відновити. */
  const VAULT_ITER = 600000, VAULT_CHECK = "deweb-vault-ok", VAULT_IDLE = 15 * 60 * 1000;
  const VGROUPS = [
    ["Сайт", [["domain", "Домен"], ["client", "Клієнт"], ["created", "Рік створення"]]],
    ["Адмінка", [["admin_url", "Панель адміна"], ["admin_login", "Логін"], ["admin_pass", "Пароль", 1]]],
    ["Хостинг", [["host_url", "Хостинг (панель)"], ["host_login", "Логін"], ["host_pass", "Пароль", 1]]],
    ["Пошта", [["mail_url", "Пошта"], ["mail_login", "Логін"], ["mail_pass", "Пароль", 1]]],
    ["FTP", [["ftp_host", "Сервер FTP"], ["ftp_login", "Користувач"], ["ftp_pass", "Пароль", 1]]],
    ["Stripe", [["stripe_login", "Логін"], ["stripe_pass", "Пароль", 1]]],
    ["Instagram", [["insta_login", "Логін"], ["insta_pass", "Пароль", 1]]],
  ];
  const VKEYS = VGROUPS.flatMap(([, f]) => f.map((x) => x[0])).concat("note");
  const vault = { key: null, items: [], timer: null, q: "" };
  const te = new TextEncoder(), td = new TextDecoder();
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function vDerive(pw, salt, iter) {
    const base = await crypto.subtle.importKey("raw", te.encode(pw), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(salt), iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function vSeal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj)));
    return b64(iv) + "." + b64(ct);
  }
  async function vOpen(key, blob) {
    const [iv, ct] = String(blob).split(".");
    return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct))));
  }
  async function vNewMeta(pw) {
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    const key = await vDerive(pw, salt, VAULT_ITER);
    return { key, meta: { salt, iter: VAULT_ITER, check: await vSeal(key, VAULT_CHECK) } };
  }
  async function vSync() {
    const out = [];
    for (const r of S.vault.rows) {
      try { out.push({ id: r.id, ...(await vOpen(vault.key, r.data)) }); } catch { out.push({ id: r.id, domain: "⚠ не вдалося розшифрувати", broken: true }); }
    }
    vault.items = out.sort((a, b) => String(a.domain).localeCompare(String(b.domain)));
  }
  function vLock() { vault.key = null; vault.items = []; clearTimeout(vault.timer); if ((location.hash.slice(1) || "").startsWith("sites")) render(); }
  function vTouch() { clearTimeout(vault.timer); if (vault.key) vault.timer = setTimeout(vLock, VAULT_IDLE); }
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => vault.key && vTouch(), { passive: true }));
  async function vApply(r, okText) {
    if (!r.ok) { toast(r.error === "changed" ? "Сейф змінився в іншій вкладці. Онови сторінку." : "Не вдалося зберегти"); return false; }
    S = r; await vSync(); render(); if (okText) toast(okText); return true;
  }
  const host = (u) => String(u || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const href = (u) => (/^https?:\/\//.test(u || "") ? u : u && /\./.test(u) ? "https://" + u : null);
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); toast(label || "Скопійовано"); }
    catch { toast("Браузер не дав скопіювати"); }
  }

  function sitesView() {
    if (!S.vault.meta) return vaultSetupView();
    if (!vault.key) return vaultUnlockView();
    vTouch();
    const q = vault.q.trim().toLowerCase();
    const rows = vault.items.filter((x) => !q || [x.domain, x.client, x.admin_login, x.host_url, x.note].join(" ").toLowerCase().includes(q));
    const search = h("input", { type: "search", placeholder: "Пошук домену чи клієнта", value: vault.q, oninput: (e) => { vault.q = e.target.value; render(); search.focus(); } });
    const copyBtn = (v, label) => v ? h("button", { class: "icon-btn", title: "Копіювати", "aria-label": "Копіювати " + label, onclick: (e) => { e.stopPropagation(); copy(v, label + " скопійовано"); } }, "⧉") : null;
    const link = (u, text) => href(u) ? h("a", { href: href(u), target: "_blank", rel: "noopener noreferrer", onclick: (e) => e.stopPropagation() }, text || host(u)) : h("span", { class: "muted" }, u || "—");
    const table = h("div", { class: "ret-table" }, h("table", null,
      h("thead", null, h("tr", null, ["Домен", "Клієнт", "Адмінка", "Логін", "Пароль", "Хостинг", "Створено", ""].map((t) => h("th", null, t)))),
      h("tbody", null, rows.length ? rows.map((x) => h("tr", { style: "cursor:pointer", onclick: () => siteDialog(x) },
        h("td", null, h("b", null, x.broken ? x.domain : link(x.domain))),
        h("td", { class: "muted" }, x.client || ""),
        h("td", null, x.admin_url ? link(x.admin_url, "відкрити ↗") : h("span", { class: "muted" }, "—")),
        h("td", null, x.admin_login || "", copyBtn(x.admin_login, "Логін")),
        h("td", null, x.admin_pass ? h("span", { class: "muted" }, "•••••• ") : "", copyBtn(x.admin_pass, "Пароль")),
        h("td", { class: "muted" }, host(x.host_url) || ""),
        h("td", { class: "num muted" }, x.created || ""),
        h("td", { class: "act" }, h("button", { class: "icon-btn", "aria-label": "Відкрити", title: "Усі доступи" }, "✎"))))
        : h("tr", null, h("td", { colspan: 8, class: "empty" }, vault.items.length ? "Нічого не знайдено." : "Сейф порожній. Натисни «Імпорт з таблиці» і встав рядки з таблиці доступів, або додай сайт вручну.")))));
    const cards = h("div", { class: "ret-cards" }, rows.map((x) => h("button", { class: "ret-card", onclick: () => siteDialog(x) },
      h("div", { class: "row" }, h("b", { style: "flex:1;font-family:var(--f-display)" }, host(x.domain) || x.domain), h("span", { class: "muted small" }, x.client || "")),
      h("div", { class: "r" }, h("span", null, "Адмінка"), h("span", null, x.admin_login || "—")))));
    shell("sites", h("div", { class: "wrap wrap--wide" },
      h("div", { class: "row" },
        h("h2", null, "Доступи до сайтів · " + vault.items.length), h("span", { class: "spacer" }),
        h("div", { style: "width:min(260px,100%)" }, search),
        h("button", { class: "btn btn--ghost btn--sm", onclick: vaultImportDialog }, "Імпорт з таблиці"),
        h("button", { class: "btn btn--sm", onclick: () => siteDialog() }, "+ Сайт"),
        h("button", { class: "btn btn--ghost btn--sm", title: "Заблокувати сейф", onclick: vLock }, "🔒 Заблокувати")),
      h("div", null, table, cards),
      h("p", { class: "legend" }, h("span", null, "🔐 Паролі розшифровуються тільки в цьому браузері. Сейф сам блокується через 15 хвилин без дій."),
        h("button", { class: "link", onclick: vaultRekeyDialog }, "Змінити майстер-пароль"))), true);
    if (vault.q) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
  }

  function vaultSetupView() {
    const p1 = h("input", { type: "password", autocomplete: "new-password" }), p2 = h("input", { type: "password", autocomplete: "new-password" });
    const err = h("p", { class: "err" });
    const btn = h("button", { class: "btn", onclick: async () => {
      if (p1.value.length < 12) return (err.textContent = "Майстер-пароль має бути щонайменше 12 символів.");
      if (p1.value !== p2.value) return (err.textContent = "Паролі не збігаються.");
      if (p1.value === "" || !crypto.subtle) return (err.textContent = "Браузер не підтримує шифрування.");
      btn.disabled = true; err.textContent = "";
      const { key, meta } = await vNewMeta(p1.value);
      const r = await api("vault_setup", { meta });
      btn.disabled = false;
      if (!r.ok) return (err.textContent = r.error === "exists" ? "Сейф уже створено, онови сторінку." : "Не вдалося створити сейф.");
      vault.key = key; await vApply(r, "Сейф створено");
    } }, "Створити сейф");
    shell("sites", h("section", { class: "panel", style: "display:grid;gap:12px;max-width:520px" },
      h("h2", null, "Сейф доступів"),
      h("p", { class: "muted small", style: "margin:0" }, "Тут зберігатимуться логіни й паролі до сайтів клієнтів. Вони шифруються прямо в браузері окремим майстер-паролем, якого немає на сервері. Тому навіть якщо хтось отримає доступ до хостингу чи бази, паролів він не прочитає."),
      h("p", { class: "err", style: "margin:0" }, "Запам'ятай майстер-пароль або збережи його в надійному місці. Якщо його забути, відновити записи неможливо ні тобі, ні мені."),
      h("p", { class: "muted small", style: "margin:0" }, "Не став той самий пароль, що й для входу в CRM. Найкраще 4–5 випадкових слів, наприклад «синій-трамвай-кава-гора-41»."),
      field("Майстер-пароль (від 12 символів)", p1), field("Ще раз", p2), err, h("div", null, btn)));
    p1.focus();
  }

  function vaultUnlockView() {
    const pw = h("input", { type: "password", autocomplete: "off" });
    const err = h("p", { class: "err" });
    const btn = h("button", { class: "btn", type: "submit" }, "Відкрити сейф");
    const form = h("form", { class: "panel", style: "display:grid;gap:12px;max-width:420px", onsubmit: async (e) => {
      e.preventDefault(); btn.disabled = true; err.textContent = ""; btn.textContent = "Перевіряю…";
      try {
        const key = await vDerive(pw.value, S.vault.meta.salt, S.vault.meta.iter);
        if ((await vOpen(key, S.vault.meta.check)) !== VAULT_CHECK) throw 0;
        vault.key = key; await vSync(); render();
      } catch { err.textContent = "Невірний майстер-пароль."; pw.value = ""; btn.disabled = false; btn.textContent = "Відкрити сейф"; pw.focus(); }
    } },
      h("h2", null, "🔒 Сейф заблоковано"),
      h("p", { class: "muted small", style: "margin:0" }, "Введи майстер-пароль сейфа. Він перевіряється тільки в браузері й нікуди не надсилається."),
      field("Майстер-пароль", pw), err, h("div", { class: "row" }, btn, h("span", { class: "spacer" }), h("button", { class: "link", type: "button", onclick: vaultResetDialog }, "Забув майстер-пароль")));
    shell("sites", form);
    pw.focus();
  }

  function siteDialog(x) {
    const isNew = !x;
    x = x || {};
    const f = {};
    const mk = ([k, label, secret]) => {
      const el = h("input", { type: secret ? "password" : "text", value: x[k] || "", autocomplete: secret ? "new-password" : "off", spellcheck: "false" });
      f[k] = el;
      return h("label", null, h("span", null, label), h("div", { class: "row", style: "gap:4px;flex-wrap:nowrap" }, el,
        secret ? h("button", { class: "icon-btn", type: "button", title: "Показати", "aria-label": "Показати пароль", onclick: () => { el.type = el.type === "password" ? "text" : "password"; } }, "👁") : null,
        h("button", { class: "icon-btn", type: "button", title: "Копіювати", "aria-label": "Копіювати", onclick: () => el.value && copy(el.value, label + " скопійовано") }, "⧉"),
        /url|host$/.test(k) || k === "domain" ? h("button", { class: "icon-btn", type: "button", title: "Відкрити", "aria-label": "Відкрити посилання", onclick: () => { const u = href(el.value); if (u) window.open(u, "_blank", "noopener"); } }, "↗") : null));
    };
    f.note = h("textarea", { rows: 3 }, x.note || "");
    const body = h("div", { style: "display:grid;gap:14px" },
      VGROUPS.map(([title, fields]) => h("div", { style: "display:grid;gap:8px" }, h("h3", null, title), h("div", { class: "grid2" }, fields.map(mk)))),
      field("Нотатки", f.note));
    let sure = false;
    dialog(isNew ? "Новий сайт" : host(x.domain) || "Сайт", body, (close) => [
      h("button", { class: "btn", onclick: async (e) => {
        const obj = Object.fromEntries(VKEYS.map((k) => [k, (f[k].value || "").trim()]));
        if (!obj.domain) return toast("Вкажи домен");
        e.currentTarget.disabled = true;
        if (await vApply(await api("vault_save", { id: isNew ? 0 : x.id, data: await vSeal(vault.key, obj) }), "Збережено")) close();
        else e.currentTarget.disabled = false;
      } }, "Зберегти"),
      h("span", { class: "spacer" }),
      isNew ? null : h("button", { class: "btn btn--danger btn--sm", onclick: async (e) => {
        if (!sure) { sure = true; e.currentTarget.textContent = "Точно видалити?"; return; }
        if (await vApply(await api("vault_delete", { id: x.id }), "Видалено")) close();
      } }, "Видалити"),
    ]);
  }

  /* імпорт таблиці доступів: Домен | Панель адміна | Логін | Пароль | Сервер | Логін | Пароль | Пошта | … | Рік створення | Stripe | Пароль | Insta | Пароль.
     «Логін» і «Пароль» належать до найближчої колонки-групи зліва. */
  function parseVault(text) {
    const rows = [];
    let cur = [], cell = "", q = false;
    const sep = text.split("\n")[0].includes("\t") ? "\t" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
      if (ch === '"' && cell === "") q = true;
      else if (ch === sep) { cur.push(cell); cell = ""; }
      else if (ch === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
      else if (ch !== "\r") cell += ch;
    }
    if (cell !== "" || cur.length) { cur.push(cell); rows.push(cur); }
    const head = (rows.shift() || []).map((x) => x.trim().toLowerCase());
    const map = []; let g = null;
    head.forEach((x, i) => {
      if (/^домен|^domain|^сайт/.test(x)) { map[i] = "domain"; g = null; }
      else if (/клієнт|client/.test(x)) map[i] = "client";
      else if (/адмін|admin/.test(x)) { g = "admin"; map[i] = "admin_url"; }
      else if (/сервер|хостинг|hosting/.test(x)) { g = "host"; map[i] = "host_url"; }
      else if (/пошта|mail/.test(x)) { g = "mail"; map[i] = "mail_url"; }
      else if (/фтп|ftp/.test(x)) { g = "ftp"; map[i] = "ftp_host"; }
      else if (/stripe/.test(x)) { g = "stripe"; map[i] = "stripe_login"; }
      else if (/insta/.test(x)) { g = "insta"; map[i] = "insta_login"; }
      else if (/рік|створ|year|created/.test(x)) { map[i] = "created"; g = null; }
      else if (/нотат|note|комент/.test(x)) map[i] = "note";
      else if (/пароль|password|pass/.test(x) && g) map[i] = g + "_pass";
      else if (/логін|login|користувач|user/.test(x) && g) map[i] = g + (g === "stripe" || g === "insta" ? "_login2" : "_login");
    });
    if (!map.includes("domain")) return null;
    return rows.map((c) => {
      const o = {};
      map.forEach((k, i) => { if (!k) return; const v = (c[i] || "").trim(); if (!v) return; if (k.endsWith("_login2")) { const b = k.replace("_login2", "_login"); o[b] = o[b] ? o[b] + " / " + v : v; } else o[k] = v; });
      return o;
    }).filter((o) => o.domain);
  }
  function vaultImportDialog() {
    const ta = h("textarea", { rows: 9, placeholder: "Встав сюди таблицю доступів разом із рядком заголовків", spellcheck: "false", autocomplete: "off" });
    const info = h("p", { class: "small", style: "margin:0" });
    let parsed = [];
    ta.addEventListener("input", () => {
      const p = parseVault(ta.value); parsed = p || [];
      info.className = p === null ? "err" : "ok";
      info.textContent = p === null ? "Не бачу колонки «Домен» у першому рядку." : parsed.length ? "Знайдено сайтів: " + parsed.length + ". Кожен буде зашифровано тут, у браузері." : "";
    });
    dialog("Імпорт доступів", h("div", { style: "display:grid;gap:10px" },
      h("p", { class: "small muted", style: "margin:0" }, "У Google-таблиці натисни Ctrl+A, скопіюй і встав сюди. Після імпорту перевір кілька записів, а Google-таблицю краще видалити або хоча б закрити до неї доступ."),
      ta, info, vault.items.length ? h("p", { class: "small muted", style: "margin:0" }, "Нові записи додадуться до тих, що вже є (" + vault.items.length + ").") : null), (close) => [
      h("button", { class: "btn", onclick: async (e) => {
        if (!parsed.length) return ta.focus();
        e.currentTarget.disabled = true;
        const rows = [];
        for (const o of parsed) rows.push(await vSeal(vault.key, Object.fromEntries(VKEYS.map((k) => [k, o[k] || ""]))));
        const r = await api("vault_import", { rows });
        ta.value = ""; parsed = [];
        if (await vApply(r, "Імпортовано: " + (r.imported || 0))) close(); else e.currentTarget.disabled = false;
      } }, "Зашифрувати й імпортувати"),
    ]);
    setTimeout(() => ta.focus(), 50);
  }
  function vaultRekeyDialog() {
    const p0 = h("input", { type: "password", autocomplete: "off" }), p1 = h("input", { type: "password", autocomplete: "new-password" }), p2 = h("input", { type: "password", autocomplete: "new-password" });
    const err = h("p", { class: "err" });
    dialog("Змінити майстер-пароль", h("div", { style: "display:grid;gap:10px" }, field("Поточний майстер-пароль", p0), field("Новий (від 12 символів)", p1), field("Новий ще раз", p2), err), (close) => [
      h("button", { class: "btn", onclick: async (e) => {
        err.textContent = "";
        if (p1.value.length < 12) return (err.textContent = "Новий пароль має бути щонайменше 12 символів.");
        if (p1.value !== p2.value) return (err.textContent = "Нові паролі не збігаються.");
        const btn = e.currentTarget; btn.disabled = true;
        try {
          const old = await vDerive(p0.value, S.vault.meta.salt, S.vault.meta.iter);
          if ((await vOpen(old, S.vault.meta.check)) !== VAULT_CHECK) throw 0;
        } catch { btn.disabled = false; return (err.textContent = "Поточний майстер-пароль невірний."); }
        const { key, meta } = await vNewMeta(p1.value);
        const rows = [];
        for (const it of vault.items) { if (it.broken) { btn.disabled = false; return (err.textContent = "Є запис, який не розшифровується. Видали його спершу."); } const { id, ...rest } = it; rows.push({ id, data: await vSeal(key, rest) }); }
        const r = await api("vault_rekey", { meta, rows });
        if (r.ok) { vault.key = key; await vApply(r, "Майстер-пароль змінено"); close(); } else { btn.disabled = false; err.textContent = r.error === "changed" ? "Сейф змінився, онови сторінку." : "Не вдалося змінити."; }
      } }, "Змінити"),
    ]);
  }
  function vaultResetDialog() {
    const inp = h("input", { type: "text", placeholder: "СТЕРТИ" });
    dialog("Забув майстер-пароль", h("div", { style: "display:grid;gap:10px" },
      h("p", { style: "margin:0" }, "Без майстер-пароля записи розшифрувати неможливо, тут ніхто не допоможе. Можна лише стерти сейф повністю і створити новий, а потім ще раз імпортувати доступи."),
      field("Щоб стерти всі записи, введи слово СТЕРТИ", inp)), (close) => [
      h("button", { class: "btn btn--danger", onclick: async () => {
        const r = await api("vault_reset", { confirm: inp.value.trim() });
        if (r.ok) { S = r; vLock(); close(); render(); toast("Сейф стерто"); } else toast("Введи слово СТЕРТИ");
      } }, "Стерти сейф"),
    ]);
  }

  /* ---------- вікна ---------- */
  function dialog(title, body, foot) {
    const dlg = h("dialog", null);
    const close = () => { dlg.close(); };
    dlg.addEventListener("close", () => dlg.remove());
    dlg.append(h("div", { class: "dlg" }, h("div", { class: "dlg__head" }, h("h2", null, title), h("button", { class: "x", "aria-label": "Закрити", onclick: close }, "×")), body, h("div", { class: "dlg__foot" }, foot(close))));
    document.body.append(dlg);
    dlg.showModal();
    return dlg;
  }

  function clientDialog(c) {
    const isNew = !c;
    c = c || { name: "", company: "", email: "", phone: "", contact: "", notes: "", status: "new" };
    const f = {
      name: h("input", { type: "text", value: c.name, autocomplete: "off" }), company: h("input", { type: "text", value: c.company }),
      email: h("input", { type: "email", value: c.email }), phone: h("input", { type: "tel", value: c.phone }),
      contact: h("input", { type: "text", value: c.contact, placeholder: "Telegram, Instagram, WhatsApp…" }),
      status: h("select", null, Object.entries(STATUS).map(([k, l]) => h("option", { value: k, selected: c.status === k }, l))),
      notes: h("textarea", { rows: 7 }, c.notes),
    };
    f.status.value = c.status;
    const err = h("p", { class: "err" });
    const meetings = isNew ? [] : S.meetings.filter((m) => m.client_id === c.id).sort((a, b) => b.start_at - a.start_at);
    const body = h("div", { style: "display:grid;gap:12px" },
      isNew ? null : h("p", { class: "muted small", style: "margin:0" }, "Додано " + fShort(c.created_at) + " · " + (SOURCE[c.source] || c.source) + (c.lang ? " · " + c.lang.toUpperCase() : "")),
      h("div", { class: "grid2" }, field("Ім'я", f.name), field("Компанія", f.company), field("Email", f.email), field("Телефон", f.phone)),
      field("Інший контакт", f.contact), field("Статус", f.status), field("Нотатки", f.notes),
      isNew ? null : h("div", { style: "display:grid;gap:8px" }, h("h3", null, "Зустрічі"),
        meetings.length ? h("div", { class: "sub-list" }, meetings.map((m) => meetingItem(m, true))) : h("p", { class: "muted small", style: "margin:0" }, "Ще не було."),
        h("div", null, h("button", { class: "btn btn--ghost btn--sm", onclick: () => meetingDialog(null, c.id) }, "+ Зустріч з цим клієнтом"))),
      err);
    const dlg = dialog(isNew ? "Новий клієнт" : c.name || "Клієнт", body, (close) => [
      h("button", { class: "btn", onclick: async () => {
        const client = Object.fromEntries(Object.entries(f).map(([k, el]) => [k, el.value]));
        if (!client.name.trim()) return (err.textContent = "Вкажи ім'я.");
        const r = await api("client_save", { id: isNew ? 0 : c.id, client });
        if (!r.ok) return (err.textContent = "Не вдалося зберегти.");
        S = r; close(); render(); toast("Збережено");
      } }, "Зберегти"),
      h("span", { class: "spacer" }),
      isNew ? null : h("button", { class: "btn btn--danger btn--sm", onclick: async () => {
        if (!confirm("Видалити клієнта повністю? Нотатки і всі його зустрічі зникнуть, майбутні дзвінки в Google буде скасовано. Повернути не можна.")) return;
        const r = await api("client_delete", { id: c.id });
        if (r.ok) { S = r; close(); render(); toast("Клієнта видалено"); }
      } }, "Видалити повністю"),
    ]);
    if (isNew) setTimeout(() => f.name.focus(), 50);
    return dlg;
  }

  function meetingDialog(m, clientId) {
    const isNew = !m;
    const dflt = Math.ceil(Date.now() / 1000 / 3600) * 3600 + 86400;
    m = m || { client_id: clientId || null, start_at: dflt, minutes: S.schedule.minutes, topic: "", notes: "", status: "scheduled", meet_url: "" };
    const sorted = [...S.clients].sort((a, b) => a.name.localeCompare(b.name, "uk"));
    const cSel = h("select", { disabled: !isNew }, h("option", { value: "" }, "— без клієнта —"), h("option", { value: "new" }, "+ новий клієнт"),
      sorted.map((c) => h("option", { value: c.id }, c.name + (c.company ? " · " + c.company : ""))));
    cSel.value = m.client_id ? String(m.client_id) : "";
    const ncName = h("input", { type: "text", placeholder: "Ім'я" }), ncEmail = h("input", { type: "email", placeholder: "Email (для запрошення)" });
    const newBox = h("div", { class: "grid2", hidden: true }, ncName, ncEmail);
    const date = h("input", { type: "date", value: ymd(m.start_at) }), time = h("input", { type: "time", value: hm(m.start_at), step: 300 });
    const minutes = h("input", { type: "number", value: m.minutes, min: 10, max: 240, step: 5 });
    const topic = h("input", { type: "text", value: m.topic, placeholder: "Напр. сайт для стоматології" });
    const notes = h("textarea", { rows: 6 }, m.notes);
    const status = h("select", null, Object.entries(MSTATUS).map(([k, l]) => h("option", { value: k }, l)));
    status.value = m.status;
    const meetUrl = h("input", { type: "text", value: m.meet_url, placeholder: "https://meet.google.com/…" });
    const doMeet = h("input", { type: "checkbox", checked: S.google.on });
    const invite = h("input", { type: "checkbox", checked: true });
    const err = h("p", { class: "err" });
    const syncNew = () => { newBox.hidden = cSel.value !== "new"; };
    cSel.addEventListener("change", syncNew);
    const body = h("div", { style: "display:grid;gap:12px" },
      field("Клієнт", cSel), newBox,
      h("div", { class: "grid2" }, field("Дата", date), field("Час (Варшава)", time)),
      h("div", { class: "grid2" }, field("Тривалість, хв", minutes), isNew ? h("span") : field("Статус", status)),
      field("Тема", topic),
      isNew ? h("div", { style: "display:grid;gap:8px" },
        h("label", { class: "check" }, doMeet, S.google.on ? "Створити Google Meet і подію в календарі" : "Google Meet (спершу підключи Google в налаштуваннях)"),
        h("label", { class: "check" }, invite, "Надіслати клієнту запрошення на email"))
        : m.meet_url ? h("p", { style: "margin:0" }, h("a", { href: m.meet_url, target: "_blank", rel: "noopener" }, m.meet_url), m.gcal ? h("span", { class: "muted small" }, " · подія в Google Календарі") : null)
        : field("Посилання на дзвінок", meetUrl),
      field("Нотатки", notes), err);
    if (!S.google.on) doMeet.disabled = true;
    return dialog(isNew ? "Нова зустріч" : "Зустріч", body, (close) => [
      h("button", { class: "btn", onclick: async (e) => {
        const btn = e.currentTarget;
        if (isNew && cSel.value === "new" && !ncName.value.trim()) return (err.textContent = "Вкажи ім'я нового клієнта.");
        if (!date.value || !time.value) return (err.textContent = "Вкажи дату й час.");
        btn.disabled = true; err.textContent = "";
        const r = await api("meeting_save", { meeting: {
          id: isNew ? 0 : m.id, client_id: cSel.value && cSel.value !== "new" ? +cSel.value : 0,
          new_client: cSel.value === "new" ? { name: ncName.value, email: ncEmail.value } : null,
          date: date.value, time: time.value, minutes: +minutes.value, topic: topic.value, notes: notes.value,
          status: status.value, meet_url: meetUrl.value, meet: isNew && doMeet.checked, invite: invite.checked } });
        btn.disabled = false;
        if (!r.ok) return (err.textContent = "Не вдалося зберегти.");
        S = r; close(); render();
        toast(r.warn === "google_fail" ? "Збережено, але Google не створив Meet" : r.warn === "google_off" ? "Збережено без Meet: Google не підключений" : "Збережено");
      } }, "Зберегти"),
      h("span", { class: "spacer" }),
      isNew ? null : h("button", { class: "btn btn--danger btn--sm", onclick: async () => {
        if (!confirm("Видалити зустріч?" + (m.gcal && m.status === "scheduled" ? " Подію в Google буде скасовано, клієнт отримає лист." : ""))) return;
        const r = await api("meeting_delete", { id: m.id });
        if (r.ok) { S = r; close(); render(); }
      } }, "Видалити"),
    ]);
  }

  /* ---------- маршрути ---------- */
  function render(keepFocus) {
    if (!S) return;
    const [id, query] = (location.hash.slice(1) || "meetings").split("?");
    clientFilter.focus = !!keepFocus;
    if (id === "clients") clientsView();
    else if (id === "retention") retentionView();
    else if (id === "sites") sitesView();
    else if (id === "settings") settingsView(new URLSearchParams(query || "").get("google"));
    else meetingsView();
    if (ui.drawer) drawClient();
  }
  function route() { if (S) render(); else load(); }
  async function load() {
    const r = await api("state", {});
    if (r.ok) { S = r; render(); }
    else if (r.error === "auth") authView(r.configured);
    else app.replaceChildren(h("p", { class: "boot" }, "Не вдалося завантажити CRM. Онови сторінку."));
  }
  window.addEventListener("hashchange", () => { closeClient(); route(); });
  load();
})();
