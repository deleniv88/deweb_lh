/* Після next build: правильна мова в <html lang> для кожної сторінки.
   Next.js має один спільний layout з lang="en"; без цього кроку Google бачить польські й українські
   сторінки як англійські (у браузері мова й так виправляється скриптом, а пошуковику потрібна одразу в HTML).
   Основна мова — польська (/ і /realizacje/), англійська — /en/ і блог, українська — /ua/. */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const KEEP_EN = ["en", "blog", "admin", "404"]; // папки в out/, що лишаються англійськими
const FILES_EN = ["404.html", "_not-found.html"]; // службові сторінки — англійською

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

function langOf(file) {
  const rel = relative(OUT, file);
  const top = rel.split(sep)[0];
  if (top === "ua") return "uk";
  if (KEEP_EN.includes(top) || FILES_EN.includes(rel) || rel.startsWith("_")) return "en";
  return "pl";
}

let changed = 0;
for (const file of walk(OUT)) {
  const lang = langOf(file);
  if (lang === "en") continue;
  const html = readFileSync(file, "utf8");
  const next = html.replace(/<html lang="en"/, `<html lang="${lang}"`);
  if (next !== html) { writeFileSync(file, next); changed++; }
}
console.log(`set-html-lang: ${changed} page(s) updated`);
