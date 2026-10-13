"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { contactSchema } from "@/lib/forms/schemas";
import { consentText } from "@/lib/forms/consents";
import { track } from "@/lib/analytics/track";
import { TextField, TextArea, ConsentCheckbox, Honeypot, ErrorSummary, SuccessPanel } from "./ui";
import { PrivacyNotice, SubmitButton, FormLevelError } from "./FormFooter";
import { useFormSubmit } from "./useFormSubmit";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof contactSchema>;
type Out = z.output<typeof contactSchema>;

export function ContactForm() {
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
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { fullName: "", email: "", company: "", phone: "", message: "", consentEmail: false, consentPhone: false },
  });
  const { submit, honeypotRef, formError } = useFormSubmit("contact", setError);
  const summary = useErrorSummary(errors);
  const labels = Object.fromEntries(["fullName", "email", "company", "phone", "message"].map((k) => [k, t(`fields.${k}` as "fields.email")]));

  const onValid = async (data: Out) => {
    const r = await submit(data);
    if (!r.ok) return summary.failed();
    track("contact_click", { method: "form" });
    setDone({ doi: !!r.doi });
  };

  if (done)
    return (
      <SuccessPanel
        title={t("success.contactTitle")}
        body={t("success.contactBody")}
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
        <TextField id="email" type="email" label={t("fields.email")} required autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField id="company" label={t("fields.company")} autoComplete="organization" error={errors.company?.message} {...register("company")} />
        <TextField id="phone" type="tel" label={t("fields.phone")} hint={t("hints.phone")} autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
      </div>
      <TextArea id="message" label={t("fields.message")} required error={errors.message?.message} {...register("message")} />
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
