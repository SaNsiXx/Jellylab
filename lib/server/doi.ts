import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import type { DoiPurpose } from "@/lib/adapters/mailing";

// Stateless, signed tokens: base64url(payload).base64url(HMAC-SHA256), scoped by purpose (`p`).
// Double opt-in links are valid 7 days. Confirmation happens via an explicit button press (POST), never on link open,
// so corporate email link scanners cannot auto-confirm subscriptions.

export type DoiPayload = { id: string; e: string; l: "en" | "pl"; p: DoiPurpose; i?: string; x: number };

const TTL_SECONDS = 7 * 24 * 3600;
const DEV_SECRET = "dev-only-doi-secret-change-me";

function secret() {
  if (env.doiSecret) return env.doiSecret;
  // Required on the live site (also enforced by scripts/check-placeholders.mjs). Previews use console
  // adapters only, so a fixed dev secret is acceptable there.
  if (env.isLive) throw new Error("DOI_SECRET is not set");
  return DEV_SECRET;
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function signPayload(payload: object, ttlSeconds: number): string {
  const body = b64(JSON.stringify({ ...payload, x: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${body}.${sign(body)}`;
}

function verifyPayload<T extends { p: string; x: number }>(token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (typeof payload.x !== "number" || payload.x < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createDoiToken(input: Omit<DoiPayload, "x">): string {
  return signPayload(input, TTL_SECONDS);
}

/** Only double opt-in purposes are accepted. */
export function verifyDoiToken(token: string): DoiPayload | null {
  const p = verifyPayload<DoiPayload>(token);
  return p && (p.p === "jelly_list" || p.p === "marketing") ? p : null;
}
