"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArticleMeta, Category } from "@/lib/adapters/insights";
import { plainHeadline } from "@/components/ui/NeonHeadline";

const CATS: Category[] = ["jelly_drop", "market_signals", "delivery", "people", "ai_technology"];

export function ArticleCard({ a }: { a: ArticleMeta }) {
  const t = useTranslations("insightsPage");
  const format = useFormatter();
  return (
    <article className="card group relative flex h-full flex-col p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan/40 px-3 py-1 font-mono text-[0.6875rem] tracking-wider text-cyan uppercase">{t(`categories.${a.category}`)}</span>
        {a.sample && <span className="rounded-full border border-dashed border-orange/60 px-2.5 py-0.5 font-mono text-[0.6875rem] text-orange">{t("sampleBadge")}</span>}
      </div>
      <h2 className="h3 mt-6 text-2xl">
        <Link href={`/insights/${a.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] hover:text-cyan">
          {plainHeadline(a.title)}
        </Link>
      </h2>
      <p className="mt-3 text-muted">{a.excerpt}</p>
      <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-6 text-sm text-muted">
        <time dateTime={a.publishedAt}>{format.dateTime(new Date(a.publishedAt), { day: "numeric", month: "short", year: "numeric" })}</time>
        <span>{t("readTime", { minutes: a.readMinutes })}</span>
      </p>
    </article>
  );
}

export function InsightsIndex({ articles }: { articles: ArticleMeta[] }) {
  const t = useTranslations("insightsPage");
  const [cat, setCat] = useState<Category | "all">("all");
  const shown = cat === "all" ? articles : articles.filter((a) => a.category === cat);
  const chip = (value: Category | "all", label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={cat === value}
      onClick={() => setCat(value)}
      className="min-h-11 rounded-full border border-line px-4 text-sm transition-colors hover:border-white/30 aria-pressed:border-cyan aria-pressed:bg-cyan/10 aria-pressed:text-fg aria-pressed:shadow-[0_0_18px_-6px_var(--color-cyan)] text-muted"
    >
      {label}
    </button>
  );
  return (
    <div>
      <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {chip("all", t("all"))}
        {CATS.map((c) => chip(c, t(`categories.${c}`)))}
      </div>
      {shown.length > 0 ? (
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <li key={a.slug}>
              <ArticleCard a={a} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-10 p-10 text-center">
          <h2 className="h3 text-2xl">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
