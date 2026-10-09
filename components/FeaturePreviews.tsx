import { Fragment } from "react";
import type React from "react";
import type { Locale } from "../lib/i18n";

/* =========================================================
   Анімовані прев'ю для "Every site includes" (Figma 393:253, 393:545, 393:1092).
   Зверстано кодом, а не картинкою, щоб частини можна було анімувати.
   Макет малюється в пікселях Figma (1024×512 / 1042×521) і масштабується
   під ширину блоку через CSS (див. .fp у globals.css).
   Анімацію запускає lib/behaviors.js → initFeatures: клас .is-play, коли пункт стає активним.
   Без .is-play (або з prefers-reduced-motion) видно фінальний кадр.
   ========================================================= */

type Copy = {
  lead: string; sent: string; name: string; phone: string; message: string; person: string; msg: string;
  mail: string; crmCol: string; status: string; cols: string[]; source: string; tg: string;
  dash: string; users: string; clicks: string; engage: string; visitors: string; days: string[]; sources: string;
  src: string[]; keyMetrics: string; channels: string; legend: string[]; topQueries: string; qHead: string[];
  queries: string[]; avgPos: string; welcome: string; recording: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    lead: "New lead", sent: "Sent", name: "Name:", phone: "Phone:", message: "Message:", person: "Anna K.", msg: "Need a website for my clinic",
    mail: "New request from website", crmCol: "New leads", status: "Status", cols: ["date", "name", "phone", "source"], source: "website",
    tg: "New lead: Anna K., +48 600...",
    dash: "All-in-one Dashboard", users: "Users:", clicks: "Clicks:", engage: "Avg. engagement:", visitors: "Visitors",
    days: ["Sep 1", "Sep 15", "Sep 30"], sources: "Traffic sources",
    src: ["Google Search", "Direct", "Instagram", "Facebook", "Google Maps", "Other"],
    keyMetrics: "Key metrics", channels: "Traffic Channels", legend: ["Search", "Facebook", "Direct", "Other"],
    topQueries: "Top queries", qHead: ["Query", "Clicks", "Position"], queries: ["web design", "landing page", "deweb"],
    avgPos: "Avg. position: 6.2", welcome: "Welcome to your website", recording: "Session recording",
  },
  pl: {
    lead: "Zapytanie", sent: "Wysłano", name: "Imię:", phone: "Telefon:", message: "Treść:", person: "Anna K.", msg: "Potrzebuję strony dla mojej kliniki",
    mail: "Nowe zapytanie ze strony", crmCol: "Nowe zapytania", status: "Status", cols: ["data", "imię", "telefon", "źródło"], source: "strona",
    tg: "Zapytanie: Anna K., +48 600...",
    dash: "Wszystko w jednym panelu", users: "Użytkownicy:", clicks: "Kliknięcia:", engage: "Zaangażowanie:", visitors: "Odwiedzający",
    days: ["1 wrz", "15 wrz", "30 wrz"], sources: "Źródła ruchu",
    src: ["Google Search", "Bezpośrednie", "Instagram", "Facebook", "Google Maps", "Inne"],
    keyMetrics: "Kluczowe metryki", channels: "Kanały ruchu", legend: ["Wyszukiwarka", "Facebook", "Bezpośrednie", "Inne"],
    topQueries: "Top zapytania", qHead: ["Zapytanie", "Klik.", "Pozycja"], queries: ["strona www", "sklep www", "deweb"],
    avgPos: "Śr. pozycja: 6.2", welcome: "Witamy na stronie", recording: "Nagrania sesji",
  },
  ua: {
    lead: "Нова заявка", sent: "Надіслано", name: "Ім'я:", phone: "Телефон:", message: "Запит:", person: "Анна К.", msg: "Потрібен сайт для моєї клініки",
    mail: "Нова заявка з сайту", crmCol: "Нові заявки", status: "Статус", cols: ["дата", "ім'я", "телефон", "джерело"], source: "сайт",
    tg: "Заявка: Анна К., +48 600...",
    dash: "Уся аналітика в одній панелі", users: "Користувачі:", clicks: "Кліки:", engage: "Залученість:", visitors: "Відвідувачі",
    days: ["1 вер", "15 вер", "30 вер"], sources: "Джерела трафіку",
    src: ["Google Search", "Прямі заходи", "Instagram", "Facebook", "Google Maps", "Інше"],
    keyMetrics: "Ключові метрики", channels: "Канали трафіку", legend: ["Пошук", "Facebook", "Прямі", "Інше"],
    topQueries: "Топ запити", qHead: ["Запит", "Кліки", "Позиція"], queries: ["сайт ціна", "лендинг", "deweb"],
    avgPos: "Сер. позиція: 6.2", welcome: "Вітаємо на сайті", recording: "Запис сесій",
  },
};

