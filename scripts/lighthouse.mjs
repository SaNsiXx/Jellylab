// Lighthouse runs against a production server (next build && next start).
// Usage: node scripts/lighthouse.mjs [baseUrl]   — reports land in .qa/lh/*.html
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3100";
const chromePath = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const runs = [
  ...["/", "/talent", "/contact", "/jelly-list", "/for-developers", "/insights"].map((path) => ({ path, device: "mobile" })),
  { path: "/", device: "desktop", label: "home · WebGL" },
  { path: "/", device: "desktop", label: "home · no WebGL", flags: ["--disable-webgl"] },
  { path: "/talent", device: "desktop" },
  { path: "/contact", device: "desktop" },
];

await mkdir(".qa/lh", { recursive: true });
const rows = [];
for (const r of runs) {
  const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ["--headless=new", "--no-first-run", ...(r.flags ?? [])] });
  try {
    const config = r.device === "desktop" ? (await import("lighthouse/core/config/desktop-config.js")).default : undefined;
    const res = await lighthouse(`${base}${r.path}`, { port: chrome.port, output: "html", logLevel: "error" }, config);
    const lhr = res.lhr;
    const a = lhr.audits;
    const name = `${r.device}-${(r.label ?? r.path).replace(/\W+/g, "_")}`;
    await writeFile(`.qa/lh/${name}.html`, res.report);
    const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    rows.push({
      run: `${r.device.padEnd(7)} ${r.label ?? r.path}`,
      perf: score("performance"),
      a11y: score("accessibility"),
      bp: score("best-practices"),
      seo: score("seo"),
      LCP: a["largest-contentful-paint"].displayValue,
      CLS: a["cumulative-layout-shift"].displayValue,
      TBT: a["total-blocking-time"].displayValue,
      FCP: a["first-contentful-paint"].displayValue,
      lcpEl: (a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? "").slice(0, 60),
      fails: Object.values(a)
        .filter((x) => x.score !== null && x.score < 0.9 && ["binary", "numeric"].includes(x.scoreDisplayMode) && !/metric/.test(x.id))
        .map((x) => x.id)
        .slice(0, 8)
        .join(","),
    });
    console.log(JSON.stringify(rows.at(-1)));
  } finally {
    await chrome.kill();
  }
}
await writeFile(".qa/lh/summary.json", JSON.stringify(rows, null, 2));
