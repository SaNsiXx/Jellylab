// Consent-aware event layer. Events are dropped (never queued) until analytics consent is granted.
// Phase 3 adds the GA4 / LinkedIn adapters and the consent manager; call sites will not change.

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
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, props);
  if (!window.__jlConsent?.analytics) return;
  window.dataLayer ??= [];
  window.dataLayer.push({ event, ...props });
}
