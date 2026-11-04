"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { candidateSchema, MAIN_ROLE, DEV_SENIORITY, ENGLISH, DEV_AVAILABILITY, CONTRACT_TYPE, CV_MAX_BYTES, CV_TYPES } from "@/lib/forms/schemas";
import { consentText } from "@/lib/forms/consents";
import { track } from "@/lib/analytics/track";
import { TextField, SelectField, ChoiceGroup, ConsentCheckbox, Honeypot, ErrorSummary, SuccessPanel, FieldError, useFieldA11y } from "./ui";
import { PrivacyNotice, SubmitButton, FormLevelError } from "./FormFooter";
import { useFormSubmit } from "./useFormSubmit";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof candidateSchema>;
type Out = z.output<typeof candidateSchema>;

const optionsMap = { mainRole: MAIN_ROLE, seniority: DEV_SENIORITY, english: ENGLISH, availability: DEV_AVAILABILITY, contractType: CONTRACT_TYPE } as const;

/** Reads ?offer=<id> (links from /careers) and prefills the application with that offer. */
export function CandidateFormWithOffer({ offers = {} }: { offers?: Record<string, string> }) {
  const id = (useSearchParams().get("offer") ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const title = offers[id];
  return <CandidateForm key={title ? id : "general"} offer={title ? { id, title } : undefined} />;
}

export function CandidateForm({ offer }: { offer?: { id: string; title: string } }) {
  const t = useTranslations("forms");
  const tc = useTranslations("cta");
  const locale = useLocale() as "en" | "pl";
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | undefined>();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(candidateSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { fullName: "", email: "", phone: "", location: "", linkedin: "", hasCv: false, rate: "", offerId: offer?.id ?? "", consentFuture: false },
  });
  const { submit, honeypotRef, formError } = useFormSubmit("candidate", setError);
  const summary = useErrorSummary(errors);
  const opts = <K extends keyof typeof optionsMap>(k: K) => optionsMap[k].map((v) => ({ value: v, label: t(`options.${k}.${v}` as "options.english.b2") }));
  const labels = Object.fromEntries(
    ["fullName", "email", "phone", "location", "linkedin", "cv", "mainRole", "seniority", "english", "availability", "rate", "contractType"].map((k) => [k, t(`fields.${k}` as "fields.email")]),
  );
  labels.consentRecruitment = t("consents.groupLabel");
  // The file lives outside the schema; its client/server error is stored under "cv".
  const cvError = (errors as Record<string, { message?: string } | undefined>).cv?.message;
  const cvA11y = useFieldA11y("cv", t("hints.cv"), cvError);

  const onFile = (f: File | undefined) => {
    clearErrors(["cv" as never, "linkedin"]);
    if (f && !(f.type in CV_TYPES)) {
      setError("cv" as never, { message: "fileType" });
      f = undefined;
    } else if (f && f.size > CV_MAX_BYTES) {
      setError("cv" as never, { message: "fileSize" });
      f = undefined;
    }
    setFile(f);
    setValue("hasCv", !!f);
  };

  const onValid = async (data: Out) => {
    const r = await submit(data, file);
    if (!r.ok) return summary.failed();
    track("developer_form_submit", { main_role: data.mainRole, seniority: data.seniority, with_cv: !!file, offer: data.offerId || undefined });
    setDone(true);
  };

  if (done) return <SuccessPanel title={t("success.candidateTitle")} body={t("success.candidateBody")} />;

  return (
    <form noValidate onSubmit={handleSubmit(onValid, summary.failed)} className="relative grid gap-6">
      <ErrorSummary errors={summary.list} labels={labels} summaryRef={summary.summaryRef} />
      <Honeypot ref={honeypotRef} />
      {offer && (
        <p className="rounded-2xl border border-green/40 bg-green/5 px-4 py-3 text-sm">
          {t("fields.offer")}: <strong className="font-medium">{offer.title}</strong>
          <input type="hidden" {...register("offerId")} />
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="fullName" label={t("fields.fullName")} required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <TextField id="email" type="email" label={t("fields.email")} required autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField id="phone" type="tel" label={t("fields.phone")} hint={t("hints.phone")} required autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
        <TextField id="location" label={t("fields.location")} required autoComplete="address-level2" error={errors.location?.message} {...register("location")} />
      </div>

      <div className="grid gap-6 rounded-[var(--radius-card)] border border-line p-5 sm:grid-cols-2 sm:p-6">
        <p className="text-sm text-muted sm:col-span-2">{t("hints.linkedinOrCv")}</p>
        <TextField id="linkedin" type="url" label={t("fields.linkedin")} placeholder="https://www.linkedin.com/in/…" autoComplete="url" inputMode="url" error={errors.linkedin?.message} {...register("linkedin")} />
        <div>
          <label htmlFor="cv" className="block text-sm font-medium">
            {t("fields.cv")} <span className="ml-1 text-xs font-normal text-muted">({t("optional")})</span>
          </label>
          <p id="cv-hint" className="mt-1 text-sm text-muted">
            {t("hints.cv")}
          </p>
          <input
            {...cvA11y}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="mt-2 block w-full min-h-12 cursor-pointer rounded-2xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-fg hover:file:bg-white/20"
          />
          <FieldError id="cv" error={cvError} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField id="mainRole" label={t("fields.mainRole")} required options={opts("mainRole")} error={errors.mainRole?.message} {...register("mainRole")} />
        <SelectField id="seniority" label={t("fields.seniority")} required options={opts("seniority")} error={errors.seniority?.message} {...register("seniority")} />
        <SelectField id="english" label={t("fields.english")} required options={opts("english")} error={errors.english?.message} {...register("english")} />
        <SelectField id="availability" label={t("fields.availability")} required options={opts("availability")} error={errors.availability?.message} {...register("availability")} />
        <TextField id="rate" label={t("fields.rate")} hint={t("hints.rate")} error={errors.rate?.message} {...register("rate")} />
      </div>
      <ChoiceGroup id="contractType" legend={t("fields.contractType")} type="radio" required options={opts("contractType")} error={errors.contractType?.message} inputProps={() => register("contractType")} />

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">{t("consents.groupLabel")}</legend>
        <ConsentCheckbox id="consentRecruitment" required text={consentText("recruitment", locale)} error={errors.consentRecruitment?.message} {...register("consentRecruitment")} />
        <ConsentCheckbox id="consentFuture" text={consentText("futureOffers", locale)} {...register("consentFuture")} />
      </fieldset>
      <PrivacyNotice />
      <FormLevelError code={formError} />
      <div>
        <SubmitButton label={tc("joinCrew")} pending={isSubmitting} />
      </div>
    </form>
  );
}
