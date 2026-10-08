/* Збір статистики для закритої сторінки /stats (запускає .github/workflows/stats.yml щодня).
   Search Console і GA4 щоразу перечитуються за останні DAYS днів (API віддають історію),
   Clarity віддає лише останню добу, тому її дані накопичуються в історії день за днем.
   Без залежностей: тільки Node 22 (fetch + crypto).

   node scripts/stats/fetch.mjs <history.json>   — оновлює файл на місці
   Змінні: GOOGLE_SA_JSON, GA4_PROPERTY_ID, GSC_SITE, CLARITY_TOKEN, STATS_DAYS (необов'язково) */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";

const file = process.argv[2] || "history.json";
const DAYS = Number(process.env.STATS_DAYS || 400);
const TZ = "Europe/Warsaw";
const env = (k) => (process.env[k] || "").trim();

const errors = [];
const warn = (src, e) => { const m = `${src}: ${e?.message || e}`; errors.push(m); console.warn("⚠", m); };

/* ---------- дати (за часом Варшави) ---------- */
const ymd = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (s, n) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = ymd(new Date());
const yesterday = addDays(today, -1);

/* ---------- мова за адресою сторінки ---------- */
const toPath = (u) => { try { return new URL(u, "https://x").pathname || "/"; } catch { return String(u || "/"); } };
/* з 2026-10-08 польська на /, англійська на /en/ (і блог англійською); старі /pl/ теж рахуємо як PL */
const langOf = (u) => { const p = toPath(u); return p.startsWith("/ua/") || p === "/ua" ? "ua" : p.startsWith("/en/") || p === "/en" || p.startsWith("/blog") ? "en" : "pl"; };
const r1 = (n) => Math.round(n * 10) / 10;

/* ---------- Google: токен сервісного акаунта ---------- */
async function googleToken(sa, scope) {
  const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error(`token ${res.status}: ${j.error_description || j.error || "no token"}`);
  return j.access_token;
}

