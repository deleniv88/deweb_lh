"use client";

import { useTina, tinaField } from "tinacms/dist/react";
import Header from "./Header";
import Behaviors from "./Behaviors";
import { featureIcons, stepIcons, HandIcon, ArrowUpRight, CheckCircle, Lines, PlayIcon, SoundOffIcon, SoundOnIcon, socialIcons, RightArrow, Rich } from "./Icons";
import QuoteModal from "./QuoteModal";
import { useEffect } from "react";
import { UI, localeOf, fill, worksPath, type Locale } from "../lib/i18n";

/* виділяє частину рядка (напр. "into clients") — на мобільному вона синя */
function Accent({ text, accent }: { text?: string | null; accent?: string | null }) {
  const t = text || "";
  const a = (accent || "").trim();
  const i = a ? t.toLowerCase().lastIndexOf(a.toLowerCase()) : -1;
  if (i < 0) return <>{t}</>;
  return <>{t.slice(0, i)}<em>{t.slice(i, i + a.length)}</em>{t.slice(i + a.length)}</>;
}

type Props = {
  locale?: Locale;
  query: string;
  variables: Record<string, unknown>;
  data: any;
};

/* useTina: на звичайному сайті просто віддає дані,
   а в /admin оновлює сторінку наживо, поки ти друкуєш у бічній панелі.
   data-tina-field — робить елемент клікабельним в адмінці (відкриває потрібне поле). */
