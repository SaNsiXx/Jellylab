"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/site";
import { controllerWithAddress } from "@/lib/forms/consents";
import { buttonClass, Arrow } from "@/components/ui/Button";

export function PrivacyNotice() {
  const t = useTranslations("forms.consents");
  const locale = useLocale() as "en" | "pl";
  return (
    <p className="text-xs leading-relaxed text-muted">
      {t("notice", { controller: controllerWithAddress(locale) })}{" "}
      <Link href={routes.privacy} className="text-fg underline underline-offset-4 hover:text-cyan">
        {t("privacyLink")}
      </Link>
    </p>
  );
}

export function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  const t = useTranslations("forms");
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClass("primary", "w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto")}>
      <span>{pending ? t("submitting") : label}</span>
      {!pending && <Arrow />}
    </button>
  );
}

export function FormLevelError({ code }: { code: string | null }) {
  const t = useTranslations("forms.errors");
  if (!code) return null;
  return (
    <p role="alert" className="rounded-2xl border border-[#ff6b78]/60 bg-[#ff4d5e]/10 p-4 text-sm">
      {t.has(code as "server") ? t(code as "server") : t("server")}
    </p>
  );
}