async function postJson(url, token, body) {
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${j.error?.message || res.statusText}`);
  return j;
}

/* ---------- Search Console ---------- */
async function gscAll(token, site, body) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const j = await postJson(url, token, { rowLimit: 25000, startRow, ...body });
    rows.push(...(j.rows || []));
    if (!j.rows || j.rows.length < 25000) break;
  }
  return rows;
}

async function fetchGsc(store) {
  const sa = JSON.parse(env("GOOGLE_SA_JSON"));
  const site = env("GSC_SITE") || "https://deweb.studio/";
  const token = await googleToken(sa, "https://www.googleapis.com/auth/webmasters.readonly");
  const start = addDays(today, -DAYS), end = today;

  const byDate = await gscAll(token, site, { startDate: start, endDate: end, dimensions: ["date"] });
  const byDatePage = await gscAll(token, site, { startDate: start, endDate: end, dimensions: ["date", "page"] });
  if (!byDate.length) throw new Error("немає даних (перевір, чи сервісний акаунт доданий у ресурс https://deweb.studio/)");

  for (const r of byDate) {
    const d = day(store, r.keys[0]);
    d.gsc = { all: { c: r.clicks, i: r.impressions, p: r1(r.position) } };
  }
  const acc = {};
  for (const r of byDatePage) {
    const [date, page] = r.keys, l = langOf(page);
    const a = ((acc[date] ||= {})[l] ||= { c: 0, i: 0, pi: 0 });
    a.c += r.clicks; a.i += r.impressions; a.pi += r.position * r.impressions;
  }
  for (const [date, langs] of Object.entries(acc)) {
    const d = day(store, date);
    d.gsc ||= {};
    for (const [l, a] of Object.entries(langs)) d.gsc[l] = { c: a.c, i: a.i, p: a.i ? r1(a.pi / a.i) : null };
  }

  /* таблиці за періоди: поточний і попередній відрізок однакової довжини */
  const lastDate = byDate.map((r) => r.keys[0]).sort().pop();
  store.gscLast = lastDate;
  for (const P of [7, 28, 90]) {
    const cur = { startDate: addDays(lastDate, -(P - 1)), endDate: lastDate };
    const prev = { startDate: addDays(lastDate, -(2 * P - 1)), endDate: addDays(lastDate, -P) };
    const [q, qp, pg, pgp] = await Promise.all([
      gscAll(token, site, { ...cur, dimensions: ["query"], rowLimit: 200 }),
      gscAll(token, site, { ...prev, dimensions: ["query"] }),
      gscAll(token, site, { ...cur, dimensions: ["page"], rowLimit: 200 }),
      gscAll(token, site, { ...prev, dimensions: ["page"] }),
    ]);
    const prevMap = (rows) => Object.fromEntries(rows.map((r) => [r.keys[0], r]));
    const qpm = prevMap(qp), pgpm = prevMap(pgp);
    const row = (r, pm) => { const p = pm[r.keys[0]]; return { k: r.keys[0], c: r.clicks, i: r.impressions, p: r1(r.position), pc: p?.clicks ?? null, pp: p ? r1(p.position) : null }; };
    const per = (store.periods[P] ||= {});
    per.gsc = {
      range: cur, prev,
      queries: q.slice(0, 200).map((r) => row(r, qpm)),
      pages: pg.slice(0, 200).map((r) => ({ ...row(r, pgpm), k: toPath(r.keys[0]) })),
    };
  }
}

/* ---------- GA4 ---------- */
async function fetchGa(store) {
  const sa = JSON.parse(env("GOOGLE_SA_JSON"));
  const prop = env("GA4_PROPERTY_ID");
  if (!prop) throw new Error("немає GA4_PROPERTY_ID");
  const token = await googleToken(sa, "https://www.googleapis.com/auth/analytics.readonly");
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
  const report = async (body) => {
    const j = await postJson(url, token, { limit: 100000, ...body });
    return (j.rows || []).map((r) => ({ d: r.dimensionValues.map((x) => x.value), m: r.metricValues.map((x) => Number(x.value)) }));
  };
  const gaDate = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const range = { startDate: addDays(today, -DAYS), endDate: yesterday };

  const daily = await report({ dateRanges: [range], dimensions: [{ name: "date" }], metrics: ["activeUsers", "sessions", "engagedSessions", "screenPageViews"].map((name) => ({ name })) });
  for (const { d: [dt], m: [u, s, es, v] } of daily) day(store, gaDate(dt)).ga = { all: { u, s, es, v } };

  const byLang = await report({ dateRanges: [range], dimensions: [{ name: "date" }, { name: "landingPage" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }] });
  for (const { d: [dt, lp], m: [s, es] } of byLang) {
    const g = (day(store, gaDate(dt)).ga ||= {});
    const a = (g[langOf(lp)] ||= { s: 0, es: 0 });
    a.s += s; a.es += es;
  }

  const events = await report({
    dateRanges: [range], dimensions: [{ name: "date" }, { name: "eventName" }], metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["generate_lead", "conversion_event_submit_lead_form", "conversion_event_submit_lead_form_1", "quote_open"] } } },
  });
  for (const { d: [dt, ev], m: [n] } of events) ((day(store, gaDate(dt)).ga ||= {}).ev ||= {})[ev] = n;

  for (const P of [7, 28, 90]) {
    const dr = [{ startDate: addDays(yesterday, -(P - 1)), endDate: yesterday }];
    const top = (dim, metrics = ["sessions"]) => report({ dateRanges: dr, dimensions: [{ name: dim }], metrics: metrics.map((name) => ({ name })), orderBys: [{ metric: { metricName: metrics[0] }, desc: true }], limit: 50 });
    const [ch, co, dev, pages] = await Promise.all([
      top("sessionDefaultChannelGroup"), top("country"), top("deviceCategory"),
      top("pagePath", ["screenPageViews", "activeUsers", "userEngagementDuration", "sessions"]),
    ]);
    const kv = (rows) => rows.map((r) => ({ k: r.d[0], s: r.m[0] }));
    (store.periods[P] ||= {}).ga = {
      range: dr[0], channels: kv(ch), countries: kv(co), devices: kv(dev),
      pages: pages.map((r) => ({ k: r.d[0], v: r.m[0], u: r.m[1], eng: r.m[1] ? Math.round(r.m[2] / r.m[1]) : 0, s: r.m[3] })),
    };
  }
}

/* ---------- Microsoft Clarity (Data Export API: остання доба, до 10 запитів на день) ---------- */
async function fetchClarity(store) {
  const token = env("CLARITY_TOKEN");
  if (!token) throw new Error("немає CLARITY_TOKEN");
  const get = async (q) => {
    const res = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?${q}`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    const j = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(j)) throw new Error(`${res.status} ${typeof j === "string" ? j : JSON.stringify(j)?.slice(0, 160)}`);
    return j;
  };
  const num = (v) => (v == null || v === "" ? null : Number(v));
  /* зводимо відповідь у { ключ: {s, users, scroll, active, rage, dead, quick, excess, err} } */
  const parse = (metrics, keyOf) => {
    const out = {};
    for (const m of metrics) {
      const name = String(m.metricName || "").toLowerCase().replace(/\s/g, "");
      for (const info of m.information || []) {
        const o = (out[keyOf(info)] ||= {});
        if (name === "traffic") { o.s = num(info.totalSessionCount); o.bots = num(info.totalBotSessionCount); o.users = num(info.distinctUserCount); o.pps = num(info.pagesPerSessionPercentage); }
        else if (name === "scrolldepth") o.scroll = num(info.averageScrollDepth);
        else if (name === "engagementtime") { o.active = num(info.activeTime); o.total = num(info.totalTime); }
        else {
          const map = { rageclickcount: "rage", deadclickcount: "dead", quickbackclick: "quick", excessivescroll: "excess", scripterrorcount: "err", errorclickcount: "errclick" };
          if (map[name]) o[map[name]] = num(info.sessionsWithMetricPercentage);
        }
      }
    }
    return out;
  };
  const total = parse(await get("numOfDays=1"), () => "_");
  if (!total._ || total._.s == null) throw new Error("відповідь без даних про трафік");
  const d = day(store, yesterday);
  d.cl = total._;
  try {
    const urlKey = (info) => { const k = Object.keys(info).find((x) => /^url$/i.test(x)); return toPath(k ? info[k] : "/"); };
    const pages = Object.entries(parse(await get("numOfDays=1&dimension1=URL"), urlKey))
      .filter(([, v]) => v.s).sort((a, b) => b[1].s - a[1].s).slice(0, 40);
    d.clp = Object.fromEntries(pages);
  } catch (e) { warn("Clarity (сторінки)", e); }
}

