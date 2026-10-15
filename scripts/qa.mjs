// QA runner: responsive screenshots + axe (WCAG 2.2 AA) + overflow / H1 checks.
// Usage: node scripts/qa.mjs [baseUrl] [--paths=/,/pl] [--motion=reduce]
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const paths = (args.find((a) => a.startsWith("--paths="))?.slice(8) ?? "/,/pl").split(",");
const reduce = args.includes("--motion=reduce");
const widths = (args.find((a) => a.startsWith("--widths="))?.slice(9) ?? "375,768,1024,1440,1920").split(",").map(Number);
const out = ".qa";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const report = [];

for (const path of paths) {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 }, reducedMotion: reduce ? "reduce" : "no-preference", ...(process.env.VERCEL_SHARE ? { extraHTTPHeaders: { "x-vercel-skip-toolbar": "1" } } : {}) });
    const page = await ctx.newPage();
    if (process.env.VERCEL_SHARE) await page.goto(`${base}/?_vercel_share=${process.env.VERCEL_SHARE}`, { waitUntil: "domcontentloaded" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(3500); // let hero entrance + idle WebGL load settle
    const facts = await page.evaluate(() => ({
      // Real horizontal scrollability (clipped decorative overflow doesn't count).
      overflowX: (window.scrollTo(400, window.scrollY), window.scrollX),
      h1: document.querySelectorAll("h1").length,
      canvas: !!document.querySelector("canvas"),
      lang: document.documentElement.lang,
    }));
    await page.screenshot({ path: `${out}/${path.replace(/\W+/g, "_") || "root"}-${width}-hero.png` });
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => (e.dataset.shown = "")));
    await page.waitForTimeout(1200); // let reveal transitions finish
    await page.screenshot({ path: `${out}/${path.replace(/\W+/g, "_") || "root"}-${width}-full.png`, fullPage: true });
    let violations = [];
    if (width === 375 || width === 1440) {
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target.join(" ") }));
    }
    report.push({ path, width, ...facts, errors, violations });
    console.log(`${path} @${width}: overflowX=${facts.overflowX} h1=${facts.h1} webgl=${facts.canvas} axe=${violations.length} errors=${errors.length}`);
    await ctx.close();
  }
}
await browser.close();
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.overflowX > 0 || r.h1 !== 1 || r.violations.length || r.errors.length);
if (bad.length) {
  console.log("\nISSUES:\n" + JSON.stringify(bad.map(({ path, width, overflowX, h1, violations, errors }) => ({ path, width, overflowX, h1, violations, errors })), null, 2));
  process.exitCode = 1;
}
