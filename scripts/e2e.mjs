// End-to-end smoke test of every conversion flow against a running dev server (console adapters).
// Usage: node scripts/e2e.mjs [baseUrl]
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3000";
const results = [];
const ok = (name, pass, info = "") => {
  results.push({ name, pass, info });
  console.log(`${pass ? "✓" : "✖"} ${name}${info ? ` — ${info}` : ""}`);
};
const devToken = (payload) => {
  const body = Buffer.from(JSON.stringify({ ...payload, x: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  return `${body}.${createHmac("sha256", process.env.DOI_SECRET ?? "dev-only-doi-secret-change-me").update(body).digest("base64url")}`;
};

await mkdir(".qa", { recursive: true });
const browser = await chromium.launch();
// On Vercel previews, skip the injected Vercel Toolbar (its open connection prevents "networkidle").
const vercelHeaders = process.env.VERCEL_SHARE ? { extraHTTPHeaders: { "x-vercel-skip-toolbar": "1" } } : {};
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...vercelHeaders });
const page = await ctx.newPage();
// Protected Vercel previews: VERCEL_SHARE=<token from the "Share" button> sets the access cookie first.
if (process.env.VERCEL_SHARE) await page.goto(`${base}/?_vercel_share=${process.env.VERCEL_SHARE}`, { waitUntil: "domcontentloaded" });
// Navigate, then wait for the network to calm down (bounded: remote previews can keep short-lived requests open).
const go = async (url) => {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
};
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// The forged-token step deliberately triggers a 400 from /api/doi/confirm; removed-page checks return 404.
page.on("console", (m) => m.type() === "error" && !/favicon|status of 40[04]/.test(m.text()) && errors.push(m.text()));

// ── Consent banner ──
await go(`${base}/`);
ok("consent banner shown on first visit", await page.getByRole("region", { name: /cookies, honestly/i }).isVisible());
await page.getByRole("button", { name: "Reject non-essential" }).click();
ok("banner hides after reject", !(await page.getByRole("region", { name: /cookies, honestly/i }).isVisible()));
await page.reload({ waitUntil: "networkidle" });
ok("choice persists across reload", !(await page.getByRole("region", { name: /cookies, honestly/i }).isVisible()));
await page.getByRole("button", { name: "Cookie settings" }).first().click();
await page.getByRole("checkbox", { name: /analytics/i }).waitFor({ timeout: 5000 }).catch(() => {});
ok("footer 'Cookie settings' reopens banner with toggles", await page.getByRole("checkbox", { name: /analytics/i }).isVisible());
await page.getByRole("button", { name: "Save choices" }).click();
ok("no GA/LinkedIn scripts without IDs/consent", (await page.locator('script[src*="googletagmanager"],script[src*="licdn"]').count()) === 0);

// ── Jelly List ──
await go(`${base}/jelly-list`);
await page.getByRole("button", { name: "JOIN THE JELLY LIST" }).click();
await page.waitForTimeout(300);
const summaryFocused = await page.evaluate(() => document.activeElement?.getAttribute("role") === "alert");
ok("empty submit → error summary focused", summaryFocused);
ok("inline errors rendered", (await page.locator('[id$="-error"]').count()) >= 8, `${await page.locator('[id$="-error"]').count()} field errors`);
ok("consent checkboxes not preselected", !(await page.locator("#consentEmail").isChecked()) && !(await page.locator("#consentPhone").isChecked()));
await page.fill("#firstName", "Ada");
await page.fill("#lastName", "Tester");
await page.fill("#company", "Example Software House");
await page.fill("#role", "CTO");
await page.fill("#email", "ada@example-software.io");
await page.getByLabel("Backend").check();
await page.getByLabel("2–4 weeks").check();
await page.getByLabel("Both").check();
await page.locator('input[name="preferredContact"][value="email"]').check();
await page.locator("#consentEmail").check();
await page.waitForTimeout(2100); // honeypot timing threshold
await page.getByRole("button", { name: "JOIN THE JELLY LIST" }).click();
await page.waitForURL("**/jelly-list/check-inbox", { timeout: 10000 }).catch(() => {});
ok("valid submit → 'One more step' screen", page.url().endsWith("/jelly-list/check-inbox"), page.url());
ok("check-inbox H1", (await page.locator("h1").textContent())?.includes("One more step") ?? false);

// ── Double opt-in ──
await go(`${base}/jelly-list/confirm?t=${devToken({ id: "e2e", e: "ada@example-software.io", l: "en", p: "jelly_list", i: "both" })}`);
ok("confirm page does NOT auto-confirm on open", page.url().includes("/confirm?"));
await page.getByRole("button", { name: "CONFIRM MY EMAIL" }).click();
await page.waitForURL("**/jelly-list/confirmed", { timeout: 10000 }).catch(() => {});
ok("button press → confirmed screen", page.url().endsWith("/jelly-list/confirmed"));
await go(`${base}/jelly-list/confirm?t=forged.token`);
await page.getByRole("button", { name: "CONFIRM MY EMAIL" }).click();
await page.waitForTimeout(800);
ok("forged token → 'expired or not valid' screen", (await page.locator("h1").textContent())?.includes("not valid") ?? false);

// ── Build Your Crew (one free-text "who do you need" field) ──
await go(`${base}/contact?form=crew`);
ok("crew form has no legacy role/stack/budget fields", (await page.locator("#roles, #headcount, #stack, #budget, #description").count()) === 0);
await page.fill("#fullName", "Ada Tester");
await page.fill("#company", "Example Software House");
await page.fill("#email", "ada@example-software.io");
await page.fill("#needs", "1× Lead Frontend (React, TypeScript), remote, starting as soon as possible for 6–12 months.");
await page.locator('input[name="preferredContact"][value="email"]').check();
ok("marketing consent optional for service request", !(await page.locator("#consentEmail").isChecked()));
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "SEND THE SIGNAL" }).click();
await page.getByText("Signal received.").waitFor({ timeout: 10000 }).catch(() => {});
ok("crew request → 'Signal received.'", await page.getByText("Signal received.").isVisible());

