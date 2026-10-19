// Pre-build guard (runs in `npm run build` via prebuild).
// Production deploys (DEPLOY_ENV=production) FAIL while placeholders remain.
// Every other build prints a loud warning listing what is still missing.
import { readFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Explicit opt-in only: Vercel marks every main-branch deploy as VERCEL_ENV=production, including the
// pre-launch preview on *.vercel.app — that must still build. Set DEPLOY_ENV=production on launch day.
const isProdDeploy = process.env.DEPLOY_ENV === "production";
const issues = [];

const scan = async (rel, re, label) => {
  const txt = await readFile(path.join(root, rel), "utf8");
  const hits = txt.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => re.test(l));
  for (const [n] of hits) issues.push(`${rel}:${n}  ${label}`);
};

// 1. Legal entity (company name, address, KRS, NIP, contact email, LinkedIn)
await scan("lib/legal/entity.ts", /:\s*PLACEHOLDER,/, "legal entity value is a placeholder");
// 2. Consent wording versions still marked DRAFT (need legal approval)
await scan("lib/forms/consents.ts", /DRAFT-\d+"/, "consent version still DRAFT");
await scan("lib/analytics/consent.ts", /DRAFT-\d+"/, "cookie consent policy version still DRAFT");
// 3. Legal documents
for (const locale of ["en", "pl"]) {
  for (const f of await readdir(path.join(root, "content/legal", locale))) {
    const rel = `content/legal/${locale}/${f}`;
    const txt = await readFile(path.join(root, rel), "utf8");
    if (/^status:\s*DRAFT/m.test(txt)) issues.push(`${rel}  document status is DRAFT`);
    const n = (txt.match(/DO UZUPEŁNIENIA/g) ?? []).length;
    if (n) issues.push(`${rel}  ${n}× [DO UZUPEŁNIENIA]`);
  }
}
// 4. Required production configuration
const need = {
  NEXT_PUBLIC_SITE_URL: "canonical URLs / sitemap / emails",
  DOI_SECRET: "signing double opt-in links",
};
for (const [k, why] of Object.entries(need)) if (!process.env[k]) issues.push(`env ${k} missing (${why})`);
// Notification inboxes default to legalEntity.contactEmail (office@jellylabs.tech) in lib/server/env.ts.
const notifyLeads = true;
const notifyCandidates = true;
const crmOff = (process.env.CRM_PROVIDER ?? "console") === "console";
if (crmOff && !notifyLeads) issues.push("CRM_PROVIDER=console and no NOTIFY_EMAIL(_LEADS) — client requests would only be logged");
if (crmOff && !notifyCandidates) issues.push("CRM_PROVIDER=console and no NOTIFY_EMAIL(_CANDIDATES) — applications would only be logged");
const mail = process.env.MAIL_PROVIDER ?? "console";
if (mail === "console") issues.push("MAIL_PROVIDER=console — double opt-in and notification emails would not be sent");
if (mail === "smtp" && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) issues.push("MAIL_PROVIDER=smtp but SMTP_USER / SMTP_PASS missing");
if ((process.env.RATE_LIMIT_PROVIDER ?? "memory") === "memory") issues.push("RATE_LIMIT_PROVIDER=memory — not effective on serverless");
if ((process.env.CV_STORAGE_PROVIDER ?? "mock") === "mock" && !notifyCandidates)
  issues.push("CV_STORAGE_PROVIDER=mock and no NOTIFY_EMAIL(_CANDIDATES) — CV uploads are refused on the live site (LinkedIn URL still works)");
// 5. Careers: sample offers are hidden on the live site — warn if nothing real is published.
{
  const dir = path.join(root, "content/careers");
  let files = [];
  try { files = (await readdir(dir)).filter((f) => f.endsWith(".json")); } catch {}
  const real = files.map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8"))).filter((o) => o.published && !o.sample);
  if (!real.length) console.warn("ℹ content/careers has no real published offers — /careers will show the empty state (not blocking).");
}

if (!issues.length) {
  console.log("✓ placeholder check passed");
} else {
  const bar = "━".repeat(72);
  const out = [bar, `${isProdDeploy ? "✖ PRODUCTION BUILD BLOCKED" : "⚠ NOT READY FOR PRODUCTION"} — ${issues.length} unresolved item(s):`, ...issues.map((i) => `  • ${i}`), "See docs/LAUNCH_CHECKLIST.md.", bar].join("\n");
  if (isProdDeploy) {
    console.error(out);
    process.exit(1);
  }
  console.warn(out);
}