/* плавна крива через точки (Catmull-Rom → кубічні Безьє) */
function smooth(p: number[][]) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c[0]},${c[1]}`;
  }
  return d;
}
/* S-подібна лінія між картками: горизонтально виходить і горизонтально входить */
const link = (x1: number, y1: number, x2: number, y2: number) => {
  const m = (x1 + x2) / 2;
  return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
};
const st = (o: Record<string, string | number>) => o as React.CSSProperties;

/* ---------- Лого (спрощені, щоб не тягнути зовнішні файли) ---------- */
const Gmail = () => (
  <svg viewBox="0 0 24 18" aria-hidden="true"><path fill="#4285F4" d="M1.6 18h3.8V8.7L0 4.6v11.8C0 17.3.7 18 1.6 18z" /><path fill="#34A853" d="M18.5 18h3.8c.9 0 1.6-.7 1.6-1.6V4.6l-5.4 4.1z" /><path fill="#FBBC04" d="M18.5 1.6v7.1l5.4-4.1V2.5c0-2-2.3-3.1-3.9-1.9z" /><path fill="#EA4335" d="M5.5 8.7V1.6L12 6.5l6.5-4.9v7.1L12 13.6z" /><path fill="#C5221F" d="M0 2.5v2.1l5.5 4.1V1.6L4 .6C2.3-.6 0 .5 0 2.5z" /></svg>
);
const Sheets = () => (
  <svg viewBox="0 0 15.6 20.8" aria-hidden="true"><path d="M10 0H1.5C.7 0 0 .7 0 1.5v17.8c0 .8.7 1.5 1.5 1.5h12.6c.8 0 1.5-.7 1.5-1.5V5.6z" fill="#0F9D58" /><path d="M10 0v4.1c0 .8.7 1.5 1.5 1.5h4.1z" fill="#87CEAC" /><path d="M3.6 9.6v6.8h8.4V9.6zm1 1h2.7v1.8H4.6zm3.7 0H11v1.8H8.3zm-3.7 2.8h2.7v2H4.6zm3.7 0H11v2H8.3z" fill="#fff" /></svg>
);
const Telegram = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#2AABEE" /><path fill="#fff" d="M5.4 11.8l11.6-4.5c.5-.2 1 .1.8.9l-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5c.2-.2 0-.3-.4-.1l-6.9 4.3-3-.9c-.6-.2-.7-.6.2-.9z" /></svg>
);
const GA = () => (
  <svg viewBox="0 0 29.7 31.7" aria-hidden="true"><rect x="20.7" width="9" height="31.7" rx="4.5" fill="#F9AB00" /><rect x="10.35" y="11" width="9" height="20.7" rx="4.5" fill="#E37400" /><circle cx="4.5" cy="27.2" r="4.5" fill="#E37400" /></svg>
);
const GSC = () => (
  <svg viewBox="0 0 41 33" aria-hidden="true"><rect x="3" y="20" width="5" height="11" rx="1" fill="#4285F4" /><rect x="10" y="12" width="5" height="19" rx="1" fill="#EA4335" /><rect x="17" y="5" width="5" height="26" rx="1" fill="#FBBC04" /><circle cx="25" cy="16" r="9" fill="rgba(255,255,255,.55)" stroke="#4285F4" strokeWidth="3" /><path d="M31.5 22.5 38 29" stroke="#34A853" strokeWidth="4" strokeLinecap="round" /></svg>
);
const Clarity = () => (
  <svg viewBox="0 0 41 41" aria-hidden="true"><path d="M20.5 2 36 31l-15.5 8z" fill="#1E5FCC" /><path d="M20.5 2 5 31l15.5 8z" fill="#4A8CF7" /><path d="M20.5 2v37" stroke="#9cc0ff" strokeWidth=".8" /></svg>
);
const I = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Ico = {
  inbox: <svg viewBox="0 0 24 24" {...I}><path d="M3 13l2.5-7h13L21 13v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></svg>,
  menu: <svg viewBox="0 0 12 12" {...I}><path d="M2 3h8M2 6h8M2 9h8" /></svg>,
  board: <svg viewBox="0 0 12 12" {...I}><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" /><path d="M1.5 4.5h9M5 4.5v6" /></svg>,
  users: <svg viewBox="0 0 12 12" {...I}><circle cx="4.5" cy="4" r="1.8" /><path d="M1.5 10c.3-1.7 1.5-2.6 3-2.6s2.7.9 3 2.6M8 2.4a1.6 1.6 0 0 1 0 3.1M9.2 7.6c.8.3 1.2 1.1 1.4 2.2" /></svg>,
  cal: <svg viewBox="0 0 12 12" {...I}><rect x="1.5" y="2.5" width="9" height="8" rx="1.5" /><path d="M1.5 5h9M4 1.5v2M8 1.5v2" /></svg>,
  trend: <svg viewBox="0 0 12 7" {...I} strokeWidth={1.2}><path d="M1 6l3.5-3.5 2 2L11 1M8 1h3v3" stroke="#1e9e4a" /></svg>,
  clock: <svg viewBox="0 0 14 14" {...I} strokeWidth={1.1}><circle cx="7" cy="7" r="5.8" /><path d="M7 3.8V7l2.2 1.4" /></svg>,
  play: <svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.2" fill="none" stroke="#1a1b25" strokeWidth="1" /><path d="M4.8 3.9v4.2L8.2 6z" fill="#1a1b25" /></svg>,
  cursor: <svg viewBox="0 0 16 20" aria-hidden="true"><path d="M1.5 1.5v15l4-3.8 2.6 6 2.6-1.1-2.6-5.8h5.6z" fill="#1a1b25" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  lock: <svg viewBox="0 0 6 7" aria-hidden="true"><rect x=".5" y="3" width="5" height="3.7" rx=".8" fill="#6b6e80" /><path d="M1.6 3V2.1a1.4 1.4 0 0 1 2.8 0V3" fill="none" stroke="#6b6e80" strokeWidth=".8" /></svg>,
  chev: <svg viewBox="0 0 6 4" aria-hidden="true"><path d="M.8.8 3 3 5.2.8" fill="none" stroke="#1a1b25" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

/* =============== No lost requests =============== */
function Leads({ c }: { c: Copy }) {
  /* виходи з картки заявки → входи в картки-отримувачі (координати групи з Figma) */
  const lines = [link(270, 128, 504, 19), link(270, 144, 504, 99), link(270, 162, 504, 204), link(270, 179, 504, 290)];
  const ends = [[504, 19], [504, 99], [504, 204], [504, 290]];
  const mids = [[387, 73.5], [387, 121.5], [387, 183], [387, 234.5]];
  return (
    <div className="fp fp--lead">
      <div className="fp__in">
        <div className="fp__g">
          <div className="fpl-card">
            <div className="fpl-card__head">
              <span className="fpl-card__ico">{Ico.inbox}</span>
              <span className="fpl-card__title">{c.lead}</span>
              <span className="fpl-card__badge"><span>{c.sent}</span></span>
            </div>
            <div className="fpl-row"><span>{c.name}</span><b className="fp-type" style={st({ "--d": ".35s", "--n": 7 })}>{c.person}</b></div>
            <div className="fpl-row"><span>{c.phone}</span><b className="fp-type" style={st({ "--d": ".7s", "--n": 10 })}>+48 600 ...</b></div>
            <div className="fpl-row"><span>{c.message}</span><b className="fp-type fp-type--2" style={st({ "--d": "1.05s", "--n": 14 })}>{c.msg}</b></div>
          </div>

          <svg className="fp__wires" viewBox="0 0 757.5 317.3" aria-hidden="true">
            {lines.map((d, i) => <path key={i} className="fp-wire" d={d} pathLength={1} style={st({ "--i": i })} />)}
            {lines.map((d, i) => <path key={"p" + i} className="fp-pulse" d={d} pathLength={1} style={st({ "--i": i })} />)}
            {mids.map(([x, y], i) => <circle key={"m" + i} className="fp-node" cx={x} cy={y} r={3.4} style={st({ "--i": i, "--at": ".45s" })} />)}
            {ends.map(([x, y], i) => <circle key={"e" + i} className="fp-node" cx={x} cy={y} r={3} style={st({ "--i": i, "--at": ".9s" })} />)}
          </svg>

          <div className="fpl-dest fpl-mail" style={st({ "--i": 0 })}>
            <span className="fpl-mail__logo"><Gmail /></span>
            <span className="fpl-mail__subj">{c.mail}</span>
            <span className="fpl-mail__time">09:41</span>
            <span className="fpl-mail__dot" />
          </div>

          <div className="fpl-dest fpl-crm" style={st({ "--i": 1 })}>
            <div className="fpl-crm__side">
              <i style={st({ top: 9.9 })}>{Ico.menu}</i>
              <span className="fpl-crm__act" />
              <i style={st({ top: 37.5, color: "#5e6cff" })}>{Ico.board}</i>
              <i style={st({ top: 57.3 })}>{Ico.users}</i>
              <i style={st({ top: 75.5 })}>{Ico.cal}</i>
            </div>
            <span className="fpl-crm__title">CRM</span>
            <span className="fpl-crm__div" />
            <div className="fpl-crm__col">
              <span className="fpl-crm__h">{c.crmCol}</span><span className="fpl-crm__more">•••</span>
              <div className="fpl-crm__item">
                <span>{c.person}</span><em>{c.status}</em><i />
              </div>
              <div className="fpl-crm__item2" />
            </div>
            <div className="fpl-crm__col2"><i /><span className="fpl-crm__more">•••</span></div>
            <div className="fpl-crm__col3" />
          </div>

          <div className="fpl-dest fpl-sheet" style={st({ "--i": 2 })}>
            <span className="fpl-sheet__logo"><Sheets /></span>
            <span className="fpl-sheet__title">Google Sheets</span>
            <div className="fpl-sheet__grid">
              <span className="fpl-sheet__hbg" /><span className="fpl-sheet__ahd" />
              <span className="fpl-sheet__rowbg" /><span className="fpl-sheet__rownum" />
              {[23.97, 78.67, 133.38, 188.61, 243.83].map((x) => <span key={x} className="fpl-sheet__v" style={st({ left: x })} />)}
              {[12.5, 23.97, 35.43, 46.89].map((y) => <span key={y} className="fpl-sheet__h" style={st({ top: y })} />)}
              {["A", "B", "C", "D"].map((l, k) => <span key={l} className={`fpl-sheet__c${k === 0 ? " is-w" : ""}`} style={st({ left: [49.2, 103.9, 158.6, 213.9][k], top: 2.6 })}>{l}</span>)}
              {["1", "2", "3", "4"].map((n, k) => <span key={n} className={`fpl-sheet__c${k === 1 ? " is-w" : ""}`} style={st({ left: 10.2, top: [14.6, 26, 37.5, 49][k] })}>{n}</span>)}
              {c.cols.map((h, k) => <span key={h} className="fpl-sheet__t is-h" style={st({ left: [26.6, 81.3, 136, 191.2][k], top: 13.6 })}>{h}</span>)}
              <span className="fpl-sheet__new">
                {["14.05.2026", c.person, "+48 600 ...", c.source].map((v, k) => <span key={k} className="fpl-sheet__t" style={st({ left: [26.6, 81.3, 136, 191.2][k], top: 25 })}>{v}</span>)}
                <span className="fpl-sheet__sel" /><span className="fpl-sheet__cell" /><span className="fpl-sheet__fill" />
              </span>
            </div>
          </div>

          <div className="fpl-dest fpl-tg" style={st({ "--i": 3 })}>
            <span className="fpl-tg__logo"><Telegram /></span>
            <span className="fpl-tg__typing" aria-hidden="true"><i /><i /><i /></span>
            <span className="fpl-tg__bubble">{c.tg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============== Clear analytics =============== */
const CHART = [[10.9, 76.7], [76.9, 52.7], [143.9, 60.7], [210.9, 54.7], [277.9, 35.7], [343.9, 61.7], [411.9, 33.7]];
function Analytics({ c }: { c: Copy }) {
  const line = smooth(CHART);
  const area = `${line} L411.9,102.4 L10.9,102.4 Z`;
  const wires = [link(458, 128, 516, 42), link(458, 153, 516, 148), link(458, 179, 516, 260)];
  const bars = [[98.3], [34.8], [21.5], [26.6], [15.4], [9.2]];
  /* частки донату: пошук, facebook, прямі, інше */
  const donut = [[45, "#4285F4"], [25, "#34A853"], [18, "#EA4335"], [12, "#FBBC04"]] as const;
  let acc = 0;
  return (
    <div className="fp fp--ana">
      <div className="fp__in">
        <div className="fp__g">
          <div className="fpa-dash">
            <span className="fpa-dash__title">{c.dash}</span>
            <div className="fpa-stat" style={st({ left: 13.31, "--i": 0 })}>
              <span className="fpa-stat__l">{c.users}</span>
              <span className="fpa-stat__v"><b data-count="2481" data-fmt="int">2,481</b><small>(+18%)</small></span>
              <span className="fpa-stat__trend">{Ico.trend}</span>
            </div>
            <div className="fpa-stat" style={st({ left: 156.16, "--i": 1 })}>
              <span className="fpa-stat__l">{c.clicks}</span>
              <span className="fpa-stat__v"><b data-count="932" data-fmt="int">932</b></span>
              <span className="fpa-stat__seo">SEO</span>
              <span className="fpa-stat__cur">{Ico.cursor}</span>
            </div>
            <div className="fpa-stat" style={st({ left: 299, "--i": 2 })}>
              <span className="fpa-stat__l">{c.engage}</span>
              <span className="fpa-stat__v"><b data-count="102" data-fmt="time">1m 42s</b></span>
              <span className="fpa-stat__clock">{Ico.clock}</span>
            </div>

            <div className="fpa-vis">
              <span className="fpa-vis__l">{c.visitors}</span>
              <svg className="fpa-chart" viewBox="0 0 420.4 102.4" aria-hidden="true">
                <defs>
                  <linearGradient id="fpaArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5e6cff" stopOpacity=".32" />
                    <stop offset="1" stopColor="#5e6cff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="fpa-chart__area" d={area} fill="url(#fpaArea)" />
                <path className="fpa-chart__line" d={line} pathLength={1} />
                {CHART.map(([x, y], i) => <circle key={i} className="fpa-chart__dot" cx={x} cy={y} r={2.6} style={st({ "--i": i })} />)}
              </svg>
              {c.days.map((d, k) => <span key={d} className="fpa-vis__d" style={st({ left: [7.9, 192, 376][k] })}>{d}</span>)}
              <span className="fpa-vis__div" />
              <span className="fpa-vis__src">{c.sources}</span>
              {c.src.map((s, k) => {
                const col = k < 3 ? 0 : 1, row = k % 3;
                const left = col ? 213.8 : 7.9, top = 148.7 + row * 11.5, tl = col ? 276 : 79;
                return (
                  <Fragment key={k}>
                    <span className="fpa-vis__s" style={st({ left, top })}>{s}</span>
                    <span className="fpa-bar" style={st({ left: tl, top: top + 4.1, width: col ? 134.9 : 126.6 })}>
                      <i style={st({ width: bars[k][0], "--i": k })} />
                    </span>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <svg className="fp__wires" viewBox="0 0 696.3 315.4" aria-hidden="true">
            {wires.map((d, i) => <path key={i} className="fp-wire" d={d} pathLength={1} style={st({ "--i": i })} />)}
            {wires.map((d, i) => <path key={"p" + i} className="fp-pulse" d={d} pathLength={1} style={st({ "--i": i })} />)}
            {[128, 153, 179].map((y, i) => <circle key={y} className="fp-node" cx={458} cy={y} r={3.6} style={st({ "--i": i, "--at": "0s" })} />)}
          </svg>

          <div className="fpa-card fpa-ga" style={st({ "--i": 0 })}>
            <div className="fpa-card__logo" style={st({ top: 12.3, width: 53.2 })}><span style={st({ width: 29.7, height: 31.7 })}><GA /></span><small>Google<br />Analytics</small></div>
            <span className="fpa-card__t" style={st({ left: 53.8, top: 7.2, fontSize: 10.75 })}>Google Analytics</span>
            <span className="fpa-card__t" style={st({ left: 53.8, top: 26.6 })}>{c.keyMetrics}</span>
            {c.legend.map((l, k) => (
              <span key={l} className="fpa-ga__leg" style={st({ top: 38.4 + k * 10.24, "--c": donut[k][1] })}>{l}</span>
            ))}
            <span className="fpa-card__t" style={st({ left: 117.8, top: 26.6 })}>{c.channels}</span>
            <svg className="fpa-donut" viewBox="0 0 40 40" aria-hidden="true">
              {donut.map(([v, col], k) => {
                const off = acc; acc += v;
                return <circle key={k} cx="20" cy="20" r="14.5" pathLength={100} stroke={col} strokeDasharray={`${v - 1.2} ${100 - v + 1.2}`} strokeDashoffset={-off} style={st({ "--i": k })} />;
              })}
            </svg>
          </div>

          <div className="fpa-card fpa-gsc" style={st({ "--i": 1 })}>
            <div className="fpa-card__logo" style={st({ top: 14.3, width: 62.5 })}><span style={st({ width: 40.96, height: 32.77 })}><GSC /></span><small>Search<br />Console</small></div>
            <span className="fpa-card__div" style={st({ height: 82.9 })} />
            <span className="fpa-card__t" style={st({ left: 69.1, top: 5.1, fontSize: 9.73 })}>Google Search Console</span>
            <span className="fpa-card__t" style={st({ left: 69.1, top: 21.5 })}>{c.topQueries}</span>
            <div className="fpa-gsc__tbl">
              <span className="is-h">{c.qHead[0]}</span><span className="is-h is-r">{c.qHead[1]}</span><span className="is-h is-r">{c.qHead[2]}</span>
              {c.queries.map((q, k) => (
                <span className="fpa-gsc__row" key={q} style={st({ "--i": k })}>
                  <span>{q}</span><span className="is-r">{[109, 7, 3][k]}</span><span className="is-r">{["1.3", "6.2", "6.2"][k]}</span>
                </span>
              ))}
            </div>
            <span className="fpa-gsc__avg">{c.avgPos}</span>
          </div>

          <div className="fpa-card fpa-cl" style={st({ "--i": 2 })}>
            <div className="fpa-card__logo" style={st({ top: 17.4, width: 62.5 })}><span style={st({ width: 40.96, height: 40.96 })}><Clarity /></span><small>Microsoft<br />Clarity</small></div>
            <span className="fpa-card__div" style={st({ height: 91.1 })} />
            <span className="fpa-card__t" style={st({ left: 69.6, top: 4.1, fontSize: 10.24 })}>Microsoft Clarity</span>
            <div className="fpa-heat">
              <span className="fpa-heat__nav" />
              <span className="fpa-heat__bar" style={st({ left: 3.07, top: 2.05, width: 11.26, height: 2.05 })} />
              {[47.1, 56.32, 65.53, 74.75].map((x) => <span key={x} className="fpa-heat__bar" style={st({ left: x, top: 2.56, width: 6.14, height: 1.54 })} />)}
              <span className="fpa-heat__cta" style={st({ left: 82.94, top: 1.54, width: 15.36, height: 3.58 })} />
              <span className="fpa-heat__blob is-a" /><span className="fpa-heat__blob is-b" /><span className="fpa-heat__blob is-c" />
              <span className="fpa-heat__h">{c.welcome}</span>
              <span className="fpa-heat__bar" style={st({ left: 20.48, top: 26.62, width: 56.32, height: 1.54 })} />
              <span className="fpa-heat__bar" style={st({ left: 26.62, top: 29.7, width: 44.03, height: 1.54 })} />
              <span className="fpa-heat__cta" style={st({ left: 38.91, top: 36.86, width: 15.36, height: 4.1 })} />
              <span className="fpa-heat__cursor">{Ico.cursor}</span>
            </div>
            <span className="fpa-cl__rec"><i>{Ico.play}</i>{c.recording}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============== Multilingual =============== */
const WINDOWS = [
  { code: "UA", url: "deweb.studio/ua/", nav: ["Головна", "Послуги", "Ціни", "Контакт"], navL: 132.1, title: ["Сайти, що перетворюють", "відвідувачів на клієнтів"], sub: "Сайти, що перетворюють відвідувачів на клієнтів", btn: "Безкоштовна консультація", ua: true },
  { code: "PL", url: "deweb.studio/pl/", nav: ["Strona główna", "Usługi", "Cennik", "Kontakt"], navL: 127, title: ["Strony, które zamieniają", "odwiedzających w klientów"], sub: "Strony, które zamieniają odwiedzających w klientów", btn: "Darmowa konsultacja" },
  { code: "EN", url: "deweb.studio/en/", nav: ["Home", "Services", "Blog", "Resources"], navL: 142.3, title: ["Websites that", "turn visitors into", "clients"], sub: "Websites that turn visitors into clients", btn: "Get a free quote", front: true },
];
const WIN_POS = [[0, 0, 429.1, 270.3], [206.3, 42.5, 431.1, 269.8], [425, 85, 429.6, 267.3]];
function Multilingual() {
  return (
    <div className="fp fp--ml">
      <div className="fp__in">
        <div className="fp__g">
          {WINDOWS.map((w, k) => (
            <div key={w.code} className={`fpm-win${w.front ? " is-front" : ""}`} style={st({ left: WIN_POS[k][0], top: WIN_POS[k][1], width: WIN_POS[k][2], height: WIN_POS[k][3], "--i": k })}>
              <span className="fpm-win__dots"><i /><i /><i /></span>
              <span className="fpm-win__url"><span>{Ico.lock}</span>{w.url}</span>
              <div className="fpm-page">
                <span className="fpm-logo">d<i /></span>
                <span className="fpm-nav" style={st({ left: w.navL })}>{w.nav.map((n) => <span key={n}>{n}</span>)}</span>
                <div className={`fpm-hero${w.front ? " is-top" : ""}`}>
                  <span className={`fpm-hero__t${w.ua ? " is-ua" : ""}`}>{w.title.map((l) => <span key={l}>{l}</span>)}</span>
                  <span className="fpm-hero__s">{w.sub}</span>
                  <span className="fpm-hero__b">{w.btn}</span>
                </div>
                {!w.front && <span className="fpm-switch" style={st({ left: 376.8, top: 13.3 })}>{w.code}<span>{Ico.chev}</span></span>}
                {w.front && (
                  <span className="fpm-illu">
                    <svg viewBox="0 0 150.5 135.7" aria-hidden="true" preserveAspectRatio="none">
                      <path className="fpm-illu__m is-1" d="M0 100 42 52 76 100z" fill="#4b4abf" />
                      <path className="fpm-illu__m is-2" d="M38 100 124 36l26.5 22V100z" fill="#5cc98f" />
                      <path className="fpm-illu__m is-3" d="M124 36 150.5 14v44z" fill="#6aa9e9" />
                      <rect x="0" y="100" width="75.3" height="35.7" fill="#5e6cff" />
                      <rect x="75.3" y="100" width="75.2" height="35.7" fill="#2b2c3a" />
                    </svg>
                  </span>
                )}
              </div>
              {w.front && (
                <>
                  <span className="fpm-switch" style={st({ left: 375.5, top: 37.6 })}>EN<span>{Ico.chev}</span></span>
                  <span className="fpm-drop">
                    <span className="fpm-drop__hl" />
                    <span className="fpm-drop__it is-en">EN</span>
                    <span className="fpm-drop__it is-pl">PL</span>
                    <span className="fpm-drop__it is-ua">UA</span>
                  </span>
                  <span className="fpm-cursor">{Ico.cursor}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* прев'ю за іконкою пункту; null — якщо для пункту немає анімованого прев'ю */
export function FeaturePreview({ icon, locale }: { icon?: string | null; locale: Locale }) {
  const c = COPY[locale] || COPY.en;
  if (icon === "inbox") return <Leads c={c} />;
  if (icon === "chart") return <Analytics c={c} />;
  if (icon === "globe") return <Multilingual />;
  return null;
}
export const hasFeaturePreview = (icon?: string | null) => icon === "inbox" || icon === "chart" || icon === "globe";
