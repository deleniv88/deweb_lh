"use client";

import { Fragment, useEffect, type ReactNode } from "react";
import Header from "./Header";
import Behaviors from "./Behaviors";
import Footer from "./Footer";
import QuoteModal from "./QuoteModal";
import ChatAgent from "./ChatAgent";
import { UI, localeOf, type Locale } from "../lib/i18n";
import { LEGAL, LEGAL_UI, LEGAL_UPDATED, OWNER, type LegalBlock } from "../lib/legalText";

/* Юридична сторінка (Політика приватності / Регламент): заголовок, зміст і розділи з lib/legalText.ts.
   Розмітка в тексті: [текст](адреса), **жирний**, {name} {email} {address} {nip} — з OWNER. */
export default function LegalClient({ kind, locale, home }: { kind: "privacy" | "terms"; locale: Locale; home: any }) {
  const d = LEGAL[locale][kind];
  const lu = LEGAL_UI[locale];
  const ui = UI[locale];

  useEffect(() => { document.documentElement.lang = localeOf(locale).htmlLang; }, [locale]);

  /* плейсхолдери і посилання/жирний у рядку → React-вузли */
  const inline = (s: string): ReactNode[] => {
    const out: ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\{(name|email|address|nip)\}/g;
    let last = 0, m: RegExpExecArray | null, k = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      if (m[1] !== undefined) {
        const href = m[2].replace(/\{email\}/g, OWNER.email);
        const ext = /^https?:/.test(href);
        out.push(<a key={k++} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined}>{inline(m[1])}</a>);
      } else if (m[3] !== undefined) out.push(<strong key={k++}>{inline(m[3])}</strong>);
      else {
        const v = OWNER[m[4] as keyof typeof OWNER];
        out.push(v ? v : <mark key={k++} className="lg__todo">[{m[4] === "nip" ? "NIP" : lu.missing}]</mark>);
      }
      last = re.lastIndex;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  };

  const block = (b: LegalBlock, i: number) => {
    if (typeof b === "string") return <p key={i}>{inline(b)}</p>;
    if (Array.isArray(b)) return <ul key={i}>{b.map((li, j) => <li key={j}>{inline(li)}</li>)}</ul>;
    return (
      <div key={i} className="lg__table" role="region" aria-label={b.head.join(", ")} tabIndex={0}>
        <table>
          <thead><tr>{b.head.map((h, j) => <th key={j} scope="col">{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, n) => (n === 0 ? <th key={n} scope="row"><code>{c}</code></th> : <td key={n} data-label={b.head[n]}>{c}</td>))}</tr>)}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`locale locale-${locale}`}>
      <Header home={false} locale={locale} page={kind} />
      <main className="page lg">
        <div className="page__head">
          <span className="au-eyebrow">{d.eyebrow}</span>
          <h1 className="page__title">{d.title}</h1>
          <p className="page__lead">{d.lead}</p>
          <p className="lg__date">{lu.updated}: {LEGAL_UPDATED[locale]}</p>
        </div>
        <article className="post prose lg__body">
          <nav className="lg__toc" aria-label={lu.contents}>
            <ol>{d.sections.map((s, i) => <li key={i}><a href={`#s${i + 1}`}>{s.h.replace(/^(§?\d+\.)\s*/, "")}</a></li>)}</ol>
          </nav>
          {d.sections.map((s, i) => (
            <Fragment key={i}>
              <h2 id={`s${i + 1}`}>{s.h}</h2>
              {s.body.map(block)}
            </Fragment>
          ))}
        </article>
      </main>
      <Footer footer={home?.footer} t={ui} />
      <QuoteModal form={home?.quoteForm} t={ui} locale={locale} />
      <ChatAgent locale={locale} />
      <Behaviors page="inner" />
    </div>
  );
}
