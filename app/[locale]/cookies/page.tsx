import { setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument, loadLegal } from "@/components/legal/LegalDocument";
import { CookieSettingsButton } from "@/components/consent/ConsentBanner";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">) {
  const locale = toLocale((await params).locale);
  const { draft } = await loadLegal(locale, "cookies");
  return pageMetadata(locale, "cookies", "/cookies", { noindex: draft });
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <LegalDocument locale={locale} doc="cookies">
      <CookieSettingsButton className="mt-6 inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm hover:border-cyan" />
    </LegalDocument>
  );
}
