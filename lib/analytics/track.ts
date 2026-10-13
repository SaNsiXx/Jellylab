// Consent-aware event layer. Events are DROPPED (never queued) until analytics consent is granted.
// Destinations: GA4 (gtag) for every event; LinkedIn Insight conversions for mapped events when
// marketing consent is granted (NEXT_PUBLIC_LINKEDIN_CONVERSIONS, JSON: {"jelly_list_submit": 123456}).

export type AnalyticsEvent =
  | "hero_get_jelly_drop_click"
  | "hero_build_crew_click"
  | "talent_profile_request"
  | "jelly_list_form_start"
  | "jelly_list_submit"
  | "double_opt_in_confirmed"
  | "client_request_submit"
  | "developer_form_submit"
  | "newsletter_signup"
  | "language_change"
  | "contact_click";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    __jlConsent?: { analytics: boolean; marketing: boolean };
    gtag?: (...args: unknown[]) => void;
    lintrk?: (action: string, data: { conversion_id: number }) => void;
  }
}

let conversions: Record<string, number> | null = null;
function linkedInConversion(event: AnalyticsEvent) {
  if (conversions === null) {
    try {
      conversions = JSON.parse(process.env.NEXT_PUBLIC_LINKEDIN_CONVERSIONS ?? "{}") as Record<string, number>;
    } catch {
      conversions = {};
    }
  }
  return conversions[event];
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, props, window.__jlConsent ?? "no consent yet");
  const consent = window.__jlConsent;
  if (consent?.analytics) {
    if (window.gtag) window.gtag("event", event, props);
    else (window.dataLayer ??= []).push({ event, ...props });
  }
  const conversionId = linkedInConversion(event);
  if (consent?.marketing && conversionId && window.lintrk) window.lintrk("track", { conversion_id: conversionId });
}
