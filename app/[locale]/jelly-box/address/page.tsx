import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { routes } from "@/lib/site";
import { verifyJellyBoxToken } from "@/lib/server/doi";
import { env } from "@/lib/server/env";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { CampaignArt } from "@/components/ui/BrandArt";
import { StatusScreen } from "@/components/forms/StatusScreen";
import { JellyBoxAddressForm } from "@/components/forms/JellyBoxAddressForm";
import { FormBoundary } from "@/components/forms/ui";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-box/address">): Promise<Metadata> {
  const t = await getTranslations({ locale: toLocale((await params).locale), namespace: "meta.pages.jellyBox" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Invitation-only: the signed token (14 days) carries the submission id, email and locale. */
export default async function JellyBoxAddressPage({ params, searchParams }: PageProps<"/[locale]/jelly-box/address">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  const raw = (await searchParams).t;
  const token = typeof raw === "string" ? raw : "";

  if (!env.jellyBoxActive)
    return (
      <StatusScreen variant="error" art="jelly-box" title={t("jellyBox.closedTitle")} body={t("jellyBox.closedBody")}>
        <ButtonLink href={routes.home} variant="secondary">{t("cta.backHome")}</ButtonLink>
      </StatusScreen>
    );

  if (!verifyJellyBoxToken(token))
    return (
      <StatusScreen variant="error" title={t("jellyBox.invalidTitle")} body={t("jellyBox.invalidBody")}>
        <ButtonLink href={routes.home} variant="secondary">{t("cta.backHome")}</ButtonLink>
      </StatusScreen>
    );

  return (
    <>
      <PageHero eyebrow={t("jellyBox.eyebrow")} title={t("jellyBox.title")} intro={t("jellyBox.intro")} accent="heat" />
      <section className="container-jl grid gap-14 pb-24 lg:grid-cols-12 lg:pb-36">
        <div className="lg:col-span-7">
          <h2 className="h3 text-2xl sm:text-3xl">{t("jellyBox.formTitle")}</h2>
          <div className="mt-8">
            <FormBoundary fallback={<p role="alert">{t("forms.errors.server")}</p>}>
              <JellyBoxAddressForm token={token} />
            </FormBoundary>
          </div>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <CampaignArt name="jelly-box" className="border border-line" />
        </aside>
      </section>
    </>
  );
}
