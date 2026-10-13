import "server-only";
import { getTranslations } from "next-intl/server";
import type { DoiEmail } from "@/lib/adapters/mailing";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Minimal, client-safe HTML email (tables + inline styles), dark brand look with a light-mode-safe button. */
export async function buildDoiEmail(to: string, locale: "en" | "pl", confirmUrl: string): Promise<DoiEmail> {
  const t = await getTranslations({ locale, namespace: "emails" });
  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:#07080D;font-family:Arial,Helvetica,sans-serif;color:#F7F8FC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07080D;padding:40px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#10131C;border:1px solid #2a2f3d;border-radius:24px;padding:40px">
<tr><td style="font-size:13px;letter-spacing:4px;color:#13C8FF;text-transform:uppercase">Jelly Labs</td></tr>
<tr><td style="padding-top:24px;font-size:32px;font-weight:bold;line-height:1.15">${esc(t("doiHeading"))}</td></tr>
<tr><td style="padding-top:16px;font-size:16px;line-height:1.6;color:#A9AFBF">${esc(t("doiBody"))}</td></tr>
<tr><td style="padding-top:32px"><a href="${esc(confirmUrl)}" style="display:inline-block;background:#8DFF45;color:#07080D;text-decoration:none;font-weight:bold;letter-spacing:2px;text-transform:uppercase;font-size:13px;padding:16px 28px;border-radius:999px">${esc(t("doiButton"))}</a></td></tr>
<tr><td style="padding-top:28px;font-size:13px;line-height:1.6;color:#A9AFBF">${esc(t("doiIgnore"))}</td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6b7280;border-top:1px solid #2a2f3d">${esc(t("doiFooter"))}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${t("doiHeading")}\n\n${t("doiBody")}\n\n${confirmUrl}\n\n${t("doiIgnore")}\n\n${t("doiFooter")}`;
  return { to, locale, confirmUrl, subject: t("doiSubject"), html, text };
}
