"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

const DOI_FLAG = "jl-doi-ok";

/** Fires double_opt_in_confirmed once per real confirmation (flag set by ConfirmEmail), not on reloads/direct visits. */
export function ConfirmedTracker() {
  useEffect(() => {
    try {
      const purpose = sessionStorage.getItem(DOI_FLAG);
      if (!purpose) return;
      sessionStorage.removeItem(DOI_FLAG);
      track("double_opt_in_confirmed", { purpose });
    } catch {}
  }, []);
  return null;
}
