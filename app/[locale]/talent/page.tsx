import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { getTalentAdapter } from "@/lib/adapters/talent";
import { PageHero } from "@/components/ui/PageHero";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { TalentExplorer } from "@/components/talent/TalentExplorer";
import { TalentCard } from "@/components/talent/TalentCard";

export async function generateMetadata({ params }: PageProps<"/[locale]/talent">) {
  return pageMetadata(toLocale((await params).locale), "talent", routes.talent);
}

export default async function TalentPage({ params }: PageProps<"/[locale]/talent">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("talentPage");
  const tt = await getTranslations("talent");
  const profiles = await getTalentAdapter().list();

  return (
    <>
      <PageHero eyebrow={tt("eyebrow")} title={t("title")} intro={t("intro")} accent="green">
        <p className="mt-6 max-w-xl text-sm text-muted">{tt("disclaimer")}</p>
      </PageHero>
      <div className="container-jl pb-8">
        {/* Filters read the URL (useSearchParams) → client boundary needs Suspense for static rendering. */}
        <Suspense
          fallback={
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <li key={p.id}>
                  <TalentCard profile={p} headingLevel="h2" />
                </li>
              ))}
            </ul>
          }
        >
          <TalentExplorer profiles={profiles} />
        </Suspense>
      </div>
      <NewsletterCTA title={t("newsletterTitle")} body={t("newsletterBody")} />
    </>
  );
}
