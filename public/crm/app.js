/* CRM deweb.studio: вхід, зустрічі, клієнти, налаштування. Дані — /crm/api.php. Без бібліотек. */
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
  function shell(active, body) {
    const tab = (id, label) => h("a", { href: "#" + id, "aria-current": active === id ? "page" : null }, label);
    app.replaceChildren(h("div", { class: "wrap" },
      h("header", { class: "top" },
        h("h1", null, "deweb", h("b", null, "."), "studio / CRM"),
        h("span", { class: "spacer" }),
        h("nav", { class: "tabs" }, tab("meetings", "Зустрічі"), tab("clients", "Клієнти"), tab("settings", "Налаштування")),
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

  function meetingsView() {
    const now = Date.now() / 1000;
    const upcoming = S.meetings.filter((m) => m.start_at + m.minutes * 60 > now && m.status === "scheduled").sort((a, b) => a.start_at - b.start_at);
    const past = S.meetings.filter((m) => !upcoming.includes(m)).slice(0, 40);
    const week = upcoming.filter((m) => m.start_at < now + 7 * 86400).length;
    const leads = S.clients.filter((c) => c.status === "new").length;
    const active = S.clients.filter((c) => ["contacted", "call", "proposal"].includes(c.status)).length;
    const kpi = (n, l) => h("div", { class: "panel kpi" }, h("b", null, n), h("span", null, l));
    const list = h("div", { class: "list" });
    let lastDay = "";
    for (const m of upcoming) {
      const d = ymd(m.start_at);
      if (d !== lastDay) { list.append(h("div", { class: "day" }, dayLabel(m.start_at))); lastDay = d; }
      list.append(meetingItem(m));
    }
    if (!upcoming.length) list.append(h("p", { class: "empty" }, "Запланованих зустрічей немає."));
    shell("meetings", h("div", { class: "wrap" },
      h("div", { class: "kpis" }, kpi(upcoming.length, "запланованих"), kpi(week, "цього тижня"), kpi(leads, "нових клієнтів"), kpi(active, "у роботі")),
      googleBanner(),
      h("section", { class: "panel" }, h("h2", null, "Найближчі зустрічі"), list),
      past.length ? h("section", { class: "panel" }, h("h2", null, "Минулі й скасовані"), h("div", { class: "list", style: "margin-top:10px" }, past.map((m) => meetingItem(m, true)))) : null));
  }

  function googleBanner() {
    if (S.google.on && !S.google.error) return null;
    return h("div", { class: "panel small" },
      S.google.error ? "Google Календар відключився (доступ відкликано або минув). " : "Google Календар ще не підключений, тому зустрічі створюються без посилання на Meet. ",
      h("a", { href: "#settings" }, "Підключити в налаштуваннях"));
  }

  function clientsView() {
    const q = clientFilter.q.trim().toLowerCase();
    const counts = {};
    for (const c of S.clients) counts[c.status] = (counts[c.status] || 0) + 1;
    const rows = S.clients.filter((c) => (!clientFilter.status || c.status === clientFilter.status)
      && (!q || [c.name, c.company, c.email, c.phone, c.contact, c.notes].join(" ").toLowerCase().includes(q)));
    const next = (id) => S.meetings.filter((m) => m.client_id === id && m.status === "scheduled" && m.start_at > Date.now() / 1000).sort((a, b) => a.start_at - b.start_at)[0];
    const list = h("div", { class: "list" }, rows.map((c) => {
      const n = next(c.id);
      return h("button", { class: "item", onclick: () => clientDialog(c) },
        h("span", { class: "item__main" }, h("b", null, c.name || "Без імені"),
          h("span", null, [c.company, c.email || c.phone || c.contact, SOURCE[c.source], n ? "дзвінок " + fShort(n.start_at) + " " + hm(n.start_at) : ""].filter(Boolean).join(" · "))),
        badge(c.status, STATUS[c.status]));
    }));
    if (!rows.length) list.append(h("p", { class: "empty" }, S.clients.length ? "Нічого не знайдено." : "Клієнтів поки немає. Вони з'являться тут із чату й форми, або додай вручну."));
    const search = h("input", { type: "search", placeholder: "Пошук за іменем, email, нотатками…", value: clientFilter.q, oninput: (e) => { clientFilter.q = e.target.value; render(true); } });
    const chip = (key, label) => h("button", { "aria-pressed": String(clientFilter.status === key), onclick: () => { clientFilter.status = key; render(); } }, label);
    shell("clients", h("section", { class: "panel", style: "display:grid;gap:12px" },
      search,
      h("div", { class: "chips" }, chip("", "Усі · " + S.clients.length), Object.entries(STATUS).map(([k, l]) => chip(k, l + (counts[k] ? " · " + counts[k] : "")))),
      list));
    if (clientFilter.focus) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
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
    else if (id === "settings") settingsView(new URLSearchParams(query || "").get("google"));
    else meetingsView();
  }
  function route() { if (S) render(); else load(); }
  async function load() {
    const r = await api("state", {});
    if (r.ok) { S = r; render(); }
    else if (r.error === "auth") authView(r.configured);
    else app.replaceChildren(h("p", { class: "boot" }, "Не вдалося завантажити CRM. Онови сторінку."));
  }
  window.addEventListener("hashchange", route);
  load();
})();
