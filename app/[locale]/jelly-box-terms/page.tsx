import { setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument, loadLegal } from "@/components/insights/LegalDocument";

export async function generateMetadata({ params }: PageProps<"/[locale]/jelly-box-terms">) {
  const locale = toLocale((await params).locale);
  const { draft } = await loadLegal(locale, "jelly-box-terms");
  return pageMetadata(locale, "jellyBoxTerms", "/jelly-box-terms", { noindex: draft });
}

export default async function Page({ params }: PageProps<"/[locale]/jelly-box-terms">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <LegalDocument locale={locale} doc="jelly-box-terms">
    </LegalDocument>
  );
}
