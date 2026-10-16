"use client";

import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Behaviors from "./Behaviors";
import Footer from "./Footer";
import QuoteModal from "./QuoteModal";
import ChatAgent from "./ChatAgent";
import { ArrowUpRight } from "./Icons";
import { UI, localeOf, type Locale, type UIStrings } from "../lib/i18n";
import { loadTurnstile } from "../lib/turnstile";
import { AUDIT_SEO } from "../lib/auditSeo";
import { AUDIT, AU_CRIT, AU_GROUPS, AU_HOSTED, type AuP, type AuStatus, type AuditTexts } from "../lib/auditText";

/* Прихована сторінка «Перевірка сайту» (/audyt/, /en/audit/, /ua/audyt/).
   Перевіряє сервер (public/api/audit.php); тут — форма, звіт, PDF (друк браузера) і приклад ідеального звіту.
   Звіт має власне посилання ?r=<id>. Без контакту відкрита лише перша група, решта — після email/Instagram/Telegram. */

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const API = "/api/audit.php";

type Item = { id: string; g: string; s: AuStatus; p?: AuP };
type Report = {
  id: string; host: string; url: string; created: number; score: number; unlocked: boolean;
  platform: { id: string; name: string; ver: string; host: string };
  counts: { ok: number; warn: number; bad: number }; speed: "pending" | "running" | "done" | "fail"; items: Item[];
  example?: boolean;
};

/* приклад: сайт, який проходить усі перевірки */
const EXAMPLE_P: Record<string, AuP> = {
  https: { until: "2027-03-14" }, redir: { code: 301 }, www: { alt: "www", code: 301 }, "404": { code: 404 },
  robots: { found: 1, sitemap: 1 }, sitemap: { n: 24 }, noindex: {}, canon: {},
  title: { len: 52 }, desc: { len: 148 }, og: { img: 1, title: 1, ok: 1, kb: 118, w: 1200, h: 630 }, fav: { apple: 1, icon: 1 }, viewport: {}, lang: { lang: "pl" },
  h1: { n: 1 }, alt: { n: 18, miss: 0 }, schema: { types: "LocalBusiness, WebSite" }, links: { n: 20, broken: 0, list: [] }, text: { words: 860 },
  psi_m: { score: 96, lcp: 1.6 }, psi_d: { score: 100, lcp: 0.6 }, img: { kb: 184, name: "hero.webp", n: 12 }, gzip: { enc: "br", cache: 1 },
  files: { list: [] }, list: { list: [] }, heads: { n: 6, miss: [] }, mixed: { n: 0 },
  priv: {}, cookie: { cmp: 1, trackers: 1 }, ga: { list: ["Google Analytics", "Microsoft Clarity"] }, captcha: { form: 1, cap: "Cloudflare Turnstile" },
};
const GROUP_OF: Record<string, string> = {
  https: "domain", redir: "domain", www: "domain", "404": "domain", robots: "google", sitemap: "google", noindex: "google", canon: "google",
  title: "preview", desc: "preview", og: "preview", fav: "preview", viewport: "preview", lang: "preview",
  h1: "content", alt: "content", schema: "content", links: "content", text: "content", psi_m: "speed", psi_d: "speed", img: "speed", gzip: "speed",
  files: "security", list: "security", heads: "security", mixed: "security", priv: "legal", cookie: "legal", ga: "track", captcha: "track",
};
function exampleReport(t: AuditTexts): Report {
  const host = t.example.host;
  /* порядок як у справжньому звіті (Object.entries ставить "404" першим) */
  const order = ["https", "redir", "www", "404"].concat(Object.keys(EXAMPLE_P).filter((id) => GROUP_OF[id] !== "domain"));
  const items = order.map((id) => {
    const q = { ...EXAMPLE_P[id] };
    if (id === "www") q.alt = `www.${host}`;
    if (id === "title") q.text = t.hero.titleAccent + " " + t.hero.titleRest;
    if (id === "h1") q.text = host;
    return { id, g: GROUP_OF[id], s: "ok" as AuStatus, p: q };
  });
  return { id: "", host, url: `https://${host}/`, created: Date.now() / 1000, score: 100, unlocked: true, platform: { id: "custom", name: "Next.js", ver: "", host: "" },
    counts: { ok: items.length, warn: 0, bad: 0 }, speed: "done", items, example: true };
}

