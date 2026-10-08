"use client";

import { useTina, tinaField } from "tinacms/dist/react";
import Header from "./Header";
import Behaviors from "./Behaviors";
import { ArrowUpRight, Lines } from "./Icons";
import { useEffect } from "react";
import { UI, localeOf, type Locale } from "../lib/i18n";
import { casesFor } from "../lib/cases";

/* Сторінка «Усі роботи». Тексти — з content/works/<файл мови> («Сторінка робіт»),
   кейси — усі з колекції «Кейси» (content/cases/*.json).
   useTina + data-tina-field: в /admin сторінка оновлюється наживо, клік по елементу відкриває поле. */
type Q = { query: string; variables: Record<string, unknown>; data: any };
export default function WorksClient(props: Q & { locale: Locale; cases: Q }) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const { data: casesData } = useTina({ query: props.cases.query, variables: props.cases.variables, data: props.cases.data });
  const { locale } = props;
  const t = UI[locale];
  useEffect(() => { document.documentElement.lang = localeOf(locale).htmlLang; }, [locale]);
  const works = data.works;
  const cases = casesFor(casesData, locale);
  return (
    <div className={`locale locale-${locale}`}>
      <Header home={false} locale={locale} page="works" />
      <main className="page">
        <div className="page__head">
          <h1 className="page__title">
            <em data-tina-field={tinaField(works, "titleAccent")}>{works?.titleAccent}</em>{" "}
            <span data-tina-field={tinaField(works, "titleRest")}>{works?.titleRest}</span>
          </h1>
          {works?.lead && <p className="page__lead" data-tina-field={tinaField(works, "lead")}><Lines text={works.lead} /></p>}
        </div>
        <ul className="works-grid">
          {cases.map(({ c, t: ct }: any, i: number) => (
            <li key={i}>
              <a className="works-card" href={c.url || "#"} target="_blank" rel="noopener">
                <div className="works-card__media" data-tina-field={tinaField(c, "image")}>
                  {c.image
                    ? <img src={c.image} alt={c.name || ""} width={2690} height={1512} loading={i < 2 ? "eager" : "lazy"} decoding="async" />
                    : <span className="works-card__soon">{t.previewSoon}</span>}
                </div>
                <div className="works-card__meta">
                  <div className="works-card__info">
                    <h2 className="works-card__name" data-tina-field={tinaField(c, "name")}>{c.name}</h2>
                    <p className="works-card__cat">
                      <span data-tina-field={tinaField(c[locale] || c.en || c, "category")}>{ct.category}</span>
                      {ct.city && <> · <span data-tina-field={tinaField(c[locale] || c.en || c, "city")}>{ct.city}</span></>}
                    </p>
                  </div>
                  <span className="works-card__visit" data-tina-field={tinaField(c, "url")}>
                    <span className="u-link">{t.viewWebsite}</span>
                    <ArrowUpRight />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
        <div className="drag-cursor" aria-hidden="true">{t.viewWebsite}</div>
      </main>
      <Behaviors page="works" depsKey={String(cases.length)} />
    </div>
  );
}
