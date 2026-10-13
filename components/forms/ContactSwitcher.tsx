"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CrewForm } from "./CrewForm";
import { ContactForm } from "./ContactForm";
import { FormBoundary } from "./ui";

/** Two separate forms (Build Your Crew vs. general contact) behind an accessible segmented control. */
export function ContactSwitcher() {
  const t = useTranslations("contactPage.tabs");
  const te = useTranslations("forms.errors");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const form = params.get("form") === "contact" ? "contact" : "crew";
  const profile = (params.get("profile") ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);

  const select = (value: "crew" | "contact") => {
    const next = new URLSearchParams(params.toString());
    next.set("form", value);
    if (value === "contact") next.delete("profile");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div>
      <fieldset>
        <legend className="eyebrow">{t("label")}</legend>
        <div className="mt-4 inline-flex rounded-full border border-line p-1">
          {(["crew", "contact"] as const).map((v) => (
            <label
              key={v}
              className="flex min-h-11 cursor-pointer items-center rounded-full px-5 text-sm font-medium transition-colors has-[:checked]:bg-white/10 has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus text-muted hover:text-fg"
            >
              <input type="radio" name="form-kind" value={v} checked={form === v} onChange={() => select(v)} className="sr-only" />
              {t(v)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-10">
        <FormBoundary fallback={<p role="alert">{te("server")}</p>}>
          {form === "crew" ? <CrewForm key={`crew-${profile}`} profileId={profile} /> : <ContactForm key="contact" />}
        </FormBoundary>
      </div>
    </div>
  );
}
