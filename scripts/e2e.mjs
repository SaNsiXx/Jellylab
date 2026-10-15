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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// The forged-token step deliberately triggers a 400 from /api/doi/confirm.
page.on("console", (m) => m.type() === "error" && !/favicon|status of 400/.test(m.text()) && errors.push(m.text()));

// ── Consent banner ──
await page.goto(`${base}/`, { waitUntil: "networkidle" });
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
await page.goto(`${base}/jelly-list`, { waitUntil: "networkidle" });
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
await page.goto(`${base}/jelly-list/confirm?t=${devToken({ id: "e2e", e: "ada@example-software.io", l: "en", p: "jelly_list", i: "both" })}`, { waitUntil: "networkidle" });
ok("confirm page does NOT auto-confirm on open", page.url().includes("/confirm?"));
await page.getByRole("button", { name: "CONFIRM MY EMAIL" }).click();
await page.waitForURL("**/jelly-list/confirmed", { timeout: 10000 }).catch(() => {});
ok("button press → confirmed screen", page.url().endsWith("/jelly-list/confirmed"));
await page.goto(`${base}/jelly-list/confirm?t=forged.token`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "CONFIRM MY EMAIL" }).click();
await page.waitForTimeout(800);
ok("forged token → 'expired or not valid' screen", (await page.locator("h1").textContent())?.includes("not valid") ?? false);

// ── Build Your Crew from a talent profile ──
await page.goto(`${base}/contact?form=crew&profile=JL-SAMPLE-02`, { waitUntil: "networkidle" });
ok("profile id carried into crew form", (await page.getByText("JL-SAMPLE-02").count()) > 0);
await page.fill("#fullName", "Ada Tester");
await page.fill("#company", "Example Software House");
await page.fill("#email", "ada@example-software.io");
await page.fill("#roles", "1× Lead Frontend");
await page.fill("#headcount", "1");
await page.fill("#stack", "React, TypeScript, Next.js");
await page.selectOption("#seniority", "lead");
await page.selectOption("#startDate", "asap");
await page.selectOption("#duration", "6_12");
await page.locator('input[name="workModel"][value="remote"]').check();
await page.fill("#description", "Our product team is blocked on a frontend rewrite and needs a lead quickly.");
await page.locator('input[name="preferredContact"][value="email"]').check();
ok("marketing consent optional for service request", !(await page.locator("#consentEmail").isChecked()));
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "SEND THE SIGNAL" }).click();
await page.getByText("Signal received.").waitFor({ timeout: 10000 }).catch(() => {});
ok("crew request → 'Signal received.'", await page.getByText("Signal received.").isVisible());

// ── General contact ──
await page.goto(`${base}/contact?form=contact`, { waitUntil: "networkidle" });
await page.fill("#fullName", "Ada Tester");
await page.fill("#email", "ada@example-software.io");
await page.fill("#message", "Quick question about how you verify specialists.");
await page.locator("#consentEmail").check();
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "SEND THE SIGNAL" }).click();
await page.getByText("Message received.").waitFor({ timeout: 10000 }).catch(() => {});
ok("contact form → 'Message received.' + DOI note", (await page.getByText("Message received.").isVisible()) && (await page.getByText(/check your inbox to confirm/).isVisible()));

// ── Candidate ──
await page.goto(`${base}/for-developers#join`, { waitUntil: "networkidle" });
await page.locator('input[type="file"]').setInputFiles({ name: "cv.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
ok("wrong CV type rejected client-side", await page.locator("#cv-error").isVisible());
await page.locator('input[type="file"]').setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%e2e\n") });
await page.fill("#fullName", "Dev Tester");
await page.fill("#email", "dev@example.io");
await page.fill("#phone", "+48 600 000 000");
await page.fill("#location", "Kraków, Poland");
await page.selectOption("#mainRole", "backend");
await page.selectOption("#seniority", "senior");
await page.fill("#technologies", ".NET, Azure, SQL");
await page.selectOption("#english", "c1");
await page.selectOption("#availability", "1_month");
await page.locator('input[name="contractType"][value="b2b"]').check();
await page.locator("#consentRecruitment").check();
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "JOIN JELLY CREW" }).last().click();
await page.getByText("Welcome to the Jelly Crew pipeline.").waitFor({ timeout: 10000 }).catch(() => {});
ok("candidate with PDF CV → success", await page.getByText("Welcome to the Jelly Crew pipeline.").isVisible());

