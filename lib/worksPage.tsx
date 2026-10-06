import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import Header from "../components/Header";
import Behaviors from "../components/Behaviors";
import { ArrowUpRight, Lines } from "../components/Icons";
import { LOCALES, UI, localeOf, worksPath, type Locale } from "./i18n";
import { isHidden, NOINDEX } from "./seo";

/* Сторінка «Усі роботи» (/works/, /pl/works/, /ua/works/).
   Кейси беруться з того ж документа, що й Recent work на головній (content/home/<файл мови>),
   тож новий кейс, доданий в адмінці, з'являється і там, і тут. */
async function getHome(locale: Locale) {
  return client.queries.home({ relativePath: localeOf(locale).file });
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function worksMetadata(locale: Locale): Promise<Metadata> {
  const t = UI[locale].works;
  const languages: Record<string, string> = {};
  LOCALES.forEach((l) => { languages[l.htmlLang] = `${siteUrl}${worksPath(l.code)}`; });
  languages["x-default"] = `${siteUrl}${worksPath("en")}`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `${siteUrl}${worksPath(locale)}`, languages },
    openGraph: { locale: localeOf(locale).htmlLang },
    robots: (await isHidden({ page: locale === "en" ? "works" : `works-${locale}` })) ? NOINDEX : undefined,
  };
}

export async function WorksPage({ locale }: { locale: Locale }) {
  const res = await getHome(locale);
  const work = res.data.home.work;
  const t = UI[locale];
  const cases = (work?.cases || []).filter(Boolean);
  return (
    <div className={`locale locale-${locale}`} lang={localeOf(locale).htmlLang}>
      <Header home={false} locale={locale} subpath="works/" />
      <main className="page">
        <div className="page__head">
          <h1 className="page__title"><em>{t.works.titleAccent}</em> {t.works.titleRest}</h1>
          {work?.lead && <p className="page__lead"><Lines text={work.lead} /></p>}
        </div>
        <ul className="works-grid">
          {cases.map((c, i) => (
            <li key={i}>
              <a className="works-card" href={c!.url || "#"} target="_blank" rel="noopener">
                <div className="works-card__media">
                  {c!.image && <img src={c!.image} alt={c!.name || ""} width={2690} height={1512} loading={i < 2 ? "eager" : "lazy"} decoding="async" />}
                </div>
                <div className="works-card__meta">
                  <div className="works-card__info">
                    <h2 className="works-card__name">{c!.name}</h2>
                    <p className="works-card__cat">
                      {c!.category}
                      {c!.city && <> · {c!.city}</>}
                    </p>
                  </div>
                  <span className="works-card__visit">
                    <span className="u-link">{t.viewWebsite}</span>
                    <ArrowUpRight />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Behaviors page="inner" />
    </div>
  );
}
