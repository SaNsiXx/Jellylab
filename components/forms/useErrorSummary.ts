"use client";

import { useEffect, useRef } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * After a failed submit, focus the error summary (focus-management guideline); field errors stay inline too.
 * React Hook Form may commit `errors` in a later render than the failure callback, so focus is requested
 * and applied on the first render where the summary actually exists.
 */
export function useErrorSummary<T extends FieldValues>(errors: FieldErrors<T>) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);
  const list = Object.entries(errors).map(([field, e]) => [field, String((e as { message?: string } | undefined)?.message || "required")] as [string, string]);

  useEffect(() => {
    if (focusPending.current && summaryRef.current) {
      focusPending.current = false;
      summaryRef.current.focus();
    }
  });

  return {
    summaryRef,
    list,
    failed: () => {
      focusPending.current = true;
      // Covers the case where errors were already rendered (no re-render will follow).
      requestAnimationFrame(() => {
        if (focusPending.current && summaryRef.current) {
          focusPending.current = false;
          summaryRef.current.focus();
        }
      });
    },
  };
}
