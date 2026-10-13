// TEMPORARY (Phase 2 review): stub for routes built in Phase 3, so navigation can be reviewed end-to-end.
// Each real route (app/[locale]/solutions/page.tsx, …) takes precedence over this dynamic segment and
// this file is deleted once all of them exist.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/site";
import { toLocale } from "@/i18n/locale";

const PENDING = ["solutions", "talent", "how-it-works", "for-developers", "about", "insights", "jelly-list", "contact", "privacy", "cookies", "jelly-box-terms"] as const;
type Pending = (typeof PENDING)[number];
const isPending = (s: string): s is Pending => (PENDING as readonly string[]).includes(s);

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PENDING.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = toLocale((await params).locale);
  if (!isPending(slug)) return {};
  const t = await getTranslations({ locale, namespace: "pending" });
  return { title: t(`titles.${slug}`), robots: { index: false } };
}

export default async function PendingPage({ params }: PageProps<"/[locale]/[slug]">) {
  const { slug } = await params;
  const locale = toLocale((await params).locale);
  if (!isPending(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <section className="container-jl flex min-h-[80svh] flex-col justify-center pt-32 pb-20">
      <p className="eyebrow">/{slug}</p>
      <h1 className="h2 mt-6 max-w-4xl">{t(`pending.titles.${slug}`)}</h1>
      <p className="mt-6 rounded-xl border border-dashed border-orange/50 px-4 py-3 font-mono text-sm text-orange self-start">{t("pending.note")}</p>
      <div className="mt-10">
        <ButtonLink href={routes.home} variant="secondary">{t("cta.backHome")}</ButtonLink>
      </div>
    </section>
  );
}
