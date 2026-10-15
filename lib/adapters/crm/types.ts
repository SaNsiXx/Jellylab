import type { ConsentRecord } from "@/lib/forms/consents";
import type { FormType } from "@/lib/forms/schemas";

/** Everything stored for one submission (05_FORMS_LEGAL_CRM.md §5). IP is deliberately NOT stored. */
export type SubmissionRecord = {
  id: string;
  formType: FormType;
  submittedAt: string; // ISO, UTC
  locale: "en" | "pl";
  source: "website";
  pageUrl?: string;
  attribution: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    referrer?: string;
    landingPage?: string;
    firstSeenAt?: string;
  };
  privacyNoticeVersion: string;
  /** Kept separate from the request data so marketing consent never conditions the service request. */
  consents: ConsentRecord[];
  person: { name: string; email: string; phone?: string; company?: string; role?: string };
  /** Form-specific payload (needs, stack, description, …). */
  data: Record<string, unknown>;
  flags: { freeEmailDomain: boolean; doiRequested: boolean };
  /** Candidate only: reference to stored CV (never the file itself). */
  cvRef?: string;
};

export interface CrmAdapter {
  readonly name: string;
  createLead(record: SubmissionRecord): Promise<{ crmId?: string }>;
  createCandidate(record: SubmissionRecord): Promise<{ crmId?: string }>;
  /** Marks marketing_email_confirmed=true after double opt-in. */
  confirmEmail(input: { submissionId: string; email: string; confirmedAt: string; purpose: string }): Promise<void>;
  /** Jelly Box status only — the address itself never goes to the CRM. */
  updateJellyBoxStatus(input: { submissionId: string; email: string; status: "invited" | "address_received"; at: string }): Promise<void>;
}
