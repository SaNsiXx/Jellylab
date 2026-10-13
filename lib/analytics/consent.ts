// Consent store (built-in consent manager). Swappable: to use Cookiebot / CookieYes / Usercentrics,
// remove <ConsentBanner/> and call setConsent() from that CMP's "consent ready/changed" callback —
// every other part of the site (track(), AnalyticsScripts, Google Consent Mode) keeps working.
import { useSyncExternalStore } from "react";

export type Consent = { analytics: boolean; marketing: boolean; version: string; updatedAt: string };

/** Bump when the cookie policy / vendor list changes → visitors are asked again. */
export const CONSENT_POLICY_VERSION = "2026-10-DRAFT-1";
const KEY = "jl-consent";
const OPEN_EVENT = "jl:consent-open";

let cached: Consent | null | undefined;
const listeners = new Set<() => void>();

function read(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null") as Consent | null;
    return c && c.version === CONSENT_POLICY_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  if (cached === undefined) {
    cached = read();
    applyToWindow(cached);
  }
  return cached;
}

type Gtag = (...args: unknown[]) => void;

function applyToWindow(c: Consent | null) {
  window.__jlConsent = { analytics: !!c?.analytics, marketing: !!c?.marketing };
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("consent", "update", {
    analytics_storage: c?.analytics ? "granted" : "denied",
    ad_storage: c?.marketing ? "granted" : "denied",
    ad_user_data: c?.marketing ? "granted" : "denied",
    ad_personalization: c?.marketing ? "granted" : "denied",
  });
}

export function setConsent(choice: { analytics: boolean; marketing: boolean }) {
  cached = { ...choice, version: CONSENT_POLICY_VERSION, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* private mode: consent applies for this page view only */
  }
  applyToWindow(cached);
  listeners.forEach((l) => l());
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenConsentSettings(fn: () => void) {
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** undefined = not yet known (SSR / before hydration), null = not decided yet. */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, getConsent, () => undefined);
}
