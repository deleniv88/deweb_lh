// Звіт PageSpeed Insights у лог: node scripts/psi-report.mjs <url> <mobile|desktop>
const [url = "https://deweb.studio/", strategy = "mobile"] = process.argv.slice(2);
const key = process.env.PAGESPEED_API_KEY || "";
const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance${key ? `&key=${key}` : ""}`;
const res = await fetch(api);
const j = await res.json();
if (!j.lighthouseResult) { console.log(JSON.stringify(j).slice(0, 2000)); process.exit(1); }
const lh = j.lighthouseResult, a = lh.audits;
console.log(`\n===== ${strategy.toUpperCase()} ${url} score=${Math.round(lh.categories.performance.score * 100)}`);
for (const id of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"])
  console.log(`  ${id}: ${a[id]?.displayValue} (${a[id]?.score})`);
const lcp = ["lcp-breakdown-insight","lcp-discovery-insight","largest-contentful-paint-element"].map(id => a[id]?.details && JSON.stringify(a[id].details)).filter(Boolean).join("\n");
console.log("LCP element:", lcp.slice(0, 3000));
const cls = a["layout-shift-elements"]?.details?.items || a["layout-shifts"]?.details?.items;
console.log("CLS:", JSON.stringify(cls)?.slice(0, 1500));
const bad = Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable");
console.log("\nFailing audits:");
for (const x of bad) console.log(`  [${x.score}] ${x.id}: ${x.displayValue || ""}`);
for (const id of ["third-party-summary", "bootup-time", "mainthread-work-breakdown", "render-blocking-resources", "render-blocking-insight", "network-requests", "total-byte-weight", "unused-javascript", "lcp-phases-insight", "lcp-discovery-insight", "largest-contentful-paint-element", "long-tasks"]) {
  const d = a[id]?.details; if (!d) continue;
  const items = (d.items || []).slice(0, id === "network-requests" ? 60 : 15).map(i => {
    const o = {}; for (const k of ["url", "entity", "transferSize", "blockingTime", "mainThreadTime", "total", "scripting", "wastedBytes", "wastedMs", "startTime", "duration", "groupLabel", "resourceType", "endTime", "phase", "timing", "percent", "label"]) if (i[k] !== undefined) o[k] = typeof i[k] === "number" ? Math.round(i[k]) : (typeof i[k] === "string" ? i[k].slice(0, 120) : i[k]);
    return JSON.stringify(o);
  });
  console.log(`\n--- ${id} ${a[id].displayValue || ""}\n  ` + items.join("\n  "));
}
