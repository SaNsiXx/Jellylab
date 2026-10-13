import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { StatusScreen } from "@/components/forms/StatusScreen";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-list/check-inbox">): Promise<Metadata> {
  const t = await getTranslations({ locale: toLocale((await params).locale), namespace: "jellyListPage" });
  return { title: t("checkTitle"), robots: { index: false, follow: false } };
}

export default async function CheckInboxPage({ params }: PageProps<"/[locale]/jelly-list/check-inbox">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("jellyListPage");
  return <StatusScreen variant="mail" title={t("checkTitle")} body={t("checkBody")} hint={t("checkHint")} />;
}