// ── General contact ──
await go(`${base}/contact?form=contact`);
await page.fill("#fullName", "Ada Tester");
await page.fill("#email", "ada@example-software.io");
await page.fill("#message", "Quick question about how you verify specialists.");
await page.locator("#consentEmail").check();
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "SEND THE SIGNAL" }).click();
await page.getByText("Message received.").waitFor({ timeout: 10000 }).catch(() => {});
ok("contact form → 'Message received.' + DOI note", (await page.getByText("Message received.").isVisible()) && (await page.getByText(/check your inbox to confirm/).isVisible()));

// ── Candidate ──
await go(`${base}/for-developers#join`);
await page.locator('input[type="file"]').setInputFiles({ name: "cv.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
ok("wrong CV type rejected client-side", await page.locator("#cv-error").isVisible());
await page.locator('input[type="file"]').setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%e2e\n") });
await page.fill("#fullName", "Dev Tester");
await page.fill("#email", "dev@example.io");
await page.fill("#phone", "+48 600 000 000");
await page.fill("#location", "Kraków, Poland");
await page.selectOption("#mainRole", "backend");
await page.selectOption("#seniority", "senior");
await page.selectOption("#english", "c1");
await page.selectOption("#availability", "1_month");
await page.locator('input[name="contractType"][value="b2b"]').check();
await page.locator("#consentRecruitment").check();
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "JOIN JELLY CREW" }).last().click();
await page.getByText("Welcome to the Jelly Crew pipeline.").waitFor({ timeout: 10000 }).catch(() => {});
ok("candidate with PDF CV → success", await page.getByText("Welcome to the Jelly Crew pipeline.").isVisible());

// ── Careers → apply with the offer pre-selected ──
await go(`${base}/careers`);
const offerCards = await page.locator("main article").count();
if (offerCards > 0) {
  ok("careers lists offers + JobPosting JSON-LD", (await page.locator('script[type="application/ld+json"]').allTextContents()).some((t) => t.includes('"JobPosting"')), `${offerCards} offer(s)`);
  await page.getByRole("link", { name: /^APPLY/ }).first().click();
  await page.waitForURL("**/for-developers?offer=*", { timeout: 10000 }).catch(() => {});
  await page.getByText("Applying for").waitFor({ timeout: 5000 }).catch(() => {});
  ok("apply link pre-selects the offer on the candidate form", await page.getByText("Applying for").isVisible(), page.url());
} else {
  ok("careers shows empty state when no offers are published", await page.getByText("No open offers right now.").isVisible());
}
await go(`${base}/for-developers?offer=does-not-exist#join`);
ok("unknown offer id is ignored (general application)", !(await page.getByText("Applying for").isVisible()));

// ── Removed sections are gone ──
for (const gone of ["/talent", "/how-it-works", "/insights", "/jelly-box-terms"]) {
  const res = await page.request.get(`${base}${gone}`);
  ok(`${gone} removed (404)`, res.status() === 404, String(res.status()));
}

// ── PL parity ──
await go(`${base}/pl/contact`);
ok("PL contact form localised", await page.getByRole("button", { name: "WYŚLIJ SYGNAŁ" }).isVisible());

ok("no client errors during run", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
await writeFile(".qa/e2e.json", JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
