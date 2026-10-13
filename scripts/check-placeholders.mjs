// Pre-build guard (runs in `npm run build` via prebuild).
// Production deploys (DEPLOY_ENV=production or VERCEL_ENV=production) FAIL while placeholders remain.
// Every other build prints a loud warning listing what is still missing.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProdDeploy = process.env.DEPLOY_ENV === "production" || process.env.VERCEL_ENV === "production";
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
// 4. Talent data source must not be the mock in production
if ((process.env.TALENT_SOURCE ?? "mock") === "mock") issues.push("TALENT_SOURCE=mock — sample profiles would be published");
// 5. Required production configuration
const need = {
  NEXT_PUBLIC_SITE_URL: "canonical URLs / sitemap / emails",
  DOI_SECRET: "signing double opt-in links",
};
for (const [k, why] of Object.entries(need)) if (!process.env[k]) issues.push(`env ${k} missing (${why})`);
if ((process.env.CRM_PROVIDER ?? "console") === "console") issues.push("CRM_PROVIDER=console — leads would only be logged");
if ((process.env.MAIL_PROVIDER ?? "console") === "console") issues.push("MAIL_PROVIDER=console — double opt-in emails would not be sent");
if ((process.env.RATE_LIMIT_PROVIDER ?? "memory") === "memory") issues.push("RATE_LIMIT_PROVIDER=memory — not effective on serverless");

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
