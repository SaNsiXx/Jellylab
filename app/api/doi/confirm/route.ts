import { NextResponse } from "next/server";
import { verifyDoiToken } from "@/lib/server/doi";
import { getCrm } from "@/lib/adapters/crm";
import { getMailer } from "@/lib/adapters/mailing";
import { getRateLimiter } from "@/lib/adapters/ratelimit";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Explicit POST from the /jelly-list/confirm page (never GET) so link scanners can't auto-confirm. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await getRateLimiter().hit(`doi:${ip}`, 20, 600))) return json({ ok: false, error: "rateLimited" }, 429);

  let token = "";
  try {
    token = String(((await req.json()) as { t?: unknown }).t ?? "");
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }
  const payload = verifyDoiToken(token);
  if (!payload) return json({ ok: false, error: "invalid" }, 400);

  try {
    const confirmedAt = new Date().toISOString();
    await getCrm().confirmEmail({ submissionId: payload.id, email: payload.e, confirmedAt, purpose: payload.p });
    await getMailer().subscribe({ email: payload.e, locale: payload.l, purpose: payload.p, interest: payload.i });
    return json({ ok: true, purpose: payload.p });
  } catch (e) {
    console.error(`[doi] ${payload.id} failed:`, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 502);
  }
}
