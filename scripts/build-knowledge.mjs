/* Після next build: база знань для AI-чату → out/api/chat-data/knowledge.md.
   Збирає тексти головної (усі три мови), сторінки робіт і кейсів з content/ у звичайний текст,
   який api/chat.php кладе в системний промпт. Змінили щось у Tina → після деплою чат уже знає нове.
   Картинки, відео, іконки й технічні поля пропускаються. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "out/api/chat-data";
const LANGS = [
  { code: "pl", name: "Polski", home: "home-pl.json", works: "works-pl.json", url: "/", worksUrl: "/realizacje/" },
  { code: "en", name: "English", home: "home.json", works: "works.json", url: "/en/", worksUrl: "/en/works/" },
  { code: "ua", name: "Українська", home: "home-ua.json", works: "works-ua.json", url: "/ua/", worksUrl: "/ua/works/" },
];
const SKIP = /^(image|imageAlt|photo|photoAlt|poster|video|icon|avatar|avatarText|start|span|variant|ctaHref|buttonHref|href|shareImage|schema|privacyUrl|chipFrom|chipTo|middle)$/;

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const title = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

/* об'єкт → рядки "Назва: значення" з відступами для вкладених списків */
function render(obj, depth = 0) {
  const pad = "  ".repeat(depth);
  const lines = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (SKIP.test(k) || v === "" || v == null || typeof v === "boolean") continue;
    if (Array.isArray(v)) {
      lines.push(`${pad}${title(k)}:`);
      v.forEach((item) => {
        if (item && typeof item === "object") {
          const sub = render(item, depth + 2);
          if (sub.length) lines.push(`${pad}  -` + sub[0].slice(pad.length + 3), ...sub.slice(1));
        } else lines.push(`${pad}  - ${String(item).replace(/\n/g, " ")}`);
      });
    } else if (typeof v === "object") {
      const sub = render(v, depth + 1);
      if (sub.length) lines.push(`${pad}${title(k)}:`, ...sub);
    } else {
      lines.push(`${pad}${title(k)}: ${String(v).replace(/\n/g, " ")}`);
    }
  }
  return lines;
}

const cases = readdirSync("content/cases")
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(join("content/cases", f)))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

let md = "# Deweb studio: site content\n\nAll prices on the site are in EUR. Content below is the live website text in three languages.\n";

for (const l of LANGS) {
  const home = readJson(join("content/home", l.home));
  delete home.seo?.schema;
  md += `\n\n## Website in ${l.name} (${l.code.toUpperCase()}), address ${l.url}\n\n`;
  for (const [section, value] of Object.entries(home)) {
    if (!value || typeof value !== "object") continue;
    const lines = render(value);
    if (lines.length) md += `### ${title(section)}\n${lines.join("\n")}\n\n`;
  }
  md += `### Portfolio (all work page ${l.worksUrl})\n`;
  for (const c of cases) {
    const t = c[l.code] || c.en || {};
    md += `- ${c.name}: ${[t.category, t.city].filter(Boolean).join(", ")} · ${c.url}\n`;
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "knowledge.md"), md);
/* файли бази й лічильників не віддаються браузеру */
writeFileSync(
  join(OUT_DIR, ".htaccess"),
  "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n",
);
console.log(`knowledge.md: ${(md.length / 1024).toFixed(1)} KB, ${cases.length} cases`);
