import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { ConfirmEmail } from "@/components/forms/ConfirmEmail";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-list/confirm">): Promise<Metadata> {
  const t = await getTranslations({ locale: toLocale((await params).locale), namespace: "jellyListPage" });
  return { title: t("confirmTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function ConfirmPage({ params }: PageProps<"/[locale]/jelly-list/confirm">) {
  setRequestLocale(toLocale((await params).locale));
  return (
    <Suspense>
      <ConfirmEmail />
    </Suspense>
  );
}
