import { setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument, loadLegal } from "@/components/legal/LegalDocument";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const locale = toLocale((await params).locale);
  const { draft } = await loadLegal(locale, "privacy");
  return pageMetadata(locale, "privacy", "/privacy", { noindex: draft });
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <LegalDocument locale={locale} doc="privacy">
    </LegalDocument>
  );
}