/* ---------- сховище ---------- */
function day(store, date) { return (store.daily[date] ||= {}); }

const store = existsSync(file) ? JSON.parse(readFileSync(file, "utf8") || "{}") : {};
const prevPeriods = store.periods || {};
store.v = 1; store.daily ||= {}; store.periods = {};

const jobs = [["Search Console", fetchGsc, !!env("GOOGLE_SA_JSON")], ["GA4", fetchGa, !!env("GOOGLE_SA_JSON")], ["Clarity", fetchClarity, true]];
const ok = {};
for (const [name, fn, can] of jobs) {
  if (!can) { warn(name, "немає ключа сервісного акаунта"); continue; }
  try { await fn(store); ok[name] = true; console.log("✓", name); }
  catch (e) { warn(name, e); }
}
/* якщо джерело впало — лишаємо таблиці з минулого запуску, щоб сторінка не спорожніла */
for (const P of [7, 28, 90]) {
  const p = (store.periods[P] ||= {});
  if (!p.gsc && prevPeriods[P]?.gsc) p.gsc = prevPeriods[P].gsc;
  if (!p.ga && prevPeriods[P]?.ga) p.ga = prevPeriods[P].ga;
}
store.updated = new Date().toISOString();
store.errors = errors;
store.sources = ok;

const sorted = Object.keys(store.daily).sort();
store.daily = Object.fromEntries(sorted.map((k) => [k, store.daily[k]]));
writeFileSync(file, JSON.stringify(store));
console.log(`Записано ${file}: ${sorted.length} днів, помилок ${errors.length}`);
if (!Object.keys(ok).length) process.exit(1);
