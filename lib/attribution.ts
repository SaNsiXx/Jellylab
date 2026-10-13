// First-touch attribution for the current session (UTM, external referrer, landing page).
// Kept in sessionStorage and sent ONLY together with a form submission.

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
  firstSeenAt?: string;
};

const KEY = "jl-attr";

export function captureAttribution() {
  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;
    const existing = sessionStorage.getItem(KEY);
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign"].some((k) => p.has(k));
    if (existing && !hasUtm) return;
    const ref = document.referrer && new URL(document.referrer).host !== url.host ? document.referrer : undefined;
    const a: Attribution = {
      utmSource: p.get("utm_source") ?? undefined,
      utmMedium: p.get("utm_medium") ?? undefined,
      utmCampaign: p.get("utm_campaign") ?? undefined,
      utmContent: p.get("utm_content") ?? undefined,
      utmTerm: p.get("utm_term") ?? undefined,
      referrer: ref?.slice(0, 500),
      landingPage: url.pathname.slice(0, 500),
      firstSeenAt: new Date().toISOString(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage blocked — attribution is best-effort */
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}
