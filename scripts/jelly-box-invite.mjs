// Generates a Jelly Box delivery-address invitation link for a qualified B2B contact (no API call needed).
// Usage: node scripts/jelly-box-invite.mjs --email cto@acme.com --id <submissionId> [--locale pl] [--base https://jellylabs.com]
// Signs with DOI_SECRET from the environment (or .env.local); the format matches lib/server/doi.ts.
import { createHmac } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
if (!process.env.DOI_SECRET && existsSync(".env.local")) {
  const m = readFileSync(".env.local", "utf8").match(/^DOI_SECRET=(.+)$/m);
  if (m) process.env.DOI_SECRET = m[1].trim();
}
const email = arg("email");
const id = arg("id");
const locale = arg("locale", "en");
const base = arg("base", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
if (!email || !id || !["en", "pl"].includes(locale)) {
  console.error("Usage: node scripts/jelly-box-invite.mjs --email <email> --id <submissionId> [--locale en|pl] [--base <url>]");
  process.exit(1);
}
const secret = process.env.DOI_SECRET ?? "dev-only-doi-secret-change-me";
if (!process.env.DOI_SECRET) console.warn("⚠ DOI_SECRET not set — using the dev secret (works only on local/preview deployments).");
const body = Buffer.from(JSON.stringify({ id, e: email, l: locale, p: "jelly_box", x: Math.floor(Date.now() / 1000) + 14 * 24 * 3600 })).toString("base64url");
const token = `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
console.log(`${base}${locale === "en" ? "" : `/${locale}`}/jelly-box/address?t=${encodeURIComponent(token)}`);
