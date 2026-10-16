"use client";

import { tinaField } from "tinacms/dist/react";
import { ArrowUpRight, Lines, RightArrow, socialIcons } from "./Icons";
import type { UIStrings } from "../lib/i18n";

/* Футер (блок «Футер» документа головної своєї мови) — спільний для головної і сторінки робіт.
   Кнопка з data-open-quote відкриває QuoteModal, який має бути на тій самій сторінці. */
export default function Footer({ footer, t }: { footer: any; t: { social: string; legal: UIStrings["legal"]; auditLink?: { label: string; href: string } } }) {
  /* посилання з адмінки має пріоритет; порожнє або «#» — сторінка політики своєї мови */
  const privacyHref = footer?.privacyUrl && footer.privacyUrl !== "#" ? footer.privacyUrl : t.legal.privacyHref;
  return (
    <footer className="ft" id="contact">
      <div className="ft__in">
        <div className="ft__card">
          <span className="ft__chip">
            <span data-tina-field={tinaField(footer, "chipFrom")}>{footer?.chipFrom}</span>
            <RightArrow />
            <span data-tina-field={tinaField(footer, "chipTo")}>{footer?.chipTo}</span>
          </span>
          <h2 className="ft__h" data-tina-field={tinaField(footer, "headline")}><Lines text={footer?.headline} /></h2>
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
          <span className="ft__legal">
            {t.auditLink && <a href={t.auditLink.href}>{t.auditLink.label}</a>}
            <a href={privacyHref} data-tina-field={tinaField(footer, "privacyLabel")}>{footer?.privacyLabel || t.legal.privacy}</a>
            <a href={t.legal.termsHref}>{t.legal.terms}</a>
            {/* CookieYes (з GTM) відкриває налаштування згоди по кліку на елемент з класом cky-banner-element */}
            <button type="button" className="ft__cookies cky-banner-element">{t.legal.cookies}</button>
          </span>
        </div>
      </div>
    </footer>
  );
}
