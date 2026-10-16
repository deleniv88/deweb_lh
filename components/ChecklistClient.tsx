"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import Behaviors from "./Behaviors";
import Footer from "./Footer";
import QuoteModal from "./QuoteModal";
import ChatAgent from "./ChatAgent";
import { ArrowUpRight } from "./Icons";
import { UI, auditPath, localeOf, type Locale } from "../lib/i18n";
import { CHECKLIST } from "../lib/checklistText";

/* Прихована сторінка «Сайт зробив AI?» (/checklist/, /en/checklist/, /ua/checklist/).
   Інтерактивний чек-лист: пункт розкривається з поясненням, кроками і прикладами «так / не так»,
   відповідь Так / Ні / Не знаю відкриває наступний. Наприкінці — список «що виправити» і перехід на /audyt/ з адресою сайту.
   Відповіді зберігаються лише в браузері відвідувача (localStorage). Лічильники для /stats: cl_open, cl_done, cl_go (api/events.php). */

type Ans = "yes" | "no" | "na";
const KEY = "dw-checklist";
const beacon = (ev: string, locale: Locale) => {
  try { navigator.sendBeacon?.("/api/events.php", `${ev}|${locale}`); } catch {}
  try { const w = window as any; if (w.dataLayer) w.dataLayer.push({ event: ev, form_lang: locale }); } catch {}
};
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export default function ChecklistClient({ locale, home }: { locale: Locale; home: any }) {
  const t = CHECKLIST[locale];
  const ui = UI[locale];
  const items = useMemo(() => t.groups.flatMap((g, gi) => g.items.map((it) => ({ ...it, g: gi }))).map((it, i) => ({ ...it, n: i + 1, id: `c${i + 1}` })), [t]);
  const T = items.length;
  const [ans, setAns] = useState<Record<string, Ans>>({});
  const [open, setOpen] = useState<string>("c1");
  const [url, setUrl] = useState("");

  useEffect(() => { document.documentElement.lang = localeOf(locale).htmlLang; }, [locale]);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (s && typeof s === "object") { setAns(s); const first = items.find((it) => !s[it.id]); setOpen(first ? first.id : ""); }
    } catch {}
    try { if (!sessionStorage.getItem(KEY + "-o")) { sessionStorage.setItem(KEY + "-o", "1"); beacon("cl_open", locale); } } catch { beacon("cl_open", locale); }
  }, [items, locale]);

  const answer = (id: string, n: number, v: Ans) => {
    const next = { ...ans };
    if (next[id] === v) delete next[id]; else next[id] = v;
    setAns(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    if (Object.keys(next).length === T && Object.keys(ans).length < T) beacon("cl_done", locale);
    if (!next[id]) return;
    /* відкрити наступний пункт без відповіді */
    setTimeout(() => {
      const nx = items.find((it) => it.n > n && !next[it.id]);
      setOpen(nx ? nx.id : "");
      if (nx) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(() => document.getElementById(nx.id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 60);
      }
    }, 240);
  };
  const reset = () => {
    setAns({}); setOpen("c1");
    try { localStorage.removeItem(KEY); } catch {}
    window.scrollTo({ top: 0 });
  };

  const vals = Object.values(ans);
  const ok = vals.filter((v) => v === "yes").length, bad = vals.filter((v) => v === "no").length, na = vals.filter((v) => v === "na").length;
  const done = ok + bad + na;
  const fails = items.filter((it) => ans[it.id] === "no");
  const vars = { d: done, n: T, b: bad, b2: t.points(bad), u: t.points(na), l: t.points(T - done) };

  const barTitle = !done ? t.bar.start : done < T ? fill(t.bar.progress, vars) : bad ? fill(t.bar.doneBad, vars) : t.bar.doneOk;
  const barSub = !done ? t.bar.time : done < T ? (bad ? fill(t.bar.problems, vars) : t.bar.allGood) : t.bar.summaryBelow;
  let rTitle = t.result.empty, rText = t.result.emptyText;
  if (done && bad) { rTitle = fill(t.result.notReady, vars); rText = t.result.notReadyText + (na ? " " + fill(t.result.unknownText, vars) : ""); }
  else if (done && done < T) { rTitle = t.result.soFar; rText = fill(t.result.left, vars); }
  else if (done === T) { rTitle = na ? fill(t.result.doneUnknown, vars) : t.result.doneOk; rText = t.result.doneText; }

  const host = url.trim().replace(/^[a-z]+:\/\//i, "").split(/[/?#\s]/)[0];
  const goHref = auditPath(locale) + (host ? `?url=${encodeURIComponent(host)}` : "");

  return (
    <div className={`locale locale-${locale}`}>
      <Header home={false} locale={locale} page="checklist" />
      <main className="page au ck">
        <div className="page__head au-head">
          <span className="au-eyebrow">{t.hero.eyebrow}</span>
          <h1 className="page__title"><em>{t.hero.titleAccent}</em> {t.hero.titleRest}</h1>
          <p className="page__lead">{t.hero.lead}</p>
        </div>

        <div className="ck-col">
          <div className="ck-bar">
            <div className="ck-bar-in">
              <div className="ck-ring" style={{ ["--p" as any]: Math.round((done / T) * 100) }}><i>{done}/{T}</i></div>
              <div className="ck-bar-t"><b>{barTitle}</b><span>{barSub}</span></div>
              <div className="ck-counts">
                <span className="ck-cnt ok">{ok} {t.bar.yes}</span>
                <span className="ck-cnt bad">{bad} {t.bar.no}</span>
                <span className="ck-cnt na">{na} {t.bar.na}</span>
              </div>
            </div>
          </div>

          {t.groups.map((g, gi) => {
            const gItems = items.filter((it) => it.g === gi);
            return (
              <section className="ck-group" key={gi}>
                <div className="ck-g-head"><h2>{g.title}</h2><span>{gItems.filter((it) => ans[it.id]).length} {t.item.of} {gItems.length}</span></div>
                <div className="ck-list">
                  {gItems.map((it) => {
                    const isOpen = open === it.id;
                    return (
                      <article className={`ck-item${isOpen ? " open" : ""}`} id={it.id} key={it.id} data-s={ans[it.id] || undefined}>
                        <button className="ck-q" type="button" aria-expanded={isOpen} aria-controls={`${it.id}b`} onClick={() => setOpen(isOpen ? "" : it.id)}>
                          <span className="ck-num">{it.n}</span>
                          <span className="ck-q-t"><b>{it.t}</b><span>{it.s}</span></span>
                          <svg className="ck-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                        <div className="ck-body" id={`${it.id}b`}>
                          <div>
                            <div className="ck-inner">
                              <p className="ck-why" dangerouslySetInnerHTML={{ __html: it.why }} />
                              <div className="ck-lbl">{t.item.how}</div>
                              <ol className="ck-how">{it.how.map((h, i) => <li key={i}><span dangerouslySetInnerHTML={{ __html: h }} /></li>)}</ol>
                              <div className="ck-lbl">{t.item.example}</div>
                              <div className="ck-ex">
                                <div className="good"><span className="ck-tag">{t.item.good}</span><div className="ck-shot" dangerouslySetInnerHTML={{ __html: it.good }} /></div>
                                <div className="bad"><span className="ck-tag">{t.item.bad}</span><div className="ck-shot" dangerouslySetInnerHTML={{ __html: it.bad }} /></div>
                              </div>
                              <div className="ck-lbl">{t.item.ask}</div>
                              <div className="ck-ans">
                                {(["yes", "no", "na"] as Ans[]).map((v) => (
                                  <button key={v} type="button" data-v={v} aria-pressed={ans[it.id] === v} onClick={() => answer(it.id, it.n, v)}>{t.item[v]}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section className="ck-result" aria-live="polite">
            <h2>{rTitle}</h2>
            <p>{rText}</p>
            {fails.length > 0 && (
              <ul className="ck-fix">{fails.map((it) => <li key={it.id}><span>{it.n}</span>{it.t}</li>)}</ul>
            )}
            <div className="ck-deep">
              <span className="ck-lbl">{t.result.deepLabel}</span>
              <p>{t.result.deepText}</p>
              <form className="ck-go" onSubmit={(e) => { e.preventDefault(); beacon("cl_go", locale); location.href = goHref; }}>
                <input id="ck-url" name="url" type="text" inputMode="url" autoComplete="url" autoCapitalize="off" spellCheck={false}
                  placeholder={t.result.placeholder} aria-label={t.result.placeholder} value={url} onChange={(e) => setUrl(e.currentTarget.value)} />
                <button className="au-btn" type="submit">{t.result.go} <ArrowUpRight /></button>
              </form>
            </div>
            {done > 0 && <button className="ck-reset" type="button" onClick={reset}>{t.result.reset}</button>}
          </section>
        </div>
      </main>
      <Footer footer={home?.footer} t={ui} />
      <QuoteModal form={home?.quoteForm} t={ui} locale={locale} />
      <ChatAgent locale={locale} />
      <Behaviors page="inner" />
    </div>
  );
}
