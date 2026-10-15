import "server-only";
import { getTranslations } from "next-intl/server";
import type { DoiEmail, OutgoingEmail } from "@/lib/adapters/mailing";

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

/** Jelly Box invitation: link to the separate delivery-address form (only after DOI + qualification). */
export async function buildJellyBoxInviteEmail(to: string, locale: "en" | "pl", url: string): Promise<OutgoingEmail> {
  const t = await getTranslations({ locale, namespace: "emails" });
  const { html, text } = renderBrandEmail({ locale, heading: t("boxHeading"), body: t("boxBody"), button: t("boxButton"), url, note: t("boxNote"), footer: t("doiFooter") });
  return { to, subject: t("boxSubject"), html, text, tag: "jelly_box_invite", logUrl: url };
}
