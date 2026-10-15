import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createJellyBoxToken } from "@/lib/server/doi";
import { buildJellyBoxInviteEmail } from "@/lib/server/emails";
import { getMailer } from "@/lib/adapters/mailing";
import { getCrm } from "@/lib/adapters/crm";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const schema = z.object({
  email: z.email(),
  submissionId: z.string().min(1).max(100),
  locale: z.enum(["en", "pl"]).default("en"),
  /** true → also email the invitation; false → only return the link (e.g. to paste into a CRM email). */
  send: z.boolean().default(false),
});

function authorized(req: Request) {
  if (!env.adminApiKey) return false;
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(env.adminApiKey);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Issues a Jelly Box delivery-address invitation for a qualified B2B contact.
 * Call from sales tooling or a CRM automation ("Jelly Box approved"). Disabled unless ADMIN_API_KEY is set.
 *   curl -X POST https://jellylabs.com/api/jelly-box/invite -H "Authorization: Bearer $ADMIN_API_KEY" \
 *        -H "Content-Type: application/json" -d '{"email":"cto@acme.com","submissionId":"…","locale":"pl","send":true}'
 */
export async function POST(req: Request) {
  if (!env.adminApiKey) return json({ ok: false, error: "notFound" }, 404);
  if (!authorized(req)) return json({ ok: false, error: "unauthorized" }, 401);
  if (!env.jellyBoxActive) return json({ ok: false, error: "closed" }, 410);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "invalid" }, 400);
  const { email, submissionId, locale, send } = parsed.data;

  const origin = env.siteUrl ?? new URL(req.url).origin;
  const url = `${origin}${locale === "en" ? "" : `/${locale}`}/jelly-box/address?t=${encodeURIComponent(createJellyBoxToken({ id: submissionId, e: email, l: locale }))}`;

  try {
    if (send) await getMailer().sendEmail(await buildJellyBoxInviteEmail(email, locale, url));
    await getCrm().updateJellyBoxStatus({ submissionId, email, status: "invited", at: new Date().toISOString() });
    return json({ ok: true, url, sent: send });
  } catch (e) {
    console.error(`[jelly-box:invite] ${submissionId} failed:`, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 502);
  }
}
