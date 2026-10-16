"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { jellyListSchema, NEEDS, TIMELINE, INTEREST, PREFERRED_CONTACT } from "@/lib/forms/schemas";
import { consentText } from "@/lib/forms/consents";
import { track } from "@/lib/analytics/track";
import { TextField, ChoiceGroup, ConsentCheckbox, Honeypot, ErrorSummary } from "./ui";
import { PrivacyNotice, SubmitButton, FormLevelError } from "./FormFooter";
import { useFormSubmit } from "./useFormSubmit";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof jellyListSchema>;
type Out = z.output<typeof jellyListSchema>;

export function JellyListForm() {
  const t = useTranslations("forms");
  const tc = useTranslations("cta");
  const locale = useLocale() as "en" | "pl";
  const router = useRouter();
  const started = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(jellyListSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { firstName: "", lastName: "", company: "", role: "", email: "", phone: "", needs: [], consentPhone: false },
  });
  const { submit, honeypotRef, formError } = useFormSubmit("jelly-list", setError);
  const summary = useErrorSummary(errors);
  const opts = <K extends keyof typeof optionsMap>(k: K) => optionsMap[k].map((v) => ({ value: v, label: t(`options.${k}.${v}` as "options.needs.frontend") }));
  const labels = Object.fromEntries(
    ["firstName", "lastName", "company", "role", "email", "phone", "needs", "timeline", "interest", "preferredContact"].map((k) => [k, t(`fields.${k === "email" ? "businessEmail" : k}` as "fields.email")]),
  );
  labels.consentEmail = t("consents.groupLabel");

  const onValid = async (data: Out) => {
    const r = await submit(data);
    if (!r.ok) return summary.failed();
    track("jelly_list_submit", { interest: data.interest, timeline: data.timeline });
    if (data.interest !== "jelly_drop") track("newsletter_signup", { source: "jelly_list" });
    router.push(r.next ?? "/jelly-list/check-inbox");
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onValid, summary.failed)}
      onFocusCapture={() => {
        if (!started.current) {
          started.current = true;
          track("jelly_list_form_start");
        }
      }}
      className="relative grid gap-6"
    >
      <ErrorSummary errors={summary.list} labels={labels} summaryRef={summary.summaryRef} />
      <Honeypot ref={honeypotRef} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="firstName" label={t("fields.firstName")} required autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
        <TextField id="lastName" label={t("fields.lastName")} required autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        <TextField id="company" label={t("fields.company")} required autoComplete="organization" error={errors.company?.message} {...register("company")} />
        <TextField id="role" label={t("fields.role")} required autoComplete="organization-title" error={errors.role?.message} {...register("role")} />
        <TextField id="email" type="email" label={t("fields.businessEmail")} required autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField id="phone" type="tel" label={t("fields.phone")} autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
      </div>
      <ChoiceGroup id="needs" legend={t("fields.needs")} type="checkbox" required options={opts("needs")} error={errors.needs?.message} inputProps={() => register("needs")} />
      <ChoiceGroup id="timeline" legend={t("fields.timeline")} type="radio" required options={opts("timeline")} error={errors.timeline?.message} inputProps={() => register("timeline")} />
      <ChoiceGroup id="interest" legend={t("fields.interest")} type="radio" required options={opts("interest")} error={errors.interest?.message} inputProps={() => register("interest")} />
      <ChoiceGroup id="preferredContact" legend={t("fields.preferredContact")} type="radio" required options={opts("preferredContact")} error={errors.preferredContact?.message} inputProps={() => register("preferredContact")} />

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">{t("consents.groupLabel")}</legend>
        <ConsentCheckbox id="consentEmail" required text={consentText("marketingEmail", locale)} error={errors.consentEmail?.message} {...register("consentEmail")} />
        <ConsentCheckbox id="consentPhone" text={consentText("phone", locale)} error={errors.consentPhone?.message} {...register("consentPhone")} />
      </fieldset>
      <PrivacyNotice />
      <FormLevelError code={formError} />
      <div>
        <SubmitButton label={tc("joinList")} pending={isSubmitting} />
      </div>
    </form>
  );
}

const optionsMap = { needs: NEEDS, timeline: TIMELINE, interest: INTEREST, preferredContact: PREFERRED_CONTACT } as const;
