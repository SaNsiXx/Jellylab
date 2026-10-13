import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { getInsights } from "@/lib/adapters/insights";
import { PageHero } from "@/components/ui/PageHero";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { InsightsIndex } from "@/components/insights/InsightsIndex";

export async function generateMetadata({ params }: PageProps<"/[locale]/insights">) {
  return pageMetadata(toLocale((await params).locale), "insights", routes.insights);
}

export default async function InsightsPage({ params }: PageProps<"/[locale]/insights">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("insightsPage");
  const tc = await getTranslations("cta");
  const articles = await getInsights().list(locale);

  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} accent="blue" />
      <section className="container-jl pb-8">
        <InsightsIndex articles={articles} />
      </section>
      <NewsletterCTA title={t("newsletterTitle")} body={t("newsletterBody")} cta={tc("getSignal")} />
    </>
  );
}
