import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { Link } from "@/i18n/navigation";
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
  const list = t.raw("drop.list") as string[];
  const box = t.raw("jellyListPage.boxList") as string[];

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
        <aside className="grid content-start gap-6 lg:col-span-4 lg:col-start-9">
          <div className="card p-7">
            <p className="font-display font-semibold">{t("drop.listTitle")}</p>
            <ul className="mt-4 grid gap-3">
              {list.map((li) => (
                <li key={li} className="flex gap-3 text-fg/90">
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-orange shadow-[0_0_8px_var(--color-orange)]" />
                  {li}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{t("drop.microcopy")}</p>
          </div>
          <div className="card p-7">
            <CampaignArt name="jelly-box" className="mb-6 border border-line" />
            <p className="font-display font-semibold">{t("jellyListPage.boxTitle")}</p>
            <ul className="mt-4 grid gap-2 text-sm text-muted">
              {box.map((li) => (
                <li key={li}>— {li}</li>
              ))}
            </ul>
            <Link href={routes.jellyBoxTerms} prefetch={false} className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline underline-offset-4 hover:text-cyan">
              {t("jellyListPage.boxTerms")}
            </Link>
          </div>
          <CampaignArt name="tech-bench-inbox" className="border border-line" />
        </aside>
      </section>
    </>
  );
}
