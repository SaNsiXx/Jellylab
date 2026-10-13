"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { FormType } from "@/lib/forms/schemas";
import { getAttribution } from "@/lib/attribution";

export type SubmitResult = { ok: true; next?: string; doi?: boolean } | { ok: false };

/** Wraps the POST to /api/forms/[type]: meta (locale, timing, honeypot, attribution), server errors → fields. */
export function useFormSubmit<T extends FieldValues>(type: FormType, setError: UseFormSetError<T>) {
  const locale = useLocale();
  const startedAt = useRef(0);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(data: unknown, file?: File): Promise<SubmitResult> {
    setFormError(null);
    const meta = {
      locale,
      startedAt: startedAt.current,
      website: honeypotRef.current?.value ?? "",
      attribution: getAttribution(),
      pageUrl: window.location.pathname,
    };
    let res: Response;
    try {
      if (file) {
        const fd = new FormData();
        fd.append("payload", JSON.stringify({ data, meta }));
        fd.append("cv", file);
        res = await fetch(`/api/forms/${type}`, { method: "POST", body: fd });
      } else {
        res = await fetch(`/api/forms/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, meta }) });
      }
    } catch {
      setFormError("network");
      return { ok: false };
    }
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; next?: string; doi?: boolean; error?: string; fieldErrors?: Record<string, string> };
    if (res.ok && body.ok) return { ok: true, next: body.next, doi: body.doi };
    if (body.fieldErrors) {
      for (const [field, key] of Object.entries(body.fieldErrors)) setError(field as Path<T>, { type: "server", message: key });
    } else {
      setFormError(body.error ?? "server");
    }
    return { ok: false };
  }

  return { submit, honeypotRef, formError };
}
