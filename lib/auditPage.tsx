import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import AuditClient from "../components/AuditClient";
import { DEFAULT_LOCALE, LOCALES, auditPath, localeOf, type Locale } from "./i18n";
import { shareMeta } from "./seo";
import { AUDIT_SEO } from "./auditSeo";

/* Сторінка «Безкоштовний аудит сайту» (/audyt/ — PL, /en/audit/, /ua/audyt/).
   Сама сторінка індексується (є в sitemap, з hreflang). Звіти ?r=<id> — ні:
   на них public/.htaccess ставить X-Robots-Tag noindex, а canonical веде на чисту адресу. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function auditMetadata(locale: Locale): Promise<Metadata> {
  const s = AUDIT_SEO[locale];
  const languages: Record<string, string> = {};
  LOCALES.forEach((l) => { languages[l.htmlLang] = `${siteUrl}${auditPath(l.code)}`; });
  languages["x-default"] = `${siteUrl}${auditPath(DEFAULT_LOCALE)}`;
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `${siteUrl}${auditPath(locale)}`, languages },
    ...(await shareMeta({ path: auditPath(locale), title: s.title, description: s.description, lang: localeOf(locale).htmlLang })),
  };
}

/* розмітка для Google: безкоштовний веб-інструмент + FAQ */
function jsonLd(locale: Locale) {
  const s = AUDIT_SEO[locale];
  const url = `${siteUrl}${auditPath(locale)}`;
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: s.title.split(" | ")[0], url, description: s.description,
      applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: localeOf(locale).htmlLang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      provider: { "@type": "Organization", name: "Deweb studio", url: siteUrl },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: s.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
}

/* футер і форма заявки — з документа головної тієї ж мови */
export async function AuditPage({ locale }: { locale: Locale }) {
  const home = await client.queries.home({ relativePath: localeOf(locale).file });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale)).replace(/</g, "\\u003c") }} />
      <AuditClient locale={locale} home={{ footer: home.data.home?.footer, quoteForm: home.data.home?.quoteForm }} />
    </>
  );
}