// ── Jelly Box delivery address (invitation-only) ──
const boxToken = devToken({ id: "e2e-box", e: "ada@example-software.io", l: "en", p: "jelly_box" });
await page.goto(`${base}/jelly-box/address?t=${boxToken}`, { waitUntil: "networkidle" });
ok("jelly box: valid invitation shows the address form", await page.locator("#postalCode").isVisible());
await page.fill("#company", "Example Software House");
await page.fill("#recipientName", "Ada Tester");
await page.fill("#street", "ul. Przykładowa 1/2");
await page.fill("#postalCode", "44100");
await page.fill("#city", "Gliwice");
await page.fill("#phone", "+48 600 000 000");
await page.locator("#postalCode").blur();
await page.waitForTimeout(300);
ok("jelly box: wrong postal code format rejected", await page.locator("#postalCode-error").isVisible());
await page.fill("#postalCode", "44-100");
await page.locator("#confirmCompanyAddress").check();
await page.waitForTimeout(2100);
await page.getByRole("button", { name: "SEND MY ADDRESS" }).click();
await page.getByText("Address received.").waitFor({ timeout: 10000 }).catch(() => {});
ok("jelly box: address submitted → success", await page.getByText("Address received.").isVisible());
await page.goto(`${base}/jelly-box/address?t=forged.token`, { waitUntil: "networkidle" });
ok("jelly box: forged token → invalid screen", (await page.locator("h1").textContent())?.includes("not valid") ?? false);
await page.goto(`${base}/jelly-box/address?t=${devToken({ id: "x", e: "a@b.co", l: "en", p: "jelly_list" })}`, { waitUntil: "networkidle" });
ok("jelly box: double opt-in token cannot open the address form", (await page.locator("h1").textContent())?.includes("not valid") ?? false);
const invite = await page.request.post(`${base}/api/jelly-box/invite`, { data: { email: "a@b.co", submissionId: "x" } });
ok("jelly box: invite endpoint disabled without ADMIN_API_KEY", invite.status() === 404, String(invite.status()));

// ── Talent filters ──
await page.goto(`${base}/talent`, { waitUntil: "networkidle" });
const count = async () => page.locator("main ul li article").count();
const all = await count();
await page.selectOption("#f-seniority", "lead");
await page.waitForTimeout(400);
ok("seniority filter narrows results + syncs URL", (await count()) < all && page.url().includes("seniority=lead"), `${all} → ${await count()}`);
await page.selectOption("#f-stack", "Magento");
await page.waitForTimeout(400);
ok("impossible combo → empty state", await page.getByText("Nothing matching today? The bench moves.").isVisible());
await page.getByRole("button", { name: "Reset filters" }).click();
await page.waitForTimeout(400);
ok("reset restores all profiles", (await count()) === all);

// ── Insights ──
await page.goto(`${base}/insights`, { waitUntil: "networkidle" });
ok("insights lists sample article in dev", (await page.getByText("Sample article — placeholder").count()) > 0);
await page.getByRole("link", { name: /Sample article/ }).first().click();
await page.waitForURL("**/insights/sample-article-template");
ok("article page renders with one H1 + Article JSON-LD", (await page.locator("h1").count()) === 1 && (await page.locator('script[type="application/ld+json"]').allTextContents()).some((s) => s.includes('"Article"')));

// ── PL parity ──
await page.goto(`${base}/pl/contact`, { waitUntil: "networkidle" });
ok("PL contact form localised", await page.getByRole("button", { name: "WYŚLIJ SYGNAŁ" }).isVisible());

ok("no client errors during run", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
await writeFile(".qa/e2e.json", JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
