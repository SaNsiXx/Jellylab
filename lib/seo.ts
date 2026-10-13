import { routing } from "@/i18n/routing";

/** Canonical + hreflang for a path that exists identically in every locale. */
export function alternatesFor(locale: string, path: string) {
  const clean = path === "/" ? "" : path;
  const href = (l: string) => (l === routing.defaultLocale ? clean || "/" : `/${l}${clean}`);
  return {
    canonical: href(locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, href(l)])),
      "x-default": href(routing.defaultLocale),
    },
  };
}
