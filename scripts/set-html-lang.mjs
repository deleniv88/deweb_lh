/* Після next build: правильна мова в <html lang> для польських і українських сторінок.
   Next.js має один спільний layout з lang="en"; без цього кроку Google бачить /pl/ і /ua/ як англійські
   (у браузері мова й так виправляється скриптом, а пошуковику потрібна одразу в HTML). */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const DIRS = { pl: "pl", ua: "uk" }; // папка в out/ → код мови

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const [dir, lang] of Object.entries(DIRS)) {
  for (const file of walk(join(OUT, dir))) {
    const html = readFileSync(file, "utf8");
    const next = html.replace(/<html lang="en"/, `<html lang="${lang}"`);
    if (next !== html) { writeFileSync(file, next); changed++; }
  }
}
console.log(`set-html-lang: ${changed} page(s) updated`);
