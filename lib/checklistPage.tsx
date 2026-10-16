import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import ChecklistClient from "../components/ChecklistClient";
import { checklistPath, localeOf, type Locale } from "./i18n";
import { shareMeta } from "./seo";
import { CHECKLIST } from "./checklistText";

/* Прихована сторінка «Сайт зробив AI?» (/checklist/, /en/checklist/, /ua/checklist/).
   Як і /audyt/: лише за посиланням — noindex, nofollow, без canonical і hreflang, не в sitemap і не в robots.txt.
   Пошукових ботів додатково відсікає public/.htaccess. */
export async function checklistMetadata(locale: Locale): Promise<Metadata> {
  const t = CHECKLIST[locale];
  return {
    title: t.meta.title,
    description: t.meta.description,
    ...(await shareMeta({ path: checklistPath(locale), title: t.meta.title, description: t.meta.description, lang: localeOf(locale).htmlLang })),
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

/* футер і форма заявки — з документа головної тієї ж мови */
export async function ChecklistPage({ locale }: { locale: Locale }) {
  const home = await client.queries.home({ relativePath: localeOf(locale).file });
  return <ChecklistClient locale={locale} home={{ footer: home.data.home?.footer, quoteForm: home.data.home?.quoteForm }} />;
}
