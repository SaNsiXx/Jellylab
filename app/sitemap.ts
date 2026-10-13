import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/site";
import { absoluteUrl, localizedPath } from "@/lib/seo";
import { getInsights } from "@/lib/adapters/insights";

// Every public route in both locales, with hreflang alternates. Status pages (check-inbox/confirm/confirmed) are excluded.
const PUBLIC = [routes.home, routes.solutions, routes.talent, routes.howItWorks, routes.forDevelopers, routes.about, routes.insights, routes.jellyList, routes.contact, routes.privacy, routes.cookies, routes.jellyBoxTerms];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entry = (path: string, locales: readonly string[] = routing.locales) =>
    locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, absoluteUrl(localizedPath(l, path))])) },
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    }));

  const articles = (await Promise.all(routing.locales.map(async (l) => (await getInsights().list(l)).filter((a) => !a.sample).map((a) => ({ ...a, l }))))).flat();
  const articleEntries = articles.map((a) => ({ url: absoluteUrl(localizedPath(a.l, `/insights/${a.slug}`)), lastModified: a.updatedAt ?? a.publishedAt, changeFrequency: "monthly" as const, priority: 0.6 }));

  return [...PUBLIC.flatMap((p) => entry(p)), ...articleEntries];
}
