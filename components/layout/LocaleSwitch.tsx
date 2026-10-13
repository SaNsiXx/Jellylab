"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { track } from "@/lib/analytics/track";

export function LocaleSwitch({ size = "sm", onSwitch }: { size?: "sm" | "lg"; onSwitch?: () => void }) {
  const current = useLocale();
  const pathname = usePathname();
  const t = useTranslations("a11y");
  const pad = size === "lg" ? "min-h-12 min-w-14 text-base" : "min-h-9 min-w-10 text-xs";

  return (
    <nav aria-label={t("languageSwitch")}>
      <ul className="flex items-center rounded-full border border-white/15 p-1">
        {routing.locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={pathname}
                locale={locale}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                aria-label={active ? undefined : t("switchTo")}
                onClick={() => {
                  if (!active) track("language_change", { from: current, to: locale });
                  onSwitch?.();
                }}
                className={`flex items-center justify-center rounded-full px-2.5 font-display font-semibold tracking-[0.12em] uppercase transition-colors duration-[var(--duration-micro)] ${pad} ${
                  active ? "bg-white/10 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {locale}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
