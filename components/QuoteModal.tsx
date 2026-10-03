import Script from "next/script";
import { ArrowUpRight, CloseIcon, TickIcon, socialIcons } from "./Icons";
import { UI, type Locale, type UIStrings } from "../lib/i18n";

/* Cloudflare Turnstile — невидима перевірка "чи це людина".
   Вмикається, лише якщо на Vercel задано NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/* Поп-ап "Get a free quote". Відкривається з будь-якої кнопки з data-open-quote
   або посилання на #contact (логіка — lib/behaviors.js → initQuote). */
export default function QuoteModal({ form, t = UI.en, locale = "en" }: { form?: any; t?: UIStrings; locale?: Locale }) {
  const f = form || {};
  const tf = t.form;
  const methods = [
    { k: "telegram", label: "Telegram" },
    { k: "instagram", label: "Instagram" },
    { k: "whatsapp", label: "WhatsApp" },
    { k: "email", label: "Email" },
  ];
  return (
    <>
      <div className="qm" id="quote" aria-hidden="true" data-quote data-i18n={JSON.stringify(tf)}>
        <div className="qm__bg" data-close></div>
        <div className="qm__box" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="qm-title">
          <button className="qm__x" type="button" data-close aria-label={t.close}><CloseIcon /></button>
          <div className="qm__head">
            <span className="qm__tag">{f.tag || "Free quote"}</span>
            <h2 className="qm__title" id="qm-title">{f.title || "Tell me about your project"}</h2>
            <p className="qm__sub">{f.subtitle || "A few details are enough. I'll get back to you with a quote and next steps."}</p>
          </div>
          <form className="qf" noValidate>
            <div>
              <label className="qf__lab" htmlFor="qf-name">{tf.nameLabel}</label>
              <input className="qf__in" id="qf-name" name="name" autoComplete="name" placeholder={tf.namePh} required />
              <p className="qf__hint" data-hint="name"></p>
            </div>
            <div>
              <span className="qf__lab" id="qf-contact-lab">{tf.contactLabel}</span>
              <div className="qf__chips" role="radiogroup" aria-labelledby="qf-contact-lab">
                {methods.map((m) => (
                  <button key={m.k} type="button" className="qf__chip" role="radio" aria-checked="false" data-k={m.k}>
                    {socialIcons[m.k]}{m.label}
                  </button>
                ))}
              </div>
              <input className="qf__in" id="qf-contact" name="contact" aria-labelledby="qf-contact-lab" required />
              <input type="hidden" name="method" />
              <input type="hidden" name="lang" value={locale} />
              <p className="qf__hint" data-hint="contact"></p>
            </div>
            <div>
              <label className="qf__lab" htmlFor="qf-msg">{tf.msgLabel}</label>
              <textarea className="qf__in" id="qf-msg" name="message" placeholder={tf.msgPh}></textarea>
            </div>
            <input className="qf__hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {TURNSTILE_KEY && <div className="cf-turnstile qf__ts" data-sitekey={TURNSTILE_KEY} data-appearance="interaction-only" data-theme="light"></div>}
            <button className="btn-primary qf__send" type="submit"><span>{tf.send}</span><ArrowUpRight /></button>
            <p className="qf__hint" data-hint="form"></p>
            <p className="qf__note">{tf.note}</p>
          </form>
          <div className="qm__ok" role="status">
            <span className="qm__tick"><TickIcon /></span>
            <h3>{f.successTitle || "Thank you!"}</h3>
            <p>{f.successText || "Your request is on its way. I'll get back to you soon."}</p>
          </div>
        </div>
      </div>
      {TURNSTILE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />}
      <button className="quote-fab" type="button" data-open-quote data-fab aria-haspopup="dialog">
        <span>{f.fabLabel || "Get a free quote"}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 7 7 17M7 17V9M7 17h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </>
  );
}
