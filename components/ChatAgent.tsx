"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "./Icons";
import { UI, type Locale } from "../lib/i18n";

/* AI-чат: сфера справа внизу → вікно розмови.
   Відповіді дає api/chat.php (Claude Haiku + база знань сайту + бронювання дзвінка).
   Розмова зберігається в sessionStorage, тож не губиться при переході між сторінками. */
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const STORE = "dw_chat";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; form?: boolean; code?: string };

declare global {
  interface Window { turnstile?: any }
}

/* **жирний**, посилання і списки "- " — без innerHTML */
function Text({ text }: { text: string }) {
  const inline = (s: string, key: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\/(?:en\/|ua\/)?(?:works|realizacje)\/)/g).map((part, i) => {
      if (!part) return null;
      if (part.startsWith("**")) return <b key={key + i}>{part.slice(2, -2)}</b>;
      if (/^(https?:\/\/|\/)/.test(part)) {
        const ext = part.startsWith("http");
        return <a key={key + i} href={part} {...(ext ? { target: "_blank", rel: "noopener" } : {})}>{ext ? part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : part}</a>;
      }
      return part;
    });
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-•]\s/.test(l)))
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s/, ""), `${i}-${j}-`)}</li>)}</ul>;
        return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l, `${i}-${j}-`)}</span>)}</p>;
      })}
    </>
  );
}

export default function ChatAgent({ locale = "pl" }: { locale?: Locale }) {
  const t = UI[locale].chat;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useRef("");
  const tsToken = useRef("");
  const tsBox = useRef<HTMLDivElement>(null);
  const tsId = useRef<any>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  /* відновлення розмови після переходу на іншу сторінку */
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE) || "null");
      if (s?.msgs) { setMsgs(s.msgs); session.current = s.session || ""; }
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ msgs, session: session.current })); } catch {}
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  /* Esc закриває; сфера ховається, коли відкрита форма заявки */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    if (window.matchMedia("(min-width: 768px)").matches) setTimeout(() => field.current?.focus(), 250);
    document.documentElement.classList.add("chat-open");
    return () => { document.removeEventListener("keydown", onKey); document.documentElement.classList.remove("chat-open"); };
  }, [open]);

  /* Turnstile: невидима перевірка на початку розмови (скрипт підвантажує QuoteModal) */
  useEffect(() => {
    if (!open || !TURNSTILE_KEY || session.current || tsId.current !== null) return;
    let tries = 0;
    const timer = setInterval(() => {
      if (window.turnstile && tsBox.current) {
        clearInterval(timer);
        tsId.current = window.turnstile.render(tsBox.current, {
          sitekey: TURNSTILE_KEY, appearance: "interaction-only", theme: "light",
          callback: (tok: string) => { tsToken.current = tok; },
          "expired-callback": () => { tsToken.current = ""; },
        });
      } else if (++tries > 40) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [open]);

  const waitToken = async () => {
    if (!TURNSTILE_KEY || session.current) return "";
    for (let i = 0; i < 40 && !tsToken.current; i++) await new Promise((r) => setTimeout(r, 250));
    return tsToken.current;
  };

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...msgs.filter((m) => !m.error), { role: "user" as const, content: q }];
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    let res: any = null;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await fetch("/api/chat.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            lang: locale,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            session: session.current,
            turnstile: await waitToken(),
          }),
        });
        res = await r.json().catch(() => ({ ok: false, error: r.status === 429 ? "rate" : "api" }));
        if (res?.session) session.current = res.session;
        /* токен Turnstile одноразовий: якщо не пройшов — беремо новий і пробуємо ще раз */
        if (res?.error === "captcha" && window.turnstile && tsId.current !== null && attempt === 0) {
          tsToken.current = ""; window.turnstile.reset(tsId.current); continue;
        }
        break;
      }
    } catch { res = { ok: false, error: "api" }; }
    setBusy(false);
    if (res?.ok) setMsgs((m) => [...m, { role: "assistant", content: res.reply }]);
    else {
      const e = res?.error;
      const off = e === "budget" || e === "not_configured" || e === "too_long";
      const text = off ? t.errOff : e === "rate" ? t.errRate : e === "busy" ? t.errBusy : t.errGeneric;
      /* код помилки дрібним шрифтом — щоб було зрозуміло, що саме сталося */
      setMsgs((m) => [...m, { role: "assistant", content: text, error: true, form: !["rate", "busy"].includes(e), code: e || "unknown" }]);
    }
  }

  const restart = () => { setMsgs([]); session.current = ""; tsToken.current = ""; if (tsId.current !== null) window.turnstile?.reset(tsId.current); };

  return (
    <>
      <button className={`ai-orb${open ? " is-open" : ""}`} type="button" aria-label={t.open} aria-expanded={open} aria-controls="ai-chat" onClick={() => setOpen((o) => !o)}>
        <span className="ai-orb__core" aria-hidden="true"><i></i><i></i><i></i></span>
        <span className="ai-orb__x" aria-hidden="true"><CloseIcon /></span>
      </button>

      <div className={`ai-chat${open ? " is-open" : ""}`} id="ai-chat" role="dialog" aria-label={t.title} aria-hidden={!open} data-lenis-prevent>
        <div className="ai-chat__head">
          <span className="ai-orb__core ai-chat__ava" aria-hidden="true"><i></i><i></i><i></i></span>
          <div className="ai-chat__who">
            <b>{t.title}</b>
            <span>{t.status}</span>
          </div>
          {msgs.length > 0 && (
            <button className="ai-chat__x" type="button" aria-label={t.restart} title={t.restart} onClick={restart}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
          <button className="ai-chat__x" type="button" aria-label={UI[locale].close} onClick={() => setOpen(false)}><CloseIcon /></button>
        </div>

        <div className="ai-chat__list" ref={list} aria-live="polite">
          <div className="ai-msg ai-msg--bot"><Text text={t.hello} /></div>
          {msgs.length === 0 && (
            <div className="ai-chat__chips">
              {t.chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`ai-msg ai-msg--${m.role === "user" ? "me" : "bot"}${m.error ? " ai-msg--err" : ""}`}>
              <Text text={m.content} />
              {m.code && <small className="ai-msg__code">{m.code}</small>}
              {m.form && <button className="ai-msg__form" type="button" data-open-quote onClick={() => setOpen(false)}>{t.openForm}</button>}
            </div>
          ))}
          {busy && <div className="ai-msg ai-msg--bot ai-msg--typing" aria-label="…"><i></i><i></i><i></i></div>}
        </div>

        <form className="ai-chat__form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <textarea
            ref={field}
            rows={1}
            value={input}
            maxLength={1500}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
          />
          <button type="submit" aria-label={t.send} disabled={busy || !input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
        <p className="ai-chat__note">{t.note}</p>
        <div className="ai-chat__ts" ref={tsBox}></div>
      </div>
    </>
  );
}
