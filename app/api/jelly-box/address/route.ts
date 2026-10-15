import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jellyBoxAddressSchema, fieldErrors } from "@/lib/forms/schemas";
import { CONSENT_VERSIONS } from "@/lib/forms/consents";
import { verifyJellyBoxToken } from "@/lib/server/doi";
import { getShippingStore } from "@/lib/adapters/shipping";
import { getCrm } from "@/lib/adapters/crm";
import { getRateLimiter } from "@/lib/adapters/ratelimit";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const bodySchema = z.object({
  t: z.string().max(2000),
  data: z.unknown(),
  meta: z.object({ startedAt: z.number().int().nonnegative(), website: z.string().max(200).optional() }),
});

/** Jelly Box delivery address. Identity comes ONLY from the signed invitation token, never from the form. */
export async function POST(req: Request) {
  if (!env.jellyBoxActive) return json({ ok: false, error: "closed" }, 410);

  const parsedBody = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return json({ ok: false, error: "server" }, 400);
  const { t, data, meta } = parsedBody.data;

  const token = verifyJellyBoxToken(t);
  if (!token) return json({ ok: false, error: "invalid" }, 400);

  // Honeypot / too-fast submit: pretend success, store nothing.
  if (meta.website || Date.now() - meta.startedAt < 2000) return json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = createHash("sha256").update(`${ip}|${token.id}`).digest("hex").slice(0, 24);
  if (!(await getRateLimiter().hit(`jelly-box:${key}`, 5, 600))) return json({ ok: false, error: "rateLimited" }, 429);

  const parsed = jellyBoxAddressSchema.safeParse(data);
  if (!parsed.success) return json({ ok: false, fieldErrors: fieldErrors(parsed.error) }, 422);

  const receivedAt = new Date().toISOString();
  try {
    const { confirmCompanyAddress: _confirmed, notes, ...address } = parsed.data;
    void _confirmed;
    await getShippingStore().saveAddress({
      ...address,
      notes: notes || undefined,
      country: "PL",
      submissionId: token.id,
      email: token.e,
      locale: token.l,
      receivedAt,
      noticeVersion: CONSENT_VERSIONS.privacyNotice,
    });
    await getCrm().updateJellyBoxStatus({ submissionId: token.id, email: token.e, status: "address_received", at: receivedAt });
    return json({ ok: true });
  } catch (e) {
    console.error(`[jelly-box] ${token.id} failed:`, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 502);
  }
}
