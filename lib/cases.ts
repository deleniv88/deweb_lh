import type { Locale } from "./i18n";

/* Кейси: колекція «Кейси» в адмінці (content/cases/*.json, один файл = один кейс).
   Назва, скрін, посилання — спільні; категорія й місто — окремо для кожної мови. */

/* дані з client.queries.caseConnection → відсортований список для мови (поле «Порядок», потім назва) */
export function casesFor(data: any, locale: Locale) {
  return (data?.caseConnection?.edges || [])
    .map((e: any) => e?.node)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.order ?? 9999) - (b.order ?? 9999) || (a.name || "").localeCompare(b.name || ""))
    .map((c: any) => ({ c, t: c[locale] || c.en || {} }));
}
