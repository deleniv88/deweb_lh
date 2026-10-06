import client from "../tina/__generated__/client";

/* =========================================================
   SEO-хелпери: налаштування сайту (блог в Google так/ні) і Schema.org (JSON-LD).
   ========================================================= */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/* Налаштування сайту → що сховати від Google і картинка для посилань. Якщо налаштувань немає — блог прихований. */
type Visibility = { blogIndexed: boolean; hiddenPages: string[]; hiddenPosts: string[]; shareImage: string | null };

let cached: Promise<Visibility> | null = null;
function visibility(): Promise<Visibility> {
  cached ??= client.queries
    .settings({ relativePath: "site.json" })
    .then(({ data: { settings: s } }) => ({
      shareImage: s.shareImage || null,
      blogIndexed: !!s.blogIndexed,
      hiddenPages: (s.hiddenPages || []).filter(Boolean) as string[],
      // посилання на статтю приходить як документ; беремо назву файлу (= адреса статті)
      hiddenPosts: (s.hiddenPosts || [])
        .map((h: any) => h?.post?._sys?.filename || (typeof h?.post === "string" ? h.post.split("/").pop().replace(/\.mdx$/, "") : null))
        .filter(Boolean) as string[],
    }))
    .catch(() => ({ blogIndexed: false, hiddenPages: [], hiddenPosts: [], shareImage: null }));
  return cached;
}

/* page: "en" | "pl" | "ua" | "blog"; для статті — post: slug */
export async function isHidden(target: { page: string } | { post: string }): Promise<boolean> {
  const v = await visibility();
  if ("page" in target) return target.page === "blog" ? !v.blogIndexed || v.hiddenPages.includes("blog") : v.hiddenPages.includes(target.page);
  return !v.blogIndexed || v.hiddenPosts.includes(target.post);
}

/* Прев'ю посилання (Open Graph + Twitter): заголовок, опис і картинка, які показують месенджери й соцмережі.
   image — картинка сторінки з адмінки; порожньо = картинка з «Налаштування сайту». Усі адреси абсолютні. */
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${siteUrl}${u.startsWith("/") ? "" : "/"}${u}`);

export async function shareMeta(o: {
  path: string;
  title?: string | null;
  description?: string | null;
  lang?: string;
  image?: string | null;
  type?: "website" | "article";
}) {
  const src = o.image || (await visibility()).shareImage;
  const images = src ? [{ url: abs(src), alt: o.title || "Deweb studio" }] : undefined;
  const locale = o.lang === "pl" ? "pl_PL" : o.lang === "uk" ? "uk_UA" : "en_US";
  return {
    openGraph: {
      type: o.type || "website",
      siteName: "Deweb studio",
      url: abs(o.path),
      locale,
      title: o.title || undefined,
      description: o.description || undefined,
      images,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: o.title || undefined,
      description: o.description || undefined,
      images: images?.map((i) => i.url),
    },
  };
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
