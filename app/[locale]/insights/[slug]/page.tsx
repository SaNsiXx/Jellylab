import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { alternatesFor, absoluteUrl, localizedPath, ogImage } from "@/lib/seo";
import { getInsights } from "@/lib/adapters/insights";
import { renderMdx } from "@/components/insights/Mdx";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateStaticParams() {
  const all = await Promise.all(routing.locales.map(async (locale) => (await getInsights().list(locale)).map((a) => ({ locale, slug: a.slug }))));
  return all.flat();
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = toLocale((await params).locale);
  const a = await getInsights().get(locale, slug);
  if (!a) return {};
  const title = a.seo?.title ?? a.title;
  const description = a.seo?.description ?? a.excerpt;
  // Only declare alternates for locales where the same slug exists.
  const other = routing.locales.filter((l) => l !== locale);
  const exists = await Promise.all(other.map(async (l) => !!(await getInsights().get(l, slug))));
  const alt = alternatesFor(locale, `/insights/${slug}`);
  const languages = Object.fromEntries(Object.entries(alt.languages).filter(([l]) => l === locale || l === "x-default" || exists[other.indexOf(l as "en" | "pl")]));
  return {
    title,
    description,
    alternates: { canonical: alt.canonical, languages },
    openGraph: { type: "article", title, description, publishedTime: a.publishedAt, modifiedTime: a.updatedAt, authors: [a.author.name], images: [a.seo?.ogImage ?? a.coverImage ?? ogImage(a.title, "THE JELLY SIGNAL")] },
    twitter: { card: "summary_large_image", images: [a.seo?.ogImage ?? a.coverImage ?? ogImage(a.title, "THE JELLY SIGNAL").url] },
    robots: a.sample ? { index: false, follow: false } : undefined,
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/insights/[slug]">) {
  const { slug } = await params;
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const a = await getInsights().get(locale, slug);
  if (!a) notFound();
  const t = await getTranslations("insightsPage");
  const format = await getFormatter();
  const content = await renderMdx(a.body);
  const date = (d: string) => format.dateTime(new Date(d), { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <article className="container-jl pt-36 pb-16 lg:pt-44">
        <div className="mx-auto max-w-3xl">
          <Link href="/insights" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg">
            <span aria-hidden="true">←</span> {t("back")}
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan/40 px-3 py-1 font-mono text-[0.6875rem] tracking-wider text-cyan uppercase">{t(`categories.${a.category}`)}</span>
            {a.sample && <span className="rounded-full border border-dashed border-orange/60 px-2.5 py-0.5 font-mono text-[0.6875rem] text-orange">{t("sampleBadge")}</span>}
          </div>
          <h1 className="h2 mt-6">{a.title}</h1>
          <p className="lead mt-6">{a.excerpt}</p>
          <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-4 text-sm text-muted">
            <span>{t("by", { author: a.author.name })}</span>
            <span>
              {t("published")}: <time dateTime={a.publishedAt}>{date(a.publishedAt)}</time>
            </span>
            {a.updatedAt && (
              <span>
                {t("updated")}: <time dateTime={a.updatedAt}>{date(a.updatedAt)}</time>
              </span>
            )}
            <span>{t("readTime", { minutes: a.readMinutes })}</span>
          </p>
          <div className="mt-6">{content}</div>
        </div>
      </article>
      <NewsletterCTA title={t("newsletterTitle")} body={t("newsletterBody")} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.publishedAt,
          dateModified: a.updatedAt ?? a.publishedAt,
          inLanguage: locale,
          author: { "@type": "Organization", name: a.author.name },
          publisher: { "@type": "Organization", name: "Jelly Labs", logo: { "@type": "ImageObject", url: absoluteUrl("/brand/jellylabs-wordmark.png") } },
          mainEntityOfPage: absoluteUrl(localizedPath(locale, `/insights/${a.slug}`)),
          ...(a.coverImage ? { image: absoluteUrl(a.coverImage) } : {}),
        }}
      />
    </>
  );
}
