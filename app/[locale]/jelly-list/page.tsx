import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { JellyListForm } from "@/components/forms/JellyListForm";
import { FormBoundary } from "@/components/forms/ui";
import { CampaignArt } from "@/components/ui/BrandArt";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-list">) {
  return pageMetadata(toLocale((await params).locale), "jellyList", routes.jellyList);
}

export default async function JellyListPage({ params }: PageProps<"/[locale]/jelly-list">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <PageHero eyebrow={t("drop.eyebrow")} title={t("drop.title")} intro={t("drop.body")} accent="heat" />
      <section className="container-jl grid gap-14 pb-24 lg:grid-cols-12 lg:pb-36">
        <div className="lg:col-span-7">
          <h2 className="h3 text-2xl sm:text-3xl">{t("jellyListPage.formTitle")}</h2>
          <div className="mt-8">
            <FormBoundary fallback={<p role="alert">{t("forms.errors.server")}</p>}>
              <JellyListForm />
            </FormBoundary>
          </div>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <CampaignArt name="tech-bench-inbox" className="border border-line lg:sticky lg:top-28" />
        </aside>
      </section>
    </>
  );
}
