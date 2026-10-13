import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { showDevPlaceholders } from "@/lib/legal/entity";

// Insights content adapter. Default source: MDX files in content/insights/{en,pl}/*.mdx with frontmatter
// mirroring insightArticle in 08_CMS_CONTENT_MODEL.json. To move to a headless CMS, implement
// InsightsAdapter against its API and return it from getInsights() — pages don't change.

export const CATEGORIES = ["jelly_drop", "market_signals", "delivery", "people", "ai_technology"] as const;
export type Category = (typeof CATEGORIES)[number];

export type ArticleMeta = {
  slug: string;
  locale: "en" | "pl";
  title: string;
  excerpt: string;
  category: Category;
  author: { name: string; role?: string };
  publishedAt: string;
  updatedAt?: string;
  coverImage?: string;
  readMinutes: number;
  seo?: { title?: string; description?: string; ogImage?: string };
  /** Placeholder content — visible only in development / preview builds. */
  sample: boolean;
};
export type Article = ArticleMeta & { body: string };

export interface InsightsAdapter {
  list(locale: "en" | "pl"): Promise<ArticleMeta[]>;
  get(locale: "en" | "pl", slug: string): Promise<Article | null>;
}

const ROOT = path.join(process.cwd(), "content", "insights");

async function loadAll(locale: "en" | "pl"): Promise<Article[]> {
  let files: string[] = [];
  try {
    files = (await readdir(path.join(ROOT, locale))).filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
  const items = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(path.join(ROOT, locale, f), "utf8");
      const { data, content } = matter(raw);
      const words = content.trim().split(/\s+/).length;
      return {
        slug: f.replace(/\.mdx$/, ""),
        locale,
        title: String(data.title),
        excerpt: String(data.excerpt ?? ""),
        category: (CATEGORIES as readonly string[]).includes(data.category) ? (data.category as Category) : "market_signals",
        author: { name: String(data.author ?? "Jelly Labs"), role: data.authorRole ? String(data.authorRole) : undefined },
        publishedAt: new Date(data.publishedAt).toISOString(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : undefined,
        coverImage: data.coverImage ? String(data.coverImage) : undefined,
        readMinutes: Math.max(1, Math.round(words / 220)),
        seo: data.seo as ArticleMeta["seo"],
        sample: data.sample === true,
        draft: data.draft === true,
        body: content,
      };
    }),
  );
  return items
    .filter((a) => !a.draft && (!a.sample || showDevPlaceholders))
    .map((a) => {
      const { draft, ...rest } = a;
      void draft;
      return rest;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

const mdxAdapter: InsightsAdapter = {
  async list(locale) {
    return (await loadAll(locale)).map((a) => {
      const { body, ...meta } = a;
      void body;
      return meta;
    });
  },
  async get(locale, slug) {
    return (await loadAll(locale)).find((a) => a.slug === slug) ?? null;
  },
};

export function getInsights(): InsightsAdapter {
  return mdxAdapter;
}
