import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FORM_SCHEMAS, isFormType, metaSchema, fieldErrors, type FormType, type FormMeta } from "@/lib/forms/schemas";
import { CONSENT_VERSIONS, consentRecord, type ConsentRecord } from "@/lib/forms/consents";
import { getCrm } from "@/lib/adapters/crm";
import type { SubmissionRecord } from "@/lib/adapters/crm/types";
import { getMailer, type DoiPurpose } from "@/lib/adapters/mailing";
import { getRateLimiter } from "@/lib/adapters/ratelimit";
import { getCvStorage, InvalidFileError, StorageUnavailableError } from "@/lib/adapters/storage";
import { createDoiToken } from "@/lib/server/doi";
import { buildDoiEmail } from "@/lib/server/emails";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const FREE_DOMAINS = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com", "wp.pl", "o2.pl", "onet.pl", "interia.pl", "op.pl", "gmx.de", "gmx.net", "web.de"]);
const MIN_FILL_MS = 2000;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const localePath = (locale: string, path: string) => (locale === "en" ? path : `/${locale}${path}`);

function clientKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  // Hashed and used only as an in-flight rate-limit key; never stored with the submission.
  return createHash("sha256").update(`${ip}|${process.env.DOI_SECRET ?? ""}`).digest("hex").slice(0, 24);
}

async function readBody(req: Request): Promise<{ data: unknown; meta: unknown; cv?: File }> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const fd = await req.formData();
    const payload = JSON.parse(String(fd.get("payload") ?? "{}")) as { data?: unknown; meta?: unknown };
    const cv = fd.get("cv");
    return { data: payload.data, meta: payload.meta, cv: cv instanceof File && cv.size > 0 ? cv : undefined };
  }
  const payload = (await req.json()) as { data?: unknown; meta?: unknown };
  return { data: payload.data, meta: payload.meta };
}

export async function POST(req: Request, ctx: RouteContext<"/api/forms/[type]">) {
  const { type } = await ctx.params;
  if (!isFormType(type)) return json({ ok: false, error: "notFound" }, 404);

  let body: Awaited<ReturnType<typeof readBody>>;
  try {
    body = await readBody(req);
  } catch {
    return json({ ok: false, error: "server" }, 400);
  }

  const meta = metaSchema.safeParse(body.meta);
  if (!meta.success) return json({ ok: false, error: "server" }, 400);
  const nextUrl = type === "jelly-list" ? localePath(meta.data.locale, "/jelly-list/check-inbox") : undefined;

  // Honeypot / too-fast submit: pretend success so bots learn nothing, but process nothing.
  if (meta.data.website || Date.now() - meta.data.startedAt < MIN_FILL_MS) return json({ ok: true, next: nextUrl });

  if (!(await getRateLimiter().hit(`form:${type}:${clientKey(req)}`, 5, 600))) return json({ ok: false, error: "rateLimited" }, 429);

  const raw = type === "candidate" && body.data && typeof body.data === "object" ? { ...body.data, hasCv: !!body.cv } : body.data;
  const parsed = FORM_SCHEMAS[type].safeParse(raw);
  if (!parsed.success) return json({ ok: false, fieldErrors: fieldErrors(parsed.error) }, 422);

  const id = randomUUID();
  const record = buildRecord(id, type, parsed.data as Record<string, unknown>, meta.data);
  const doi = doiPurpose(type, record);
  record.flags.doiRequested = !!doi;

  try {
    if (type === "candidate") {
      if (body.cv) {
        try {
          record.cvRef = await getCvStorage().save(body.cv, id);
        } catch (e) {
          if (e instanceof InvalidFileError) return json({ ok: false, fieldErrors: { cv: e.reason } }, 422);
          if (e instanceof StorageUnavailableError) return json({ ok: false, fieldErrors: { cv: "cvUnavailable" } }, 422);
          throw e;
        }
      }
      await getCrm().createCandidate(record);
    } else {
      await getCrm().createLead(record);
    }

    if (doi) {
      const origin = env.siteUrl ?? new URL(req.url).origin;
      const token = createDoiToken({ id, e: record.person.email, l: record.locale, p: doi, i: String(record.data.interest ?? "") || undefined });
      const confirmUrl = `${origin}${localePath(record.locale, "/jelly-list/confirm")}?t=${encodeURIComponent(token)}`;
      await getMailer().sendDoubleOptIn(await buildDoiEmail(record.person.email, record.locale, confirmUrl));
    }
    return json({ ok: true, id, next: nextUrl, doi: !!doi });
  } catch (e) {
    // Log the failure without personal data.
    console.error(`[forms] ${type} ${id} failed:`, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 502);
  }
}

function doiPurpose(type: FormType, r: SubmissionRecord): DoiPurpose | null {
  if (type === "jelly-list") return "jelly_list";
  if ((type === "crew" || type === "contact") && r.consents.some((c) => c.key === "marketingEmail" && c.granted)) return "marketing";
  return null;
}

function buildRecord(id: string, type: FormType, d: Record<string, unknown>, meta: FormMeta): SubmissionRecord {
  const s = (k: string) => (typeof d[k] === "string" && d[k] !== "" ? (d[k] as string) : undefined);
  const locale = meta.locale;
  const consents: ConsentRecord[] =
    type === "candidate"
      ? [consentRecord("recruitment", d.consentRecruitment === true, locale), consentRecord("futureOffers", d.consentFuture === true, locale)]
      : [consentRecord("marketingEmail", d.consentEmail === true, locale), consentRecord("phone", d.consentPhone === true, locale)];

  const name = s("fullName") ?? [s("firstName"), s("lastName")].filter(Boolean).join(" ");
  const email = String(d.email);
  // Request data is stored separately from consents.
  const data = Object.fromEntries(
    Object.entries(d).filter(([k]) => !k.startsWith("consent") && !["fullName", "firstName", "lastName", "email", "phone", "company", "role", "hasCv"].includes(k)),
  );

  return {
    id,
    formType: type,
    submittedAt: new Date().toISOString(),
    locale,
    source: "website",
    pageUrl: meta.pageUrl,
    attribution: meta.attribution ?? {},
    privacyNoticeVersion: CONSENT_VERSIONS.privacyNotice,
    consents,
    person: { name, email, phone: s("phone"), company: s("company"), role: s("role") },
    data,
    flags: { freeEmailDomain: FREE_DOMAINS.has(email.split("@")[1]?.toLowerCase() ?? ""), doiRequested: false },
  };
}