export default function HomeClient(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const locale: Locale = props.locale || "en";
  const t = UI[locale];
  const tx = t; /* службові написи всередині циклів, де змінна t зайнята */
  /* мова сторінки для браузера і скрінрідерів */
  useEffect(() => { document.documentElement.lang = localeOf(locale).htmlLang; }, [locale]);
  const home = data.home;
  const { hero, work, services, features, projectLine, testimonials, about, faq, footer, quoteForm } = home;

  const cases = (work?.cases || []).filter(Boolean);
  const svcItems = (services?.items || []).filter(Boolean);
  const featItems = (features?.items || []).filter(Boolean);
  const steps = (projectLine?.steps || []).filter(Boolean);
  const stories = (testimonials?.items || []).filter(Boolean);
  const faqs = (faq?.items || []).filter(Boolean);
  const depsKey = `${cases.length}-${svcItems.length}-${featItems.length}-${steps.length}-${stories.length}-${faqs.length}`;

  return (
    <div className={`locale locale-${locale}`}>
      <Header locale={locale} />

      {/* ================= HERO ================= */}
      <section className="hero" aria-label="Deweb studio">
        <span className="hero__word" aria-hidden="true">DEWEB</span>

        <figure className="hero__photo" data-tina-field={tinaField(hero, "photo")}>
          {hero?.photo && (
            <img src={hero.photo} alt={hero?.photoAlt || ""} width={1684} height={1876} fetchPriority="high" decoding="async" />
          )}
        </figure>

        <p className="hero__name" data-tina-field={tinaField(hero, "name")}>{hero?.name}</p>

        <div className="hero__copy">
          <h1 className="hero__title">
            <span data-tina-field={tinaField(hero, "titleLine1")}>{hero?.titleLine1}</span>{" "}
            <span data-tina-field={tinaField(hero, "titleLine2")}><Accent text={hero?.titleLine2} accent={hero?.titleAccent ?? "into clients"} /></span>
          </h1>
          <p className="hero__lead" data-tina-field={tinaField(hero, "lead")}>{hero?.lead}</p>
        </div>

        <a className="cta" href={hero?.ctaHref || "#contact"} data-tina-field={tinaField(hero, "ctaLabel")}>
          {hero?.ctaLabel}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 7 7 17M7 17V9M7 17h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>

        <ul className="stats">
          {(hero?.stats || []).filter(Boolean).map((s: any, i: number) => (
            <li className="stat" key={i} data-tina-field={tinaField(s)}>
              <span className="stat__num">{s.value}</span>
              <span className="stat__label">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= RECENT WORK ================= */}
      <section className="work" id="projects" aria-labelledby="work-title">
        <div className="work__head">
          <div className="work__intro">
            <div className="work__titles">
              <h2 className="work__title" id="work-title">
                <em data-tina-field={tinaField(work, "titleAccent")}>{work?.titleAccent}</em>{" "}
                <span data-tina-field={tinaField(work, "titleRest")}>{work?.titleRest}</span>
              </h2>
              <p className="work__lead" data-tina-field={tinaField(work, "lead")}><Lines text={work?.lead} /></p>
            </div>
          </div>

          <div className="work__controls">
            <p className="sr-only" aria-live="polite" data-work-live></p>
            <div className="work__arrows">
              <button className="arrow-btn" type="button" data-work-prev aria-label={t.prevProject}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 10H4M4 10l5.5-5.5M4 10l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button className="arrow-btn" type="button" data-work-next aria-label={t.nextProject}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M16 10l-5.5-5.5M16 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>

        <ul className="work__track" data-work-track data-live-tpl={t.liveTpl} aria-label={t.projects} aria-roledescription="carousel" tabIndex={0} key={depsKey}>
          {cases.map((c: any, i: number) => {
            const href = c.url || "#";
            return (
              <li className="work__card" key={i}>
                <a className="work__media" href={href} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true" draggable={false} data-tina-field={tinaField(c, "image")}>
                  {c.image && <img src={c.image} alt="" width={2690} height={1512} loading="lazy" decoding="async" draggable={false} />}
                </a>
                <div className="work__meta">
                  <div className="work__info">
                    <h3 className="work__name" data-tina-field={tinaField(c, "name")}>{c.name}</h3>
                    <p className="work__cat">
                      <span data-tina-field={tinaField(c, "category")}>{c.category}</span>
                      {c.city && <> · <span data-tina-field={tinaField(c, "city")}>{c.city}</span></>}
                    </p>
                  </div>
                  <a className="work__visit" href={href} target="_blank" rel="noopener" data-tina-field={tinaField(c, "url")}>
                    <span className="u-link">{t.viewWebsite}</span>
                    <ArrowUpRight />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        {/* «Усі роботи»: порожнє посилання або старе #projects → сторінка робіт цієї мови */}
        {work?.buttonLabel && (
          <div className="work__more">
            <a className="btn-primary" href={!work.buttonHref || work.buttonHref === "#projects" ? worksPath(locale) : work.buttonHref} data-tina-field={tinaField(work, "buttonLabel")}>
              <span>{work.buttonLabel}</span><ArrowUpRight />
            </a>
          </div>
        )}

        <div className="drag-cursor" aria-hidden="true">{t.viewWebsite}</div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="svc" id="services" aria-labelledby="svc-title">
        <div className="svc__inner">
          <div className="svc__pin">
            <div className="svc__head">
              <h2 className="svc__title" id="svc-title">
                <em data-tina-field={tinaField(services, "titleAccent")}>{services?.titleAccent}</em>{" "}
                <span data-tina-field={tinaField(services, "titleRest")}><Lines text={services?.titleRest} /></span>
              </h2>
              <p className="svc__lead" data-tina-field={tinaField(services, "lead")}>{services?.lead}</p>
              <p className="svc__note" data-tina-field={tinaField(services, "note")}>{services?.note}</p>
            </div>
          </div>

          <ul className="svc__stack" data-svc-stack key={depsKey}>
            {svcItems.map((s: any, i: number) => (
              <li className="svc-card" key={i} style={{ ["--i" as any]: i }}>
                <div className="svc-card__top">
                  <span className="svc-card__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="svc-card__dot" aria-hidden="true"></span>
                  <span className="svc-card__type" data-tina-field={tinaField(s, "type")}>{s.type}</span>
                  <span className="svc-card__dot" aria-hidden="true"></span>
                  <span className="svc-card__time" data-tina-field={tinaField(s, "timeline")}>{s.timeline}</span>
                </div>
                <div className="svc-card__body">
                  <div className="svc-card__text">
                    <div className="svc-card__intro">
                      <h3 className="svc-card__name" data-tina-field={tinaField(s, "name")}>{s.name}</h3>
                      <p className="svc-card__desc" data-tina-field={tinaField(s, "description")}>{s.description}</p>
                    </div>
                    <ul className="svc-card__list" data-tina-field={tinaField(s, "features")}>
                      {(s.features || []).filter(Boolean).map((f: string, k: number) => (
                        <li key={k}><CheckCircle /><span>{f}</span></li>
                      ))}
                    </ul>
                    <a className="btn-primary" href={s.buttonHref || "#contact"} data-tina-field={tinaField(s, "buttonLabel")}>
                      <span>{s.buttonLabel}</span>
                      <ArrowUpRight />
                    </a>
                  </div>
                  <div className="svc-card__media" data-tina-field={tinaField(s, "image")}>
                    {s.image && <img src={s.image} alt={`${s.name} example`} width={748} height={421} loading="lazy" decoding="async" />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= EVERY SITE INCLUDES ================= */}
      <section className="feat" id="features" aria-labelledby="feat-title">
        <div className="feat__panel">
          <div className="feat__head">
            <h2 className="feat__title" id="feat-title">
              <em data-tina-field={tinaField(features, "titleAccent")}>{features?.titleAccent}</em>{" "}
              <span data-tina-field={tinaField(features, "titleRest")}>{features?.titleRest}</span>
            </h2>
            <p className="feat__lead" data-tina-field={tinaField(features, "lead")}>{features?.lead}</p>
          </div>

          <div className="feat__body" data-feat key={depsKey}>
            <ol className="feat__list" role="tablist" aria-orientation="vertical" aria-label={t.featuresAria}>
              {featItems.map((f: any, i: number) => (
                <li className={`feat__li${i === 0 ? " is-open" : ""}`} role="presentation" key={i}>
                  <button
                    className={`feat__item${i === 0 ? " is-active" : ""}`}
                    type="button"
                    role="tab"
                    id={`feat-tab-${i}`}
                    aria-controls={`feat-panel-${i}`}
                    aria-selected={i === 0}
                    tabIndex={i === 0 ? 0 : -1}
                  >
                    <span className="feat__icon" aria-hidden="true" data-tina-field={tinaField(f, "icon")}>{featureIcons[f.icon] || featureIcons.fast}</span>
                    <span className="feat__text">
                      <span className="feat__name" data-tina-field={tinaField(f, "name")}>{f.name}</span>
                      <span className="feat__desc"><span data-tina-field={tinaField(f, "description")}>{f.description}</span></span>
                    </span>
                  </button>
                  {/* на мобільному фото з'являється під пунктом, як акордеон */}
                  <div className="feat__mimg" aria-hidden="true">
                    <div>
                      {f.image ? (
                        <img src={f.image} alt="" width={1042} height={521} loading="lazy" decoding="async" />
                      ) : (
                        <div className="feat__ph">{featureIcons[f.icon] || featureIcons.fast}<span>{f.name}</span><small>{t.previewSoon}</small></div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="feat__stage">
              {featItems.map((f: any, i: number) => (
                <div
                  className={`feat__panelimg${i === 0 ? " is-active" : ""}`}
                  role="tabpanel"
                  id={`feat-panel-${i}`}
                  aria-labelledby={`feat-tab-${i}`}
                  hidden={i !== 0}
                  key={i}
                  data-tina-field={tinaField(f, "image")}
                >
                  {f.image ? (
                    <img src={f.image} alt={f.imageAlt || f.name || ""} width={1042} height={521} loading="lazy" decoding="async" />
                  ) : (
                    <div className="feat__ph">
                      {featureIcons[f.icon] || featureIcons.fast}
                      <span>{f.name}</span>
                      <small>{t.previewSoon}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ================= PROJECT LINE ================= */}
      <section className="pl" id="process" aria-labelledby="pl-title" data-pl>
        <div className="pl__card" key={depsKey}>
          <div className="pl__top">
            <h2 className="pl__title" id="pl-title"><span>/</span> <span style={{ color: "inherit", fontWeight: 400 }} data-tina-field={tinaField(projectLine, "title")}>{projectLine?.title}</span></h2>
            <p className="pl__note" data-tina-field={tinaField(projectLine, "note")}><Lines text={projectLine?.note} /></p>
          </div>

          <div className="pl__scroll">
            <div className="pl__gantt" style={{ ["--n" as any]: steps.length || 1 }}>
              <span className="pl__hline" aria-hidden="true"></span>
              {[1, 2, 3, 4].map((n) => `${t.week} ${n}`).map((w, k) => (
                <span className="pl__week" key={w} style={{ gridColumn: `${k * 5 + 1} / span 5` }}>{w}</span>
              ))}
              <span className="pl__week" style={{ gridColumn: 21 }}>∞</span>
              {Array.from({ length: 20 }).map((_, k) => (
                <span className="pl__day" key={k} style={{ gridColumn: k + 1 }}>{t.days[k % 5]}</span>
              ))}
              <span className="pl__day" style={{ gridColumn: 21 }}>{t.after}</span>
              {[6, 11, 16, 21].map((c) => (
                <span className="pl__vline" key={c} style={{ gridColumn: c }} aria-hidden="true"></span>
              ))}
              <div className="pl__mhead" aria-hidden="true">{[1, 2, 3, 4].map((n) => <span key={n}>{t.weekShort}{n}</span>)}<span>∞</span></div>

              {steps.map((st: any, i: number) => {
                const start = Math.min(21, Math.max(1, Number(st.start) || 1));
                const span = Math.max(1, Math.min(22 - start, Number(st.span) || 1));
                return (
                  <div
                    className={`pl__bar pl__bar--${st.variant || "solid"}${start + span > 16 ? " is-right" : ""}${i < 2 ? " is-below" : ""}`}
                    key={i}
                    tabIndex={0}
                    style={{ ["--row" as any]: i + 3, ["--st" as any]: start, ["--sp" as any]: span, ["--i" as any]: i }}
                    data-tina-field={tinaField(st)}
                  >
                    <span className="pl__in">
                      {stepIcons[st.icon] || stepIcons.users}
                      <span className="pl__name">{st.name}</span>
                      <span className="pl__when">{st.when}</span>
                      <i className="pl__knob" aria-hidden="true"></i>
                    </span>
                    <span className="pl__mt" aria-hidden="true"></span>
                    <span className="pl__tip">
                      <b>{String(i + 1).padStart(2, "0")} · {st.name}</b>
                      {st.description}
                      {st.result && <em>→ {st.result}</em>}
                    </span>
                  </div>
                );
              })}
              <span className="pl__now" data-label={t.today} aria-hidden="true"></span>
            </div>
          </div>

          <div className="pl__foot">
            <span className="pl__hint" data-tina-field={tinaField(projectLine, "hint")}><HandIcon />{projectLine?.hint}</span>
            <a className="btn-primary" href={projectLine?.buttonHref || "#contact"} data-tina-field={tinaField(projectLine, "buttonLabel")}>
              <span>{projectLine?.buttonLabel}</span>
              <ArrowUpRight />
            </a>
          </div>
        </div>
      </section>


      {/* ================= CLIENTS ABOUT US ================= */}
      <section className="tst" id="reviews" aria-labelledby="tst-title" data-tst data-mute={t.mute} data-unmute={t.unmute} key={`tst-${depsKey}`}>
        <div className="tst__head">
          <h2 className="tst__title" id="tst-title">
            <em data-tina-field={tinaField(testimonials, "titleAccent")}>{testimonials?.titleAccent}</em>{" "}
            <span data-tina-field={tinaField(testimonials, "titleRest")}>{testimonials?.titleRest}</span>
          </h2>
          <p className="tst__lead" data-tina-field={tinaField(testimonials, "lead")}>{testimonials?.lead}</p>
        </div>

        <div className="tst__deck" tabIndex={0} aria-roledescription="carousel" aria-label={t.storiesAria}>
          {stories.map((t: any, i: number) => (
            <article className="tst__card" key={i} data-pos={i === 0 ? "center" : i === 1 ? "right" : i === stories.length - 1 ? "left" : "hidden"} data-tina-field={tinaField(t)}>
              {t.poster && <img className="tst__poster" src={t.poster} alt="" loading="lazy" decoding="async" />}
              {t.video && (
                <video className="tst__video" data-src={t.video} poster={t.poster || undefined} muted loop playsInline preload="none" aria-label={fill(tx.videoTpl, { name: t.name })} />
              )}
              <span className="tst__shade" aria-hidden="true"></span>
              <div className="tst__bars" aria-hidden="true">{stories.map((_: any, k: number) => <i key={k}></i>)}</div>
              <div className="tst__top">
                <span className="tst__ava">{t.avatar ? <img src={t.avatar} alt="" /> : t.avatarText}</span>
                <span className="tst__who"><b>{t.name}</b><span>{t.company}</span></span>
                <button className="tst__sound" type="button" aria-label={tx.unmute}>
                  <span className="off"><SoundOffIcon /></span>
                  <span className="on"><SoundOnIcon /></span>
                </button>
              </div>
              <button className="tst__play" type="button" aria-label={fill(tx.playTpl, { name: t.name })}><PlayIcon /></button>
              <p className="tst__caption">{t.caption}</p>
            </article>
          ))}
        </div>

        <div className="tst__nav">
          <button className="tst__arrow" type="button" data-tst-prev aria-label={t.prevStory}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 10H4M4 10l5.5-5.5M4 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="tst__count" aria-live="polite"><b data-tst-cur>1</b> / {stories.length}</p>
          <button className="tst__arrow" type="button" data-tst-next aria-label={t.nextStory}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M16 10l-5.5-5.5M16 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </section>


      {/* ================= ABOUT ME ================= */}
      <section className="about" id="about" aria-labelledby="about-title">
        <div className="about__grid">
          <div className="about__card about__photo" data-tina-field={tinaField(about, "photo")}>
            {about?.photo && <img src={about.photo} alt={about?.name || ""} loading="lazy" decoding="async" />}
            <div className="about__name">
              <b data-tina-field={tinaField(about, "name")}>{about?.name}</b>
              <span data-tina-field={tinaField(about, "role")}>{about?.role}</span>
            </div>
          </div>
          <div className="about__card about__intro">
            <h2 className="about__title" id="about-title">
              <em data-tina-field={tinaField(about, "titleAccent")}>{about?.titleAccent}</em>{" "}
              <span data-tina-field={tinaField(about, "titleRest")}>{about?.titleRest}</span>
            </h2>
            <p className="about__text" data-tina-field={tinaField(about, "text")}><Rich text={about?.text} /></p>
          </div>
          <div className="about__card about__solo">
            <h3 data-tina-field={tinaField(about, "soloTitle")}>{about?.soloTitle}</h3>
            <p data-tina-field={tinaField(about, "soloText")}>{about?.soloText}</p>
          </div>
          <div className="about__card about__facts">
            <ul>
              {(about?.facts || []).filter(Boolean).map((f: any, i: number) => (
                <li key={i} data-tina-field={tinaField(f)}>
                  <b className={String(f.value || "").length > 5 ? "sm" : undefined}>{f.value}</b>
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
            <button className="btn-primary" type="button" data-open-quote data-tina-field={tinaField(about, "buttonLabel")}>
              <span>{about?.buttonLabel}</span><ArrowUpRight />
            </button>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="faq" id="faq" aria-labelledby="faq-title">
        <div className="faq__in">
          <div className="faq__side">
            <h2 className="faq__title" id="faq-title">
              <em data-tina-field={tinaField(faq, "titleAccent")}>{faq?.titleAccent}</em>{" "}
              <span data-tina-field={tinaField(faq, "titleRest")}>{faq?.titleRest}</span>
            </h2>
            <p className="faq__lead" data-tina-field={tinaField(faq, "lead")}>{faq?.lead}</p>
            <button className="faq__ask" type="button" data-open-quote data-tina-field={tinaField(faq, "askLabel")}>
              {faq?.askLabel}<ArrowUpRight />
            </button>
          </div>
          <ol className="faq__list" data-faq key={`faq-${depsKey}`}>
            {faqs.map((q: any, i: number) => (
              <li className={`qa${i === 0 ? " is-open" : ""}`} key={i} data-tina-field={tinaField(q)}>
                <button className="qa__q" type="button" aria-expanded={i === 0} aria-controls={`qa-a${i}`} id={`qa-q${i}`}>
                  <span className="qa__n">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="qa__t">{q.question}</h3>
                  <span className="qa__pm" aria-hidden="true"></span>
                </button>
                <div className="qa__a" id={`qa-a${i}`} role="region" aria-labelledby={`qa-q${i}`}>
                  <div><p><Rich text={q.answer} /></p></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="ft" id="contact">
        <div className="ft__in">
          <div className="ft__card">
            <span className="ft__chip">
              <span data-tina-field={tinaField(footer, "chipFrom")}>{footer?.chipFrom}</span>
              <RightArrow />
              <span data-tina-field={tinaField(footer, "chipTo")}>{footer?.chipTo}</span>
            </span>
            <h2 className="ft__h" data-tina-field={tinaField(footer, "headline")}>{footer?.headline}</h2>
            <button className="ft__cta" type="button" data-open-quote data-tina-field={tinaField(footer, "buttonLabel")}>
              {footer?.buttonLabel}<ArrowUpRight />
            </button>
            <nav className="ft__links" aria-label={t.social}>
              {(footer?.links || []).filter(Boolean).map((l: any, i: number) => (
                <a key={i} href={l.url || "#"} target={String(l.url || "").startsWith("http") ? "_blank" : undefined} rel="noopener" data-tina-field={tinaField(l)}>
                  {socialIcons[l.icon] || socialIcons.email}{l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="ft__mark" aria-hidden="true"><span><i>D</i><i>E</i><i>W</i><i>E</i><i>B</i></span></div>
          <div className="ft__bottom">
            <span data-tina-field={tinaField(footer, "copyright")}>{footer?.copyright}</span>
            <span data-tina-field={tinaField(footer, "middle")}>{footer?.middle}</span>
            <a href={footer?.privacyUrl || "#"} data-tina-field={tinaField(footer, "privacyLabel")}>{footer?.privacyLabel}</a>
          </div>
        </div>
      </footer>

      <QuoteModal form={quoteForm} t={t} locale={locale} />

      <Behaviors depsKey={depsKey} page="home" />
    </div>
  );
}
