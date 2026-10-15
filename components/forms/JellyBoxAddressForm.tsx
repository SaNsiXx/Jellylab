"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/site";
import { jellyBoxAddressSchema } from "@/lib/forms/schemas";
import { controllerWithAddress } from "@/lib/forms/consents";
import { TextField, TextArea, ConsentCheckbox, Honeypot, ErrorSummary, SuccessPanel } from "./ui";
import { SubmitButton, FormLevelError } from "./FormFooter";
import { useErrorSummary } from "./useErrorSummary";

type In = z.input<typeof jellyBoxAddressSchema>;
type Out = z.output<typeof jellyBoxAddressSchema>;

/** Posts the address with the token + anti-bot meta. Refs live inside the hook (same pattern as useFormSubmit). */
function useJellyBoxSubmit(token: string) {
  const startedAt = useRef(0);
  const honeypotRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  async function submit(data: Out): Promise<{ ok: true } | { ok: false; error?: string; fieldErrors?: Record<string, string> }> {
    try {
      const res = await fetch("/api/jelly-box/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, data, meta: { startedAt: startedAt.current, website: honeypotRef.current?.value ?? "" } }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };
      return res.ok && body.ok ? { ok: true } : { ok: false, error: body.error, fieldErrors: body.fieldErrors };
    } catch {
      return { ok: false, error: "network" };
    }
  }
  return { submit, honeypotRef };
}

/** Jelly Box delivery address — company address in Poland; identity comes from the signed invitation token. */
export function JellyBoxAddressForm({ token }: { token: string }) {
  const t = useTranslations("jellyBox");
  const tf = useTranslations("forms");
  const locale = useLocale() as "en" | "pl";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { submit, honeypotRef } = useJellyBoxSubmit(token);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(jellyBoxAddressSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { company: "", recipientName: "", street: "", postalCode: "", city: "", phone: "", notes: "" },
  });
  const summary = useErrorSummary(errors);
  const labels = Object.fromEntries(["company", "recipientName", "street", "postalCode", "city", "phone", "notes"].map((k) => [k, t(`fields.${k}` as "fields.city")]));
  labels.confirmCompanyAddress = tf("consents.groupLabel");

  const onValid = async (data: Out) => {
    setFormError(null);
    const r = await submit(data);
    if (r.ok) return setDone(true);
    if (r.fieldErrors) for (const [k, v] of Object.entries(r.fieldErrors)) setError(k as keyof In, { type: "server", message: v });
    else setFormError(r.error === "invalid" ? "server" : (r.error ?? "server"));
    summary.failed();
  };

  if (done) return <SuccessPanel title={t("successTitle")} body={t("successBody")} />;

  return (
    <form noValidate onSubmit={handleSubmit(onValid, summary.failed)} className="relative grid gap-6">
      <ErrorSummary errors={summary.list} labels={labels} summaryRef={summary.summaryRef} />
      <Honeypot ref={honeypotRef} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="company" label={t("fields.company")} required autoComplete="organization" error={errors.company?.message} {...register("company")} />
        <TextField id="recipientName" label={t("fields.recipientName")} required autoComplete="name" error={errors.recipientName?.message} {...register("recipientName")} />
        <TextField id="street" label={t("fields.street")} required autoComplete="street-address" className="sm:col-span-2" error={errors.street?.message} {...register("street")} />
        <TextField id="postalCode" label={t("fields.postalCode")} hint={t("hints.postalCode")} required autoComplete="postal-code" inputMode="numeric" placeholder="00-000" error={errors.postalCode?.message} {...register("postalCode")} />
        <TextField id="city" label={t("fields.city")} required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        <TextField id="country" label={t("fields.country")} value={t("fields.countryValue")} readOnly aria-readonly="true" autoComplete="country-name" />
        <TextField id="phone" type="tel" label={t("fields.phone")} hint={t("hints.phone")} required autoComplete="tel" inputMode="tel" error={errors.phone?.message} {...register("phone")} />
      </div>
      <TextArea id="notes" label={t("fields.notes")} hint={t("hints.notes")} rows={3} error={errors.notes?.message} {...register("notes")} />
      <ConsentCheckbox id="confirmCompanyAddress" required text={t("confirm")} error={errors.confirmCompanyAddress?.message} {...register("confirmCompanyAddress")} />
      <p className="text-xs leading-relaxed text-muted">
        {t("notice", { controller: controllerWithAddress(locale) })}{" "}
        <Link href={routes.jellyBoxTerms} prefetch={false} className="text-fg underline underline-offset-4 hover:text-cyan">
          {t("terms")}
        </Link>
      </p>
      <FormLevelError code={formError} />
      <div>
        <SubmitButton label={t("submit")} pending={isSubmitting} />
      </div>
    </form>
  );
}
