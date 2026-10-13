"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/site";
import { buttonClass, Arrow, ButtonLink } from "@/components/ui/Button";
import { StatusScreen } from "./StatusScreen";

export const DOI_FLAG = "jl-doi-ok";

/** Double opt-in step 2: the visitor presses a button (POST) — opening the link alone never confirms. */
export function ConfirmEmail() {
  const t = useTranslations("jellyListPage");
  const tc = useTranslations("cta");
  const te = useTranslations("forms.errors");
  const token = useSearchParams().get("t") ?? "";
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "invalid" | "error">(token ? "idle" : "invalid");

  async function confirm() {
    setState("pending");
    try {
      const res = await fetch("/api/doi/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; purpose?: string };
      if (body.ok) {
        try {
          sessionStorage.setItem(DOI_FLAG, body.purpose ?? "jelly_list");
        } catch {}
        router.replace("/jelly-list/confirmed");
        return;
      }
      setState(body.error === "invalid" ? "invalid" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "invalid")
    return (
      <StatusScreen variant="error" title={t("invalidTitle")} body={t("invalidBody")}>
        <ButtonLink href={routes.jellyList} arrow>
          {tc("joinList")}
        </ButtonLink>
      </StatusScreen>
    );

  return (
    <StatusScreen variant="mail" title={t("confirmTitle")} body={t("confirmBody")} hint={state === "error" ? te("server") : undefined}>
      <button type="button" onClick={confirm} disabled={state === "pending"} className={buttonClass("primary", "disabled:cursor-wait disabled:opacity-70")}>
        <span>{t("confirmButton")}</span>
        <Arrow />
      </button>
    </StatusScreen>
  );
}
