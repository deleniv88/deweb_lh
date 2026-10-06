import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import WorksClient from "../components/WorksClient";
import { LOCALES, UI, localeOf, worksPath, worksFile, type Locale } from "./i18n";
import { isHidden, NOINDEX } from "./seo";

/* Сторінка «Усі роботи» (/works/, /pl/works/, /ua/works/).
   Тексти — документ «Сторінка робіт» (works / works-pl / works-ua), кейси — усі з колекції «Кейси».
   На головній (Recent work) — лише кейси з галочкою «Показувати на головній». */
async function getWorks(locale: Locale) {
  return client.queries.works({ relativePath: worksFile(locale) });
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function worksMetadata(locale: Locale): Promise<Metadata> {
  const seo = (await getWorks(locale)).data.works.seo;
  const t = UI[locale].works;
  const languages: Record<string, string> = {};
  LOCALES.forEach((l) => { languages[l.htmlLang] = `${siteUrl}${worksPath(l.code)}`; });
  languages["x-default"] = `${siteUrl}${worksPath("en")}`;
  return {
    title: seo?.title || t.metaTitle,
    description: seo?.description || t.metaDescription,
    alternates: { canonical: `${siteUrl}${worksPath(locale)}`, languages },
    openGraph: { locale: localeOf(locale).htmlLang },
    robots: (await isHidden({ page: locale === "en" ? "works" : `works-${locale}` })) ? NOINDEX : undefined,
  };
}

export async function WorksPage({ locale }: { locale: Locale }) {
  const [res, cases] = await Promise.all([getWorks(locale), client.queries.caseConnection({ first: 500 })]);
  return (
    <WorksClient
      data={res.data} query={res.query} variables={res.variables}
      cases={{ data: cases.data, query: cases.query, variables: cases.variables }}
      locale={locale}
    />
  );
}
