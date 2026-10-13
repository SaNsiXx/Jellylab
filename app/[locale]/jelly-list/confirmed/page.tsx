import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { routes } from "@/lib/site";
import { StatusScreen } from "@/components/forms/StatusScreen";
import { ConfirmedTracker } from "@/components/forms/ConfirmedTracker";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-list/confirmed">): Promise<Metadata> {
  const t = await getTranslations({ locale: toLocale((await params).locale), namespace: "jellyListPage" });
  return { title: t("confirmedTitle"), robots: { index: false, follow: false } };
}

export default async function ConfirmedPage({ params }: PageProps<"/[locale]/jelly-list/confirmed">) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations();
  return (
    <StatusScreen title={t("jellyListPage.confirmedTitle")} body={t("jellyListPage.confirmedBody")}>
      <ConfirmedTracker />
      <ButtonLink href={routes.talent} variant="secondary" arrow>
        {t("cta.seeTalent")}
      </ButtonLink>
    </StatusScreen>
  );
}
