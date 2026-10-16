import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import { SignalBar } from "@/components/home/SignalBar";
import {
  ProblemSection,
  SolutionsPreview,
  ProcessSteps,
  JellyDropBlock,
  JellyCrewBlock,
  ValuesGrid,
  ManifestPreview,
  ProofSection,
  FAQSection,
  FinalCTA,
} from "@/components/home/Sections";
import { alternatesFor, localizedPath, ogImage } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { legalEntity, isPlaceholder } from "@/lib/legal/entity";
import { JsonLd } from "@/components/seo/JsonLd";
import { toLocale } from "@/i18n/locale";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const th = await getTranslations({ locale, namespace: "hero" });
  const image = ogImage(th("title"));
  return {
    title: { absolute: t("homeTitle") },
    description: t("homeDescription"),
    alternates: alternatesFor(locale, "/"),
    openGraph: { title: t("homeTitle"), description: t("homeDescription"), url: localizedPath(locale, "/"), images: [image] },
    twitter: { card: "summary_large_image", images: [image.url] },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <SignalBar />
      <ProblemSection />
      <SolutionsPreview />
      <ProcessSteps />
      <JellyDropBlock />
      <JellyCrewBlock />
      <ValuesGrid />
      <ManifestPreview />
      <ProofSection />
      <FAQSection />
      <FinalCTA />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Jelly Labs",
          url: SITE_URL,
          logo: `${SITE_URL}/brand/jellylabs-wordmark.png`,
          slogan: "Hard problems. Fluid teams.",
          description: "Verified tech talent and flexible delivery teams.",
          areaServed: ["PL", "DE", "AT", "CH", "GB", "EU"],
          ...(isPlaceholder(legalEntity.linkedinUrl) ? {} : { sameAs: [legalEntity.linkedinUrl] }),
          ...(isPlaceholder(legalEntity.companyLegalName) ? {} : { legalName: legalEntity.companyLegalName }),
        }}
      />
    </>
  );
}
