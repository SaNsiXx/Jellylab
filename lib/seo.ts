import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/** Locale-prefixed path for a route that exists identically in every locale. */
export const localizedPath = (locale: string, path: string) => {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? clean || "/" : `/${locale}${clean}`;
};

/** Canonical + hreflang (incl. x-default). */
export function alternatesFor(locale: string, path: string) {
  return {
    canonical: localizedPath(locale, path),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, localizedPath(l, path)])),
      "x-default": localizedPath(routing.defaultLocale, path),
    },
  };
}

export type PageKey = "solutions" | "talent" | "howItWorks" | "forDevelopers" | "about" | "insights" | "jellyList" | "contact" | "privacy" | "cookies" | "jellyBoxTerms" | "jellyBox";

/** Generated 1200×630 preview image (app/api/og). Explicit per page so child metadata never drops it. */
export const ogImage = (title: string, eyebrow?: string) => {
  const q = new URLSearchParams({ title, ...(eyebrow ? { eyebrow } : {}) });
  return { url: `/api/og?${q.toString()}`, width: 1200, height: 630, alt: title };
};

/** Route-level metadata from messages meta.pages.<key> with canonical, hreflang and Open Graph. */
export async function pageMetadata(locale: Locale, key: PageKey, path: string, opts: { noindex?: boolean } = {}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.pages" });
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      title,
      description,
      url: localizedPath(locale, path),
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      alternateLocale: locale === "pl" ? ["en_GB"] : ["pl_PL"],
      images: [ogImage(title)],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage(title).url] },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
  };
}

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
