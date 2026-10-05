import client from "../tina/__generated__/client";

/* =========================================================
   SEO-хелпери: налаштування сайту (блог в Google так/ні) і Schema.org (JSON-LD).
   ========================================================= */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/* Чи віддавати блог у Google. Якщо налаштувань немає — блог прихований. */
export async function blogIndexed(): Promise<boolean> {
  try {
    const res = await client.queries.settings({ relativePath: "site.json" });
    return !!res.data.settings.blogIndexed;
  } catch {
    return false;
  }
}

export const NOINDEX = { index: false, follow: false } as const;

/* JSON з адмінки → об'єкт. Невалідний JSON ігнорується (тоді діє стандартна розмітка). */
export function parseSchema(raw?: string | null): unknown | null {
  if (!raw || !raw.trim()) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? v : null;
  } catch {
    return null;
  }
}

/* Стандартна розмітка головної: студія як ProfessionalService */
export function defaultHomeSchema(opts: { path: string; lang: string; title?: string | null; description?: string | null; founder?: string | null; image?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#studio`,
    name: "Deweb studio",
    url: `${siteUrl}${opts.path}`,
    inLanguage: opts.lang,
    description: opts.description || undefined,
    image: opts.image ? `${siteUrl}${opts.image}` : undefined,
    founder: opts.founder ? { "@type": "Person", name: opts.founder } : undefined,
  };
}

/* Стандартна розмітка статті: BlogPosting */
export function defaultPostSchema(opts: { slug: string; title?: string | null; description?: string | null; date?: string | null; image?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title || undefined,
    description: opts.description || undefined,
    datePublished: opts.date || undefined,
    image: opts.image ? `${siteUrl}${opts.image}` : undefined,
    mainEntityOfPage: `${siteUrl}/blog/${opts.slug}/`,
    publisher: { "@id": `${siteUrl}/#studio` },
  };
}

/* <script type="application/ld+json">; "<" екрануємо, щоб текст не міг закрити тег */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
