import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/site";
import { absoluteUrl, localizedPath } from "@/lib/seo";

// Every public route in both locales, with hreflang alternates. Status pages (check-inbox/confirm/confirmed) are excluded.
const PUBLIC = [routes.home, routes.solutions, routes.forDevelopers, routes.careers, routes.about, routes.jellyList, routes.contact, routes.privacy, routes.cookies];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(localizedPath(l, path))])) },
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : path === routes.careers ? 0.8 : 0.7,
    })),
  );
}
