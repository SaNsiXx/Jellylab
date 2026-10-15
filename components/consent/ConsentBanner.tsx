"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/site";
import { onOpenConsentSettings, setConsent, useConsent } from "@/lib/analytics/consent";
import { buttonClass } from "@/components/ui/Button";

/**
 * Built-in consent manager. Non-blocking bottom panel; "Accept" and "Reject" have equal weight
 * (no dark patterns); nothing non-essential loads until a choice is made.
 */
export function ConsentBanner() {
  const t = useTranslations("consentBanner");
  const consent = useConsent();
  const [forcedOpen, setForcedOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onOpenConsentSettings(() => {
        setAnalytics(!!consent?.analytics);
        setMarketing(!!consent?.marketing);
        setSettings(true);
        setForcedOpen(true);
        requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("input,button")?.focus());
      }),
    [consent],
  );

  const open = consent === null || forcedOpen;

  // Keep keyboard-focused content from hiding under the panel (WCAG 2.4.11).
  useEffect(() => {
    const root = document.documentElement;
    if (!open || !panelRef.current) {
      root.style.scrollPaddingBottom = "";
      return;
    }
    root.style.scrollPaddingBottom = `${panelRef.current.offsetHeight + 16}px`;
    return () => {
      root.style.scrollPaddingBottom = "";
    };
  }, [open, settings]);

  if (!open) return null;

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    setConsent(choice);
    setForcedOpen(false);
    setSettings(false);
  };

  return (
    <div
      ref={panelRef}
      role="region"
      aria-labelledby="consent-title"
      className="fixed inset-x-3 bottom-3 z-[45] mx-auto max-w-3xl rounded-[var(--radius-modal)] border border-line bg-surface/95 p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8),0_0_40px_-20px_rgba(19,200,255,0.5)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-7"
    >
      <h2 id="consent-title" className="font-display text-lg font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted">
        {t("body")}{" "}
        <Link href={routes.cookies} prefetch={false} className="text-fg underline underline-offset-4 hover:text-cyan">
          {t("policy")}
        </Link>
      </p>

      {settings && (
        <fieldset className="mt-5 grid gap-3">
          <legend className="sr-only">{t("settings")}</legend>
          {[
            { key: "essential", checked: true, disabled: true, onChange: () => {} },
            { key: "analytics", checked: analytics, disabled: false, onChange: setAnalytics },
            { key: "marketing", checked: marketing, disabled: false, onChange: setMarketing },
          ].map((o) => (
            <label key={o.key} className={`flex gap-3 rounded-2xl border border-line p-4 ${o.disabled ? "opacity-80" : "cursor-pointer hover:border-white/25"}`}>
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 accent-[var(--color-green)]"
                checked={o.checked}
                disabled={o.disabled}
                onChange={(e) => o.onChange(e.target.checked)}
              />
              <span>
                <span className="block font-medium">{t(o.key as "essential")}</span>
                <span className="block text-sm text-muted">{t(`${o.key}Body` as "essentialBody")}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" className={buttonClass("secondary", "min-h-11 px-5 text-[0.75rem]")} onClick={() => decide({ analytics: false, marketing: false })}>
          <span>{t("rejectAll")}</span>
        </button>
        <button type="button" className={buttonClass("secondary", "min-h-11 px-5 text-[0.75rem]")} onClick={() => decide({ analytics: true, marketing: true })}>
          <span>{t("acceptAll")}</span>
        </button>
        {settings ? (
          <button type="button" className={buttonClass("secondary", "min-h-11 px-5 text-[0.75rem]")} onClick={() => decide({ analytics, marketing })}>
            <span>{t("save")}</span>
          </button>
        ) : (
          <button type="button" className="min-h-11 px-3 text-sm text-muted underline underline-offset-4 hover:text-fg sm:ml-auto" onClick={() => setSettings(true)}>
            {t("settings")}
          </button>
        )}
      </div>
    </div>
  );
}

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        import("@/lib/analytics/consent").then((m) => m.openConsentSettings());
      }}
    >
      {t("cookieSettings")}
    </button>
  );
}