const cls = (n: number) => (n >= 80 ? "ok" : n >= 55 ? "warn" : "bad");
const ICON: Record<AuStatus, string> = { ok: "✓", warn: "!", bad: "✕", na: "–", wait: "" };
const normHost = (v: string) => v.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0];
const track = (event: string, extra: Record<string, unknown> = {}) => {
  const w = window as any;
  try { if (w.dataLayer) w.dataLayer.push({ event, ...extra }); } catch {}
};

export default function AuditClient({ locale, home }: { locale: Locale; home: any }) {
  const t = AUDIT[locale];
  const seo = AUDIT_SEO[locale];
  const ui = UI[locale];
  const [report, setReport] = useState<Report | null>(null);
  const [phase, setPhase] = useState<"idle" | "scan">("idle");
  const [step, setStep] = useState(0);
  const [scanHost, setScanHost] = useState("");
  const [err, setErr] = useState("");
  const [way, setWay] = useState<"email" | "ig" | "tg">("email");
  const [gErr, setGErr] = useState("");
  const [gBusy, setGBusy] = useState(false);
  const [toast, setToast] = useState("");
  const born = useRef(Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.documentElement.lang = localeOf(locale).htmlLang; }, [locale]);
  /* звіт (?r=…) — чужий сайт, у Google йому не місце; основний захист — X-Robots-Tag у public/.htaccess */
  useEffect(() => {
    if (!report || report.example) return;
    let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!m) { m = document.createElement("meta"); m.name = "robots"; document.head.appendChild(m); }
    m.content = "noindex, follow";
  }, [report]);
  /* ?url=… — адреса, яку людина ввела на сторінці чек-листа: підставляємо в поле (перевірку запускає сама людина, бо потрібен Turnstile) */
  useEffect(() => {
    const u = new URLSearchParams(location.search).get("url");
    if (u && urlRef.current && !urlRef.current.value) urlRef.current.value = u.replace(/^\s*https?:\/\//i, "").slice(0, 200);
  }, []);
  /* форма аудиту на самій сторінці, тож перевірку Turnstile готуємо одразу після завантаження */
  useEffect(() => {
    if (document.readyState === "complete") { loadTurnstile(); return; }
    window.addEventListener("load", loadTurnstile, { once: true });
    return () => window.removeEventListener("load", loadTurnstile);
  }, []);

  /* PageSpeed — окремим запитом: довго, тому звіт показуємо одразу, а швидкість доміряється */
  const runSpeed = async (id: string) => {
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "speed", id }) });
      const j = await r.json();
      if (j.ok) setReport((cur) => (cur && cur.id === id ? { ...j.report, unlocked: cur.unlocked || j.report.unlocked } : cur));
    } catch {}
  };
  const reload = async (id: string) => {
    try {
      const r = await fetch(`${API}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) { setErr(t.err.notFound); return; }
      setReport(j.report);
      if (j.report.speed === "pending" || j.report.speed === "running") runSpeed(id);
    } catch { setErr(t.err.generic); }
  };

  /* звіт за посиланням ?r=<id> */
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("r") || "";
    if (/^[a-z0-9]{10}$/.test(id)) reload(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const h = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(h);
  }, [toast]);

  const scrollToReport = () => requestAnimationFrame(() => {
    const el = reportRef.current; if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  });

  const onScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "scan") return;
    const fd = new FormData(e.currentTarget);
    const host = normHost(String(fd.get("url") || ""));
    if (!/^([a-z0-9¡-￿]([a-z0-9¡-￿-]*[a-z0-9¡-￿])?\.)+[a-z¡-￿][a-z0-9¡-￿-]+$/.test(host)) { setErr(t.err.url); urlRef.current?.focus(); return; }
    setErr(""); setReport(null); setScanHost(host); setPhase("scan"); setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, t.steps.length - 1)), 1700);
    try {
      const r = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan", url: host, lang: locale, turnstile: String(fd.get("cf-turnstile-response") || ""), t: Date.now() - born.current, company: String(fd.get("company") || "") }),
      });
      const j = await r.json().catch(() => ({ ok: false, error: "generic" }));
      if (!j.ok) { setErr((t.err as any)[j.error] || t.err.generic); return; }
      setReport(j.report);
      history.replaceState(null, "", `${location.pathname}?r=${j.report.id}`);
      track("site_audit", { audit_score: j.report.score, audit_platform: j.report.platform?.id, form_lang: locale });
      scrollToReport();
      runSpeed(j.report.id);
    } catch { setErr(t.err.generic); }
    finally {
      clearInterval(timer); setPhase("idle");
      const w = window as any;
      try { if (w.turnstile?.reset && document.querySelector(".au-ts")) w.turnstile.reset(".au-ts"); } catch {}
    }
  };

  const onUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!report || gBusy) return;
    const v = String(new FormData(e.currentTarget).get("contact") || "").trim();
    const good = way === "email" ? /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v) : /^@?[A-Za-z0-9_.]{2,40}$/.test(v);
    if (!good) { setGErr(t.gate.err); return; }
    setGErr(""); setGBusy(true);
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unlock", id: report.id, way, contact: v, lang: locale }) });
      const j = await r.json().catch(() => ({ ok: false }));
      if (!j.ok) { setGErr(j.error === "rate" ? t.err.rate : t.gate.err); return; }
      setReport((cur) => (cur && cur.id === j.report.id ? { ...j.report, speed: cur.speed === "done" || cur.speed === "fail" ? cur.speed : j.report.speed, items: mergeSpeed(j.report.items, cur.items) } : j.report));
      track("audit_lead", { contact_method: way, form_lang: locale });
    } catch { setGErr(t.err.generic); }
    finally { setGBusy(false); }
  };

  const showExample = () => { setErr(""); setReport(exampleReport(t)); scrollToReport(); };
  const backToForm = () => {
    setReport(null);
    if (location.search) history.replaceState(null, "", location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => urlRef.current?.focus(), 400);
  };
  const copyLink = async () => {
    if (!report) return;
    const link = `${location.origin}${location.pathname}?r=${report.id}`;
    try { await navigator.clipboard.writeText(link); setToast(t.actions.copied); } catch { setToast(link); }
  };

  return (
    <div className={`locale locale-${locale}`}>
      <Header home={false} locale={locale} page="audit" />
      <main className="page au">
        <div className="page__head au-head">
          <h1 className="au-h1">
            <span className="au-eyebrow">{t.hero.eyebrow}</span>
            <span className="page__title"><em>{t.hero.titleAccent}</em> {t.hero.titleRest}</span>
          </h1>
          <p className="page__lead">{t.hero.lead}</p>
        </div>

        <div className="au-col">
          <section className="au-panel au-scan">
            <form ref={formRef} onSubmit={onScan} noValidate>
              <div className="au-row">
                <label className="au-field">
                  <span>{t.form.prefix}</span>
                  <input ref={urlRef} name="url" type="text" onChange={(e) => { const v = e.currentTarget.value.replace(/^\s*https?:\/\//i, ""); if (v !== e.currentTarget.value) e.currentTarget.value = v; }} inputMode="url" autoComplete="url" autoCapitalize="off" spellCheck={false} placeholder={t.form.placeholder} aria-label={t.form.placeholder} required />
                </label>
                <button className="au-btn" type="submit" disabled={phase === "scan"}>{phase === "scan" ? t.form.going : t.form.go}</button>
              </div>
              <input className="qf__hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {TURNSTILE_KEY && <div className="cf-turnstile au-ts" data-sitekey={TURNSTILE_KEY} data-appearance="interaction-only" data-theme="light"></div>}
            </form>
            {err && <p className="au-err" role="alert">{err}</p>}
            <div className="au-perks">{t.form.perks.map((x) => <span key={x}>{x}</span>)}</div>
            <button className="au-link" type="button" onClick={showExample}>{t.form.example}</button>
          </section>

          {phase === "scan" && (
            <section className="au-panel au-prog" aria-live="polite">
              <div className="au-prog__top"><b>{t.progress(scanHost)}</b><span>{Math.round((step / t.steps.length) * 100)}%</span></div>
              <div className="au-bar"><i style={{ width: `${Math.max(6, (step / t.steps.length) * 100)}%` }} /></div>
              <ul className="au-steps">
                {t.steps.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "run" : ""}><span className="d">{i < step ? "✓" : ""}</span>{s}</li>)}
              </ul>
            </section>
          )}

          {report && <div ref={reportRef}><ReportView r={report} t={t} way={way} setWay={setWay} gErr={gErr} gBusy={gBusy} onUnlock={onUnlock} onBack={backToForm} onCopy={copyLink} legal={ui.legal} /></div>}
        </div>

        {/* для Google і для тих, хто ще вагається: що перевіряємо + часті питання (те саме — у JSON-LD, lib/auditPage.tsx) */}
        <section className="au-seo" aria-labelledby="au-seo-h">
          <h2 id="au-seo-h">{seo.h2}</h2>
          <p className="au-seo__intro">{seo.intro}</p>
          <div className="au-seo__grid">
            {seo.blocks.map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}
          </div>
          <h2>{seo.faqTitle}</h2>
          <div className="au-faq">
            {seo.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>
      </main>
      <Footer footer={home?.footer} t={ui} />
      <QuoteModal form={home?.quoteForm} t={ui} locale={locale} />
      <ChatAgent locale={locale} />
      <Behaviors page="inner" />
      {toast && <div className="au-toast" role="status">{toast}</div>}
    </div>
  );
}

/* після контакту сервер віддає повний звіт; якщо швидкість уже доміряна в браузері — не губимо її */
function mergeSpeed(next: Item[], cur: Item[]) {
  return next.map((i) => {
    if (i.s !== "wait") return i;
    const c = cur.find((x) => x.id === i.id);
    return c && c.s !== "wait" ? c : i;
  });
}

function ReportView({ r, t, way, setWay, gErr, gBusy, onUnlock, onBack, onCopy, legal }: {
  legal: UIStrings["legal"]; r: Report; t: AuditTexts; way: "email" | "ig" | "tg"; setWay: (w: "email" | "ig" | "tg") => void; gErr: string; gBusy: boolean;
  onUnlock: (e: React.FormEvent<HTMLFormElement>) => void; onBack: () => void; onCopy: () => void;
}) {
  const P = r.platform;
  const hosted = AU_HOSTED.includes(P.id);
  const platName = P.name === "custom" ? t.custom : P.name;
  const fixKey = P.id === "wp" || P.id === "wix" || P.id === "tilda" || P.id === "shopify" || P.id === "cms" ? P.id : hosted ? "hosted" : "def";
  const L = 2 * Math.PI * 64;
  const k = cls(r.score);
  const speedWait = r.speed === "pending" || r.speed === "running";
  const date = new Date(r.created * 1000).toLocaleDateString(localeTag(t), { day: "numeric", month: "long", year: "numeric" });

  const itemText = (i: Item) => {
    const c = t.checks[i.id];
    if (!c) return "";
    if (i.s === "wait") return t.wait;
    if (i.s === "na") return i.p?.fail ? t.naPsi : t.na(platName);
    const p = i.p || {};
    if (i.s === "ok") return c.ok(p);
    const fn = i.s === "bad" ? c.bad || c.warn : c.warn || c.bad;
    return fn ? fn(p) : "";
  };
  const fixText = (id: string) => {
    const f = t.checks[id]?.fix || {};
    return (f as any)[fixKey] || (hosted ? f.hosted : "") || f.def || "";
  };

  const groups = AU_GROUPS.map((g) => ({ g, items: r.items.filter((i) => i.g === g && t.checks[i.id]) })).filter((x) => x.items.length);
  const open = groups.filter((x) => r.unlocked || x.g === "domain");
  const closed = groups.filter((x) => !r.unlocked && x.g !== "domain");
  const closedN = closed.reduce((n, x) => n + x.items.length, 0);

  const Group = ({ g, items, locked }: { g: string; items: Item[]; locked?: boolean }) => (
    <section className="au-panel au-group">
      <div className="au-ghead"><h2>{t.groups[g]}</h2><span>{t.groupOk(items.filter((i) => i.s === "ok" || i.s === "na").length, items.length)}</span></div>
      {items.map((i) => (
        <div className="au-item" key={i.id}>
          <span className={`au-ic ${i.s}`} aria-label={t.status[i.s]}>{ICON[i.s]}</span>
          <div className="au-item__body">
            <div className="au-item__t">{t.checks[i.id].t}{AU_CRIT.includes(i.id) && (i.s === "bad" || i.s === "warn") && <span className="au-crit">{t.crit}</span>}</div>
            {locked ? <p className="au-blur" aria-hidden="true">{t.locked}</p> : <p>{itemText(i)}</p>}
            {!locked && (i.s === "warn" || i.s === "bad") && fixText(i.id) && <div className="au-fix"><b>{t.fixLabel}</b> {fixText(i.id)}</div>}
          </div>
        </div>
      ))}
    </section>
  );

  return (
    <div className="au-report">
      <p className="au-print-head">{t.printed(date)}</p>
      {r.example && (
        <div className="au-flag"><span>{t.example.flag}</span><button type="button" onClick={onBack}>{t.example.back}</button></div>
      )}
      <section className="au-panel">
        <div className="au-sum">
          <div className="au-ring" role="img" aria-label={t.scoreAria(r.score)}>
            <svg viewBox="0 0 150 150" aria-hidden="true">
              <circle cx="75" cy="75" r="64" fill="none" stroke="var(--au-line)" strokeWidth="12" />
              <circle cx="75" cy="75" r="64" fill="none" stroke={`var(--au-${k})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - r.score / 100)} />
            </svg>
            <div className="au-ring__v"><div><b>{r.score}</b><small>{t.of100}</small></div></div>
          </div>
          <div className="au-sum__info">
            <h2>{r.host}</h2>
            <p className="au-verdict">{t.verdict(r.score)}</p>
            <div className="au-chips">
              <span className="au-chip plat">{platName}{P.ver ? ` ${P.ver}` : ""}{P.host && P.host !== P.name ? ` · ${P.host}` : ""}</span>
              <span className="au-chip bad"><b>{r.counts.bad}</b> {t.chips.bad}</span>
              <span className="au-chip warn"><b>{r.counts.warn}</b> {t.chips.warn}</span>
              <span className="au-chip ok"><b>{r.counts.ok}</b> {t.chips.ok}</span>
            </div>
            {speedWait && <p className="au-note">{t.speedNote}</p>}
          </div>
        </div>
        <p className="au-platnote">{t.platNote(P.id, platName)}</p>
      </section>

      {open.map((x) => <Group key={x.g} g={x.g} items={x.items} />)}

      {closed.length > 0 && (
        <div className="au-locked">
          <div className="au-locked__list" aria-hidden="true">{closed.map((x) => <Group key={x.g} g={x.g} items={x.items} locked />)}</div>
          <form className="au-gate" onSubmit={onUnlock} noValidate>
            <h2>{t.gate.title}</h2>
            <p>{t.gate.text(closedN, platName)}</p>
            <div className="au-ways" role="group">
              {(["email", "ig", "tg"] as const).map((w) => (
                <button key={w} type="button" aria-pressed={way === w} onClick={() => setWay(w)}>{t.gate.ways[w]}</button>
              ))}
            </div>
            <label className="au-field">
              <input name="contact" type={way === "email" ? "email" : "text"} autoComplete={way === "email" ? "email" : "off"} autoCapitalize="off" spellCheck={false}
                placeholder={way === "email" ? t.gate.phEmail : t.gate.phNick} aria-label={way === "email" ? t.gate.phEmail : t.gate.phNick} />
            </label>
            <button className="au-btn" type="submit" disabled={gBusy}>{t.gate.send}</button>
            <span className="au-consent">{t.gate.consent} <a href={legal.privacyHref} target="_blank" rel="noopener">{legal.note}</a></span>
            {gErr && <p className="au-err" role="alert">{gErr}</p>}
          </form>
        </div>
      )}

      {r.unlocked && (
        <>
          {!r.example && (
            <section className="au-panel au-actions">
              <button className="au-btn" type="button" onClick={() => window.print()}>{t.actions.pdf}</button>
              <button className="au-btn ghost" type="button" onClick={onCopy}>{t.actions.link}</button>
              <button className="au-btn ghost" type="button" onClick={onBack}>{t.actions.again}</button>
            </section>
          )}
          <section className="au-panel au-manual">
            <div className="au-ghead"><h2>{t.manual.title}</h2><span>{t.manual.note}</span></div>
            <ul>{t.manual.items.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}</ul>
          </section>
        </>
      )}

      <section className="au-cta">
        <div><h2>{t.cta.title}</h2><p>{t.cta.text}</p></div>
        <button className="btn-primary" type="button" data-open-quote aria-haspopup="dialog"><span>{t.cta.btn}</span><ArrowUpRight /></button>
      </section>
    </div>
  );
}

function localeTag(t: AuditTexts) {
  return t === AUDIT.ua ? "uk" : t === AUDIT.pl ? "pl" : "en";
}
