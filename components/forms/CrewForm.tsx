"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { crewSchema, PREFERRED_CONTACT } from "@/lib/forms/schemas";
import { consentText } from "@/lib/forms/consents";
import { track } from "@/lib/analytics/track";
import { TextField, TextArea, ChoiceGroup, ConsentCheckbox, Honeypot, ErrorSummary, SuccessPanel } from "./ui";
import { PrivacyNotice, SubmitButton, FormLevelError } from "./FormFooter";
import { useFormSubmit } from "./useFormSubmit";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof crewSchema>;
type Out = z.output<typeof crewSchema>;

/** Client request ("Ask about specialists" / "Build your crew"): one free-text field for who they need. */
export function CrewForm() {
  const t = useTranslations("forms");
  const tc = useTranslations("cta");
  const locale = useLocale() as "en" | "pl";
  const [done, setDone] = useState<{ doi: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(crewSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { fullName: "", company: "", email: "", phone: "", needs: "", consentEmail: false, consentPhone: false },
  });
  const { submit, honeypotRef, formError } = useFormSubmit("crew", setError);
  const summary = useErrorSummary(errors);
  const labels = Object.fromEntries(
    ["fullName", "company", "email", "phone", "needs", "preferredContact"].map((k) => [k, t(`fields.${k === "email" ? "businessEmail" : k === "needs" ? "whoYouNeed" : k}` as "fields.email")]),
  );

  const onValid = async (data: Out) => {
    const r = await submit(data);
    if (!r.ok) return summary.failed();
    track("client_request_submit", { preferred_contact: data.preferredContact });
    setDone({ doi: !!r.doi });
  };

  if (done)
    return (
      <SuccessPanel
        title={t("success.crewTitle")}
        body={t("success.crewBody")}
        extra={done.doi ? t("success.doiNote") : undefined}
        resetLabel={t("success.again")}
        onReset={() => {
          reset();
          setDone(null);
        }}
      />
    );

  return (
    <form noValidate onSubmit={handleSubmit(onValid, summary.failed)} className="relative grid gap-6">
      <ErrorSummary errors={summary.list} labels={labels} summaryRef={summary.summaryRef} />
      <Honeypot ref={honeypotRef} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="fullName" label={t("fields.fullName")} required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <TextField id="company" label={t("fields.company")} required autoComplete="organization" error={errors.company?.message} {...register("company")} />
        <TextField id="email" type="email" label={t("fields.businessEmail")} required autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField id="phone" type="tel" label={t("fields.phone")} autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
      </div>
      <TextArea id="needs" label={t("fields.whoYouNeed")} placeholder={t("hints.whoYouNeed")} required rows={6} error={errors.needs?.message} {...register("needs")} />
      <ChoiceGroup
        id="preferredContact"
        legend={t("fields.preferredContact")}
        type="radio"
        required
        options={PREFERRED_CONTACT.map((v) => ({ value: v, label: t(`options.preferredContact.${v}`) }))}
        error={errors.preferredContact?.message}
        inputProps={() => register("preferredContact")}
      />

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">{t("consents.groupLabel")}</legend>
        <p className="text-sm text-muted">{t("consents.marketingOptionalNote")}</p>
        <ConsentCheckbox id="consentEmail" text={consentText("marketingEmail", locale)} {...register("consentEmail")} />
        <ConsentCheckbox id="consentPhone" text={consentText("phone", locale)} {...register("consentPhone")} />
      </fieldset>
      <PrivacyNotice />
      <FormLevelError code={formError} />
      <div>
        <SubmitButton label={tc("sendSignal")} pending={isSubmitting} />
      </div>
    </form>
  );
}
