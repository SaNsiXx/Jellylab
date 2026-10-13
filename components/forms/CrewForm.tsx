"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { crewSchema, CREW_SENIORITY, START_DATE, DURATION, WORK_MODEL, PREFERRED_CONTACT } from "@/lib/forms/schemas";
import { consentText } from "@/lib/forms/consents";
import { track } from "@/lib/analytics/track";
import { TextField, TextArea, SelectField, ChoiceGroup, ConsentCheckbox, Honeypot, ErrorSummary, SuccessPanel } from "./ui";
import { PrivacyNotice, SubmitButton, FormLevelError } from "./FormFooter";
import { useFormSubmit } from "./useFormSubmit";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof crewSchema>;
type Out = z.output<typeof crewSchema>;

const optionsMap = { seniority: CREW_SENIORITY, startDate: START_DATE, duration: DURATION, workModel: WORK_MODEL, preferredContact: PREFERRED_CONTACT } as const;

export function CrewForm({ profileId = "" }: { profileId?: string }) {
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
    defaultValues: { fullName: "", company: "", email: "", phone: "", roles: "", headcount: "", stack: "", budget: "", description: "", profileId, consentEmail: false, consentPhone: false },
  });
  const { submit, honeypotRef, formError } = useFormSubmit("crew", setError);
  const summary = useErrorSummary(errors);
  const opts = <K extends keyof typeof optionsMap>(k: K) => optionsMap[k].map((v) => ({ value: v, label: t(`options.${k}.${v}` as "options.seniority.mid") }));
  const labels = Object.fromEntries(
    ["fullName", "company", "email", "phone", "roles", "headcount", "stack", "seniority", "startDate", "duration", "workModel", "budget", "description", "preferredContact"].map((k) => [
      k,
      t(`fields.${k === "email" ? "businessEmail" : k}` as "fields.email"),
    ]),
  );

  const onValid = async (data: Out) => {
    const r = await submit(data);
    if (!r.ok) return summary.failed();
    track("client_request_submit", { headcount: data.headcount, seniority: data.seniority, from_profile: !!data.profileId });
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
      {profileId && (
        <p className="rounded-2xl border border-cyan/40 bg-cyan/5 px-4 py-3 text-sm">
          {t("fields.profileId")}: <strong className="font-mono">{profileId}</strong>
          <input type="hidden" {...register("profileId")} />
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="fullName" label={t("fields.fullName")} required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <TextField id="company" label={t("fields.company")} required autoComplete="organization" error={errors.company?.message} {...register("company")} />
        <TextField id="email" type="email" label={t("fields.businessEmail")} required autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField id="phone" type="tel" label={t("fields.phone")} hint={t("hints.phone")} autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
        <TextField id="roles" label={t("fields.roles")} hint={t("hints.roles")} required error={errors.roles?.message} {...register("roles")} />
        <TextField id="headcount" type="number" min={1} max={50} inputMode="numeric" label={t("fields.headcount")} required error={errors.headcount?.message} {...register("headcount")} />
        <TextField id="stack" label={t("fields.stack")} hint={t("hints.stack")} required className="sm:col-span-2" error={errors.stack?.message} {...register("stack")} />
        <SelectField id="seniority" label={t("fields.seniority")} required options={opts("seniority")} error={errors.seniority?.message} {...register("seniority")} />
        <SelectField id="startDate" label={t("fields.startDate")} required options={opts("startDate")} error={errors.startDate?.message} {...register("startDate")} />
        <SelectField id="duration" label={t("fields.duration")} required options={opts("duration")} error={errors.duration?.message} {...register("duration")} />
        <TextField id="budget" label={t("fields.budget")} hint={t("hints.budget")} error={errors.budget?.message} {...register("budget")} />
      </div>
      <ChoiceGroup id="workModel" legend={t("fields.workModel")} type="radio" required options={opts("workModel")} error={errors.workModel?.message} inputProps={() => register("workModel")} />
      <TextArea id="description" label={t("fields.description")} hint={t("hints.description")} required error={errors.description?.message} {...register("description")} />
      <ChoiceGroup id="preferredContact" legend={t("fields.preferredContact")} type="radio" required options={opts("preferredContact")} error={errors.preferredContact?.message} inputProps={() => register("preferredContact")} />

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
