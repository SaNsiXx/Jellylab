// Shared Zod schemas — the SAME schema validates in the browser (React Hook Form) and on the server
// (app/api/forms/[type]/route.ts). Error messages are i18n keys under forms.errors.*.
import { z } from "zod";

export const NEEDS = ["frontend", "backend", "devops_cloud", "data_ai", "qa", "ecommerce", "dedicated_team", "not_sure"] as const;
export const TIMELINE = ["immediately", "2_4_weeks", "1_3_months", "exploring"] as const;
export const INTEREST = ["jelly_drop", "jelly_signal", "both"] as const;
export const PREFERRED_CONTACT = ["email", "phone"] as const;
export const WORK_MODEL = ["remote", "hybrid", "onsite"] as const;
export const MAIN_ROLE = ["frontend", "backend", "fullstack", "mobile", "devops_cloud", "data_ai", "qa", "ecommerce", "tech_lead", "other"] as const;
export const DEV_SENIORITY = ["junior", "mid", "senior", "lead", "architect"] as const;
export const ENGLISH = ["b1", "b2", "c1", "c2"] as const;
export const DEV_AVAILABILITY = ["immediate", "2_weeks", "1_month", "later", "other"] as const;
export const CONTRACT_TYPE = ["b2b", "employment", "open"] as const;

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

const required = (max = 200) => z.string({ error: "required" }).trim().min(1, { error: "required" }).max(max, { error: "tooLong" });
const optional = (max = 200) => z.string({ error: "required" }).trim().max(max, { error: "tooLong" });
const email = z.string({ error: "required" }).trim().min(1, { error: "required" }).max(254, { error: "tooLong" }).pipe(z.email({ error: "email" }));
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const phoneOptional = optional(32).refine((v) => v === "" || PHONE_RE.test(v), { error: "phone" });
const phoneRequired = required(32).refine((v) => PHONE_RE.test(v), { error: "phone" });
const choice = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values, { error: "required" });

/** Phone must be present when the person picked phone contact or phone marketing consent. */
function phoneWhenNeeded(v: { phone: string; preferredContact?: string; consentPhone?: boolean }, ctx: z.RefinementCtx) {
  if (!v.phone && (v.preferredContact === "phone" || v.consentPhone)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "phoneRequired" });
  }
}

/* 1 — Jelly List / Jelly Drop (B2B). Email consent IS required here: the newsletter is the service. */
export const jellyListSchema = z
  .object({
    firstName: required(80),
    lastName: required(80),
    company: required(120),
    role: required(120),
    email,
    phone: phoneOptional,
    needs: z.array(z.enum(NEEDS), { error: "minItems" }).min(1, { error: "minItems" }),
    timeline: choice(TIMELINE),
    interest: choice(INTEREST),
    preferredContact: choice(PREFERRED_CONTACT),
    consentEmail: z.literal(true, { error: "consentRequired" }),
    consentPhone: z.boolean({ error: "required" }),
  })
  .superRefine(phoneWhenNeeded);

/* 2 — Build Your Crew (client request). Marketing consent is NOT a condition of sending. */
export const crewSchema = z
  .object({
    fullName: required(120),
    company: required(120),
    email,
    phone: phoneOptional,
    /** Roles, headcount, stack, start, duration, model, budget — in the client's own words. */
    needs: z.string({ error: "required" }).trim().min(10, { error: "tooShort" }).max(4000, { error: "tooLong" }),
    preferredContact: choice(PREFERRED_CONTACT),
    consentEmail: z.boolean({ error: "required" }),
    consentPhone: z.boolean({ error: "required" }),
  })
  .superRefine(phoneWhenNeeded);

/* 3 — General contact. */
export const contactSchema = z
  .object({
    fullName: required(120),
    email,
    company: optional(120),
    phone: phoneOptional,
    message: z.string({ error: "required" }).trim().min(10, { error: "tooShort" }).max(4000, { error: "tooLong" }),
    consentEmail: z.boolean({ error: "required" }),
    consentPhone: z.boolean({ error: "required" }),
  })
  .superRefine(phoneWhenNeeded);

/* 4 — Join Jelly Crew (candidate). Kept completely separate from B2B forms. */
export const candidateSchema = z
  .object({
    fullName: required(120),
    email,
    phone: phoneRequired,
    location: required(120),
    linkedin: optional(300).refine((v) => v === "" || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/]+\/?$/i.test(v), { error: "linkedin" }),
    hasCv: z.boolean({ error: "required" }),
    mainRole: choice(MAIN_ROLE),
    seniority: choice(DEV_SENIORITY),
    english: choice(ENGLISH),
    availability: choice(DEV_AVAILABILITY),
    rate: optional(120),
    contractType: choice(CONTRACT_TYPE),
    /** Set when applying from /careers (offer id); empty for a general Jelly Crew application. */
    offerId: optional(80).refine((v) => v === "" || /^[a-z0-9-]+$/.test(v), { error: "required" }),
    consentRecruitment: z.literal(true, { error: "consentRequired" }),
    consentFuture: z.boolean({ error: "required" }),
  })
  .superRefine((v, ctx) => {
    if (!v.linkedin && !v.hasCv) ctx.addIssue({ code: "custom", path: ["linkedin"], message: "linkedinOrCv" });
  });

/* Metadata sent with every form (never shown to the user). */
const utm = optional(200);
export const attributionSchema = z
  .object({
    utmSource: utm,
    utmMedium: utm,
    utmCampaign: utm,
    utmContent: utm,
    utmTerm: utm,
    referrer: optional(500),
    landingPage: optional(500),
    firstSeenAt: optional(40),
  })
  .partial();

export const metaSchema = z.object({
  locale: z.enum(["en", "pl"]),
  startedAt: z.number().int().nonnegative(),
  website: z.string().max(200).optional(), // honeypot — must stay empty
  attribution: attributionSchema.optional(),
  pageUrl: optional(500).optional(),
});

export const FORM_SCHEMAS = {
  "jelly-list": jellyListSchema,
  crew: crewSchema,
  contact: contactSchema,
  candidate: candidateSchema,
} as const;

export type FormType = keyof typeof FORM_SCHEMAS;
export type FormMeta = z.infer<typeof metaSchema>;
export type JellyListInput = z.input<typeof jellyListSchema>;
export type CrewInput = z.input<typeof crewSchema>;
export type ContactInput = z.input<typeof contactSchema>;
export type CandidateInput = z.input<typeof candidateSchema>;

export const isFormType = (v: string): v is FormType => v in FORM_SCHEMAS;

/** Flattens Zod issues to { fieldName: errorKey } (first error per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    // Only i18n keys go to the client; anything else (Zod defaults) collapses to "required".
    if (!out[key]) out[key] = /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "required";
  }
  return out;
}
