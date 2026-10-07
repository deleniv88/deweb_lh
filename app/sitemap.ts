import type { MetadataRoute } from "next";
import client from "../tina/__generated__/client";
import { LOCALES, worksPath, type Locale } from "../lib/i18n";
import { isHidden } from "../lib/seo";

/* sitemap.xml: збирається автоматично під час build.
   Головні та «Усі роботи» трьома мовами (з hreflang), блог і статті — лише якщо їх увімкнено для Google
   в «Налаштуваннях сайту». Сторінки, приховані там від Google, сюди не потрапляють. */
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  /* одна сторінка трьома мовами: кожна мовна версія — окремий запис з посиланнями на інші */
  async function addLocalized(pathOf: (code: Locale) => string, hiddenKey: (code: Locale) => string, priority: number) {
    const languages: Record<string, string> = {};
    LOCALES.forEach((l) => { languages[l.htmlLang] = `${siteUrl}${pathOf(l.code)}`; });
    languages["x-default"] = `${siteUrl}${pathOf("en")}`;
    for (const l of LOCALES) {
      if (await isHidden({ page: hiddenKey(l.code) })) continue;
      entries.push({ url: `${siteUrl}${pathOf(l.code)}`, lastModified: now, changeFrequency: "monthly", priority, alternates: { languages } });
    }
  }

  await addLocalized((c) => LOCALES.find((l) => l.code === c)!.path, (c) => c, 1);
  await addLocalized(worksPath, (c) => (c === "en" ? "works" : `works-${c}`), 0.8);

  if (!(await isHidden({ page: "blog" }))) {
    entries.push({ url: `${siteUrl}/blog/`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    const res = await client.queries.postConnection({ last: 500 });
    for (const e of res.data.postConnection.edges || []) {
      const p = e?.node;
      if (!p || (await isHidden({ post: p._sys.filename }))) continue;
      entries.push({ url: `${siteUrl}/blog/${p._sys.filename}/`, lastModified: p.date ? new Date(p.date) : now, changeFrequency: "yearly", priority: 0.5 });
    }
  }

  return entries;
}
