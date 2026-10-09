"use client";

import { tinaField } from "tinacms/dist/react";
import { ArrowUpRight, RightArrow, socialIcons } from "./Icons";

/* Футер (блок «Футер» документа головної своєї мови) — спільний для головної і сторінки робіт.
   Кнопка з data-open-quote відкриває QuoteModal, який має бути на тій самій сторінці. */
export default function Footer({ footer, t }: { footer: any; t: { social: string } }) {
  return (
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
  );
}
