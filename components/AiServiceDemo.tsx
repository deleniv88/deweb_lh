"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/i18n";

/* =========================================================
   Анімований макет для картки послуги «AI-асистент» (Services).
   Зверстано кодом замість картинки: текст чіткий на будь-якому екрані.
   Макет у пікселях 1496×842 всередині .aid__in, масштабується під ширину блоку
   (як .fp у FeaturePreviews). Сценарій іде кроками по колу, поки блок на екрані.
   З prefers-reduced-motion видно фінальний кадр.
   ========================================================= */

type Copy = {
  site: string; asst: string; online: string; hi: string; q: string; a: string; slots: [string, string];
  ok: string; input: string; tg: string; tgText: string; report: string; visits: string; leads: string;
};

const COPY: Record<Locale, Copy> = {
  pl: {
    site: "Twoja strona", asst: "Asystent AI", online: "odpowiada od razu",
    hi: "Cześć! Jestem asystentem firmy. W czym mogę pomóc?",
    q: "Ile kosztuje wizyta i kiedy macie wolny termin?",
    a: "Konsultacja kosztuje 150 zł. Najbliższy wolny termin: czwartek 10:00 lub 14:30.",
    slots: ["Czw 10:00", "Czw 14:30"],
    ok: "Gotowe! Zaproszenie z linkiem Google Meet jest już na Twoim e-mailu.",
    input: "Napisz pytanie…", tg: "Nowa rezerwacja", tgText: "Anna K. · czwartek 10:00 · Google Meet",
    report: "Raport tygodniowy", visits: "Odwiedziny", leads: "Zapytania",
  },
  en: {
    site: "Your website", asst: "AI assistant", online: "replies instantly",
    hi: "Hi! I am the company assistant. How can I help?",
    q: "How much is a visit and when are you free?",
    a: "A consultation is 40 €. Next free slots: Thursday 10:00 or 14:30.",
    slots: ["Thu 10:00", "Thu 14:30"],
    ok: "Done! Your Google Meet invite is already in your inbox.",
    input: "Type a question…", tg: "New booking", tgText: "Anna K. · Thursday 10:00 · Google Meet",
    report: "Weekly report", visits: "Visits", leads: "Requests",
  },
  ua: {
    site: "Ваш сайт", asst: "AI-асистент", online: "відповідає одразу",
    hi: "Вітаю! Я асистент компанії. Чим можу допомогти?",
    q: "Скільки коштує візит і коли є вільний час?",
    a: "Консультація коштує 40 €. Найближчі вільні вікна: четвер 10:00 або 14:30.",
    slots: ["Чт 10:00", "Чт 14:30"],
    ok: "Готово! Запрошення з посиланням Google Meet вже на вашій пошті.",
    input: "Напишіть питання…", tg: "Новий запис", tgText: "Анна К. · четвер 10:00 · Google Meet",
    report: "Тижневий звіт", visits: "Відвідування", leads: "Заявки",
  },
};

/* кроки сценарію: [крок, мс від початку циклу] */
const STEPS = [600, 1500, 2300, 3700, 4400, 5600, 6200, 7400, 8100, 8900];
const LOOP = 13000; // повний цикл, після нього все згасає і починається знову
const FINAL = STEPS.length;

/* чат: 1 привітання, 2 питання, 3 друкує, 4 відповідь, 5 слоти, 6 вибір слота,
   7 друкує, 8 підтвердження, 9 сповіщення Telegram, 10 звіт оновлюється */
export default function AiServiceDemo({ locale, label }: { locale: Locale; label?: string | null }) {
  const c = COPY[locale] || COPY.en;
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(FINAL);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: number[] = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const run = () => {
      clear();
      setOut(false);
      setStep(0);
      STEPS.forEach((ms, i) => timers.push(window.setTimeout(() => setStep(i + 1), ms)));
      timers.push(window.setTimeout(() => setOut(true), LOOP - 700));
      timers.push(window.setTimeout(run, LOOP));
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) run();
      else { clear(); setOut(false); setStep(FINAL); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); clear(); };
  }, []);

  const on = (n: number) => (step >= n ? " is-on" : "");
  const typing = step === 3 || step === 7;

  return (
    <div className={`aid${out ? " is-out" : ""}`} ref={ref} role="img" aria-label={label || ""}>
      <div className="aid__in" aria-hidden="true">
        <div className="aid-site">
          <div className="aid-site__bar"><span className="aid-site__logo">{c.site}</span><i /><i /><i /></div>
          <span className="aid-site__ln" style={{ width: 520, height: 46, marginTop: 120 }} />
          <span className="aid-site__ln" style={{ width: 420, height: 46 }} />
          <span className="aid-site__ln" style={{ width: 380, marginTop: 30 }} />
          <span className="aid-site__ln" style={{ width: 300 }} />
          <span className="aid-site__btn" />
        </div>

        <div className={"aid-st" + on(10)}>
          <b>{c.report}</b>
          <div className="aid-st__row">
            <div>{c.visits}<em>2 418</em><span>▲ 18%</span></div>
            <div>{c.leads}<em>{step >= 10 ? 37 : 36}</em><span>▲ 32%</span></div>
          </div>
          <svg viewBox="0 0 292 60" preserveAspectRatio="none">
            <defs><linearGradient id="aid-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8791ff" stopOpacity=".35" /><stop offset="1" stopColor="#8791ff" stopOpacity="0" /></linearGradient></defs>
            <path className="aid-st__area" d="M0 48 L40 42 L80 46 L120 30 L160 34 L200 20 L240 22 L292 6 L292 60 L0 60Z" fill="url(#aid-g)" />
            <path className="aid-st__line" pathLength={1} d="M0 48 L40 42 L80 46 L120 30 L160 34 L200 20 L240 22 L292 6" />
          </svg>
        </div>

        <div className={"aid-tg" + on(9)}>
          <span className="aid-tg__ic"><svg width="26" height="26" viewBox="0 0 24 24"><path fill="#fff" d="M21.5 3.6 2.9 10.8c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5ZM9.3 13.4l8.7-5.5c.4-.3.8-.1.5.2l-7.2 6.5-.3 3.3-1.7-4.5Z" /></svg></span>
          <span><b>{c.tg}</b><small>{c.tgText}</small></span>
        </div>

        <div className="aid-chat">
          <div className="aid-chat__head">
            <span className="aid-orb" />
            <span><b>{c.asst}</b><small><i />{c.online}</small></span>
          </div>
          <div className="aid-chat__msgs">
            <p className={"aid-b" + on(1)}>{c.hi}</p>
            <p className={"aid-b aid-b--u" + on(2)}>{c.q}</p>
            <p className={"aid-b" + on(4)}>{c.a}</p>
            <div className={"aid-slots" + on(5)}>
              <span className={step >= 6 ? "is-picked" : ""}>{c.slots[0]}</span>
              <span>{c.slots[1]}</span>
            </div>
            <p className={"aid-b" + on(8)}>{c.ok}</p>
            <p className={"aid-dots" + (typing ? " is-on" : "")}><i /><i /><i /></p>
          </div>
          <div className="aid-chat__in">{c.input}<i /></div>
        </div>
      </div>
    </div>
  );
}
