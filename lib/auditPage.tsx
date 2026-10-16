import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import AuditClient from "../components/AuditClient";
import { auditPath, localeOf, type Locale } from "./i18n";
import { shareMeta } from "./seo";
import { AUDIT } from "./auditText";

/* Прихована сторінка «Перевірка сайту» (/audyt/, /en/audit/, /ua/audyt/).
   Лише за посиланням: noindex, nofollow, без canonical і hreflang, не в sitemap і не в robots.txt
   (там її було б видно). Пошукових ботів додатково відсікає public/.htaccess. */
export async function auditMetadata(locale: Locale): Promise<Metadata> {
  const t = AUDIT[locale];
  return {
    title: t.meta.title,
    description: t.meta.description,
    /* прев'ю в месенджерах лишаємо: посиланням ділитимуться в Instagram і Telegram */
    ...(await shareMeta({ path: auditPath(locale), title: t.meta.title, description: t.meta.description, lang: localeOf(locale).htmlLang })),
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

/* футер і форма заявки — з документа головної тієї ж мови */
export async function AuditPage({ locale }: { locale: Locale }) {
  const home = await client.queries.home({ relativePath: localeOf(locale).file });
  return <AuditClient locale={locale} home={{ footer: home.data.home?.footer, quoteForm: home.data.home?.quoteForm }} />;
}
