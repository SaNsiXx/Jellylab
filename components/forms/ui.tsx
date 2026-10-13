"use client";

import { Component, forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { useTranslations } from "next-intl";

/* ---------- Field shell: visible label, required marker, hint, inline error (aria-describedby) ---------- */

type Shell = { id: string; label: string; required?: boolean; hint?: string; error?: string; className?: string };

export function useFieldA11y(id: string, hint?: string, error?: string) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy } as const;
}

function RequiredMark({ required }: { required?: boolean }) {
  const t = useTranslations("forms");
  return required ? (
    <span className="text-orange" aria-hidden="true">
      {" "}*
    </span>
  ) : (
    <span className="ml-2 text-xs font-normal text-muted">({t("optional")})</span>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  const t = useTranslations("forms.errors");
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 flex items-start gap-2 text-sm text-[#ff8a95]">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="currentColor">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.25h1.5v4.5h-1.5v-4.5Zm0 5.75h1.5V12h-1.5v-1.5Z" />
      </svg>
      <span>{t.has(error as "required") ? t(error as "required") : error}</span>
    </p>
  );
}

function Shell({ id, label, required, hint, error, className = "", children }: Shell & { children: ReactNode }) {
  const t = useTranslations("forms");
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required && <span className="sr-only"> ({t("required")})</span>}
        <RequiredMark required={required} />
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      <FieldError id={id} error={error} />
    </div>
  );
}

const control =
  "block w-full min-h-12 rounded-2xl border bg-white/[0.03] px-4 py-3 text-base text-fg placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] duration-[var(--duration-micro)] outline-none " +
  "focus-visible:border-cyan focus-visible:shadow-[0_0_0_3px_rgb(19_200_255/0.25),0_0_24px_-6px_rgb(19_200_255/0.6)] " +
  "aria-[invalid=true]:border-[#ff6b78]";

type InputProps = Shell & InputHTMLAttributes<HTMLInputElement>;
export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField({ id, label, required, hint, error, className, ...rest }, ref) {
  const a11y = useFieldA11y(id, hint, error);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <input ref={ref} {...a11y} aria-required={required || undefined} className={`${control} ${error ? "border-[#ff6b78]" : "border-line"}`} {...rest} />
    </Shell>
  );
});

type AreaProps = Shell & TextareaHTMLAttributes<HTMLTextAreaElement>;
export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea({ id, label, required, hint, error, className, ...rest }, ref) {
  const a11y = useFieldA11y(id, hint, error);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <textarea ref={ref} rows={5} {...a11y} aria-required={required || undefined} className={`${control} min-h-32 resize-y ${error ? "border-[#ff6b78]" : "border-line"}`} {...rest} />
    </Shell>
  );
});

type SelectProps = Shell & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] };
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ id, label, required, hint, error, className, options, ...rest }, ref) {
  const t = useTranslations("forms");
  const a11y = useFieldA11y(id, hint, error);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div className="relative">
        <select ref={ref} {...a11y} aria-required={required || undefined} className={`${control} appearance-none pr-10 ${error ? "border-[#ff6b78]" : "border-line"}`} defaultValue="" {...rest}>
          <option value="" disabled>
            {t("select")}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-surface">
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    </Shell>
  );
});

/* ---------- Choice groups (checkbox / radio) as fieldsets with pill options ---------- */

type ChoiceGroupProps = {
  id: string;
  legend: string;
  type: "checkbox" | "radio";
  required?: boolean;
  error?: string;
  options: { value: string; label: string }[];
  inputProps: (value: string) => InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };
};

export function ChoiceGroup({ id, legend, type, required, error, options, inputProps }: ChoiceGroupProps) {
  const t = useTranslations("forms");
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={error ? `${id}-error` : undefined} className="outline-none">
      <legend className="text-sm font-medium text-fg">
        {legend}
        {required && <span className="sr-only"> ({t("required")})</span>}
        <RequiredMark required={required} />
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-white/[0.02] px-4 py-2 text-sm transition-colors hover:border-white/30 has-[:checked]:border-cyan has-[:checked]:bg-cyan/10 has-[:checked]:shadow-[0_0_18px_-6px_var(--color-cyan)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input type={type} value={o.value} className="size-4 accent-[var(--color-cyan)]" aria-invalid={error ? true : undefined} {...inputProps(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

/* ---------- Consent checkbox: never preselected; exact text shown is the text stored ---------- */

export const ConsentCheckbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { id: string; text: string; required?: boolean; error?: string }>(
  function ConsentCheckbox({ id, text, required, error, ...rest }, ref) {
    const t = useTranslations("forms");
    return (
      <div>
        <label htmlFor={id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm leading-relaxed text-fg/90 transition-colors hover:border-white/25 ${error ? "border-[#ff6b78]" : "border-line"}`}>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-green)]"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-required={required || undefined}
            {...rest}
          />
          <span>
            {text}
            {required ? (
              <span className="text-orange">
                {" "}*<span className="sr-only"> ({t("required")})</span>
              </span>
            ) : (
              <span className="ml-1 text-muted">({t("optional")})</span>
            )}
          </span>
        </label>
        <FieldError id={id} error={error} />
      </div>
    );
  },
);

/* ---------- Honeypot: off-screen, not focusable, ignored by assistive tech ---------- */

export const Honeypot = forwardRef<HTMLInputElement>(function Honeypot(_, ref) {
  const t = useTranslations("forms");
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        {t("honeypot")}
        <input ref={ref} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
});

/* ---------- Error summary: focused after a failed submit, links to each invalid field ---------- */

export function ErrorSummary({ errors, labels, summaryRef }: { errors: [string, string][]; labels: Record<string, string>; summaryRef: React.RefObject<HTMLDivElement | null> }) {
  const t = useTranslations("forms");
  const te = useTranslations("forms.errors");
  if (errors.length === 0) return null;
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-2xl border border-[#ff6b78]/60 bg-[#ff4d5e]/10 p-5 outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b78]">
      <p className="font-medium">{t("errorSummary", { count: errors.length })}</p>
      <ul className="mt-3 grid gap-1.5 text-sm">
        {errors.map(([field, key]) => (
          <li key={field}>
            <a href={`#${field}`} className="underline underline-offset-4 hover:text-cyan" onClick={(e) => { e.preventDefault(); document.getElementById(field)?.focus(); }}>
              {labels[field] ?? field}: {te.has(key as "required") ? te(key as "required") : key}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Success panel ---------- */

export function SuccessPanel({ title, body, extra, onReset, resetLabel }: { title: string; body: string; extra?: string; onReset?: () => void; resetLabel?: string }) {
  return (
    <div role="status" className="card p-8 sm:p-10">
      <span aria-hidden="true" className="live-dot inline-block size-3 rounded-full bg-green shadow-[0_0_14px_var(--color-green)]" />
      <h3 className="h3 mt-6 text-2xl sm:text-3xl" tabIndex={-1} ref={(el) => el?.focus()}>
        {title}
      </h3>
      <p className="mt-3 text-muted">{body}</p>
      {extra && <p className="mt-3 text-sm text-fg/90">{extra}</p>}
      {onReset && resetLabel && (
        <button type="button" onClick={onReset} className="mt-6 min-h-11 text-sm text-muted underline underline-offset-4 hover:text-fg">
          {resetLabel}
        </button>
      )}
    </div>
  );
}

/* ---------- Error boundary so a render failure never takes down the page ---------- */

export class FormBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("[form] render error", error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
