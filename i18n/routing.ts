import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",
  // EN lives at "/", PL at "/pl/..." — both use identical slugs (brief §13.5).
  localePrefix: "as-needed",
  // Deterministic URLs: no Accept-Language redirects; users switch explicitly.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
