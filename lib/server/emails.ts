import "server-only";
import { getTranslations } from "next-intl/server";
import type { DoiEmail, EmailAttachment, OutgoingEmail } from "@/lib/adapters/mailing";
import type { SubmissionRecord } from "@/lib/adapters/crm/types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type BrandEmail = { locale: "en" | "pl"; heading: string; body: string; button: string; url: string; note: string; footer: string };

/** Minimal, client-safe HTML email (tables + inline styles), dark brand look with a light-mode-safe button. */
function renderBrandEmail(e: BrandEmail) {
  const html = `<!doctype html><html lang="${e.locale}"><body style="margin:0;background:#07080D;font-family:Arial,Helvetica,sans-serif;color:#F7F8FC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07080D;padding:40px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#10131C;border:1px solid #2a2f3d;border-radius:24px;padding:40px">
<tr><td style="font-size:13px;letter-spacing:4px;color:#13C8FF;text-transform:uppercase">Jelly Labs</td></tr>
<tr><td style="padding-top:24px;font-size:32px;font-weight:bold;line-height:1.15">${esc(e.heading)}</td></tr>
<tr><td style="padding-top:16px;font-size:16px;line-height:1.6;color:#A9AFBF">${esc(e.body)}</td></tr>
<tr><td style="padding-top:32px"><a href="${esc(e.url)}" style="display:inline-block;background:#8DFF45;color:#07080D;text-decoration:none;font-weight:bold;letter-spacing:2px;text-transform:uppercase;font-size:13px;padding:16px 28px;border-radius:999px">${esc(e.button)}</a></td></tr>
<tr><td style="padding-top:28px;font-size:13px;line-height:1.6;color:#A9AFBF">${esc(e.note)}</td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6b7280;border-top:1px solid #2a2f3d">${esc(e.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${e.heading}\n\n${e.body}\n\n${e.url}\n\n${e.note}\n\n${e.footer}`;
  return { html, text };
}

export async function buildDoiEmail(to: string, locale: "en" | "pl", confirmUrl: string): Promise<DoiEmail> {
  const t = await getTranslations({ locale, namespace: "emails" });
  const { html, text } = renderBrandEmail({ locale, heading: t("doiHeading"), body: t("doiBody"), button: t("doiButton"), url: confirmUrl, note: t("doiIgnore"), footer: t("doiFooter") });
  return { to, locale, confirmUrl, subject: t("doiSubject"), html, text };
}

const FORM_LABEL: Record<SubmissionRecord["formType"], string> = {
  crew: "Zapytanie o specjalistów",
  contact: "Pytanie ogólne",
  "jelly-list": "Zapis na Jelly List",
  candidate: "Kandydat — Jelly Crew",
};

const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "tak" : "nie") : String(v ?? ""));

/** Internal notification to the Jelly Labs inbox (plain table, Reply-To = the person who submitted). */
export function buildSubmissionNotification(to: string, r: SubmissionRecord, attachments?: EmailAttachment[]): OutgoingEmail {
  const rows: [string, string][] = [
    ["Imię i nazwisko", r.person.name],
    ["E-mail", r.person.email],
    ["Telefon", r.person.phone ?? ""],
    ["Firma", r.person.company ?? ""],
    ["Stanowisko", r.person.role ?? ""],
    ...Object.entries(r.data).map(([k, v]): [string, string] => [k, show(v)]),
    ...r.consents.map((c): [string, string] => [`zgoda: ${c.key}`, c.granted ? "TAK" : "nie"]),
    ["CV", attachments?.length ? "w załączniku" : (r.cvRef ?? "")],
    ["Język strony", r.locale.toUpperCase()],
    ["Strona", r.pageUrl ?? ""],
    ...Object.entries(r.attribution).map(([k, v]): [string, string] => [k, show(v)]),
    ["Darmowa domena e-mail", r.flags.freeEmailDomain ? "tak" : "nie"],
    ["ID zgłoszenia", r.id],
    ["Wysłano", r.submittedAt],
  ].filter(([, v]) => v !== "") as [string, string][];

  const who = r.person.company ? `${r.person.name} (${r.person.company})` : r.person.name;
  const subject = `[Jelly Labs] ${FORM_LABEL[r.formType]}: ${who}`;
  const html = `<!doctype html><html lang="pl"><body style="font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px">
<h2 style="margin:0 0 16px">${esc(FORM_LABEL[r.formType])}</h2>
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;max-width:720px">
${rows.map(([k, v]) => `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd;color:#555;font-weight:normal;white-space:nowrap">${esc(k)}</th><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${esc(v)}</td></tr>`).join("\n")}
</table>
<p style="color:#777;font-size:12px;margin-top:16px">Odpowiedz na tę wiadomość, aby napisać bezpośrednio do zgłaszającego.</p>
</body></html>`;
  const text = `${FORM_LABEL[r.formType]}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  return { to, subject, html, text, tag: `submission-${r.formType}`, replyTo: r.person.email, attachments };
}
