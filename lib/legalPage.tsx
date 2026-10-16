import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import LegalClient from "../components/LegalClient";
import { localeOf, privacyPath, termsPath, type Locale } from "./i18n";
import { shareMeta } from "./seo";
import { LEGAL } from "./legalText";

/* Юридичні сторінки: Політика приватності й cookies (/polityka-prywatnosci/, /en/privacy-policy/, /ua/privacy-policy/)
   і Регламент (/regulamin/, /en/terms/, /ua/terms/). Тексти — lib/legalText.ts.
   Закриті від Google (noindex, але follow) і не в sitemap — посилання є в футері кожної сторінки. */
export type LegalKind = "privacy" | "terms";
const pathOf = (kind: LegalKind) => (kind === "privacy" ? privacyPath : termsPath);

export async function legalMetadata(kind: LegalKind, locale: Locale): Promise<Metadata> {
  const d = LEGAL[locale][kind];
  return {
    title: d.meta.title,
    description: d.meta.description,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    ...(await shareMeta({ path: pathOf(kind)(locale), title: d.meta.title, description: d.meta.description, lang: localeOf(locale).htmlLang })),
  };
}

/* футер і форма заявки — з документа головної тієї ж мови */
export async function LegalPage({ kind, locale }: { kind: LegalKind; locale: Locale }) {
  const home = await client.queries.home({ relativePath: localeOf(locale).file });
  return <LegalClient kind={kind} locale={locale} home={{ footer: home.data.home?.footer, quoteForm: home.data.home?.quoteForm }} />;
}
