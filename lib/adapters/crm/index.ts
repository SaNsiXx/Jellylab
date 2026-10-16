import "server-only";
import { env } from "@/lib/server/env";
import type { CrmAdapter, SubmissionRecord } from "./types";

const redact = (r: SubmissionRecord) => ({
  id: r.id,
  type: r.formType,
  locale: r.locale,
  consents: r.consents.map((c) => `${c.key}:${c.granted ? "yes" : "no"}@${c.version}`),
  utm: r.attribution.utmSource ?? "-",
  emailDomain: r.person.email.split("@")[1],
});

/** Development adapter: logs a redacted summary (no names/emails in logs) and keeps nothing. */
const consoleCrm: CrmAdapter = {
  name: "console",
  async createLead(r) {
    console.info("[crm:console] lead", redact(r));
    return { crmId: `console-${r.id}` };
  },
  async createCandidate(r) {
    console.info("[crm:console] candidate", redact(r));
    return { crmId: `console-${r.id}` };
  },
  async confirmEmail(i) {
    console.info("[crm:console] email confirmed", { submissionId: i.submissionId, purpose: i.purpose, at: i.confirmedAt });
  },
};

/**
 * Pipedrive (05_FORMS_LEGAL_CRM.md §6): Organization → Person → Lead, with the full structured record
 * (consents with exact text + version, UTM, needs) attached as a note so nothing is lost before custom
 * fields are configured. Candidates are created as Persons with a note — use a dedicated ATS when ready.
 */
function pipedrive(token: string): CrmAdapter {
  const base = "https://api.pipedrive.com/v1";
  async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const res = await fetch(`${base}${path}${path.includes("?") ? "&" : "?"}api_token=${encodeURIComponent(token)}`, {
      method: init.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Pipedrive ${path} → ${res.status}`);
    const json = (await res.json()) as { data: T };
    return json.data;
  }
  const note = (r: SubmissionRecord) =>
    [
      `<b>${r.formType}</b> · ${r.submittedAt} · ${r.locale}`,
      `<pre>${escapeHtml(JSON.stringify({ data: r.data, attribution: r.attribution, consents: r.consents, privacyNoticeVersion: r.privacyNoticeVersion, flags: r.flags, cvRef: r.cvRef }, null, 2))}</pre>`,
    ].join("<br>");

  async function person(r: SubmissionRecord, orgId?: number) {
    return call<{ id: number }>("/persons", {
      method: "POST",
      body: {
        name: r.person.name,
        email: [{ value: r.person.email, primary: true }],
        phone: r.person.phone ? [{ value: r.person.phone, primary: true }] : undefined,
        org_id: orgId,
      },
    });
  }

  async function personIdByEmail(email: string) {
    const found = await call<{ items: { item: { id: number } }[] }>(`/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true`);
    return found.items[0]?.item.id;
  }

  return {
    name: "pipedrive",
    async createLead(r) {
      const org = r.person.company ? await call<{ id: number }>("/organizations", { method: "POST", body: { name: r.person.company } }) : undefined;
      const p = await person(r, org?.id);
      const title = `[website:${r.formType}] ${r.person.company ?? r.person.name}`;
      const lead = await call<{ id: string }>("/leads", { method: "POST", body: { title, person_id: p.id, organization_id: org?.id } });
      await call("/notes", { method: "POST", body: { content: note(r), lead_id: lead.id } });
      return { crmId: lead.id };
    },
    async createCandidate(r) {
      const p = await person(r);
      await call("/notes", { method: "POST", body: { content: note(r), person_id: p.id } });
      return { crmId: String(p.id) };
    },
    async confirmEmail(i) {
      const id = await personIdByEmail(i.email);
      if (!id) return;
      await call("/notes", {
        method: "POST",
        body: { content: `marketing_email_confirmed=true (double opt-in, ${i.purpose}) at ${i.confirmedAt}; submission ${i.submissionId}`, person_id: id },
      });
    },
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export function getCrm(): CrmAdapter {
  if (env.crmProvider === "pipedrive") {
    if (!env.pipedriveToken) throw new Error("CRM_PROVIDER=pipedrive but PIPEDRIVE_API_TOKEN is missing");
    return pipedrive(env.pipedriveToken);
  }
  return consoleCrm;
}
