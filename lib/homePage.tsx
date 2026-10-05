import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import HomeClient from "../components/HomeClient";
import { LOCALES, localeOf, type Locale } from "./i18n";
import { JsonLd, parseSchema, defaultHomeSchema } from "./seo";

/* Головна сторінка для кожної мови. Дані — з content/home/<файл мови> (через Tina) під час збірки. */
async function getHome(locale: Locale) {
  return client.queries.home({ relativePath: localeOf(locale).file });
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const res = await getHome(locale);
  const seo = res.data.home.seo;
  const languages: Record<string, string> = {};
  LOCALES.forEach((l) => { languages[l.htmlLang] = `${siteUrl}${l.path}`; });
  languages["x-default"] = `${siteUrl}/`;
  return {
    title: seo?.title || undefined,
    description: seo?.description || undefined,
    alternates: { canonical: `${siteUrl}${localeOf(locale).path}`, languages },
    openGraph: { locale: localeOf(locale).htmlLang },
  };
}

export async function HomePage({ locale }: { locale: Locale }) {
  const res = await getHome(locale);
  const home = res.data.home;
  const l = localeOf(locale);
  /* Schema.org: з поля SEO → Schema.org в адмінці, інакше стандартна */
  const schema =
    parseSchema(home.seo?.schema) ||
    defaultHomeSchema({ path: l.path, lang: l.htmlLang, title: home.seo?.title, description: home.seo?.description, founder: home.hero?.name, image: home.hero?.photo });
  return (
    <>
      <JsonLd data={schema} />
      <HomeClient data={res.data} query={res.query} variables={res.variables} locale={locale} />
    </>
  );
}
