import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import { SignalBar } from "@/components/home/SignalBar";
import {
  ProblemSection,
  SolutionsPreview,
  TalentPreview,
  ProcessSteps,
  JellyDropBlock,
  JellyCrewBlock,
  ValuesGrid,
  ManifestPreview,
  ProofSection,
  FAQSection,
  FinalCTA,
} from "@/components/home/Sections";
import { alternatesFor } from "@/lib/seo";
import { toLocale } from "@/i18n/locale";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: { absolute: t("homeTitle") }, description: t("homeDescription"), alternates: alternatesFor(locale, "/") };
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
      <TalentPreview />
      <ProcessSteps />
      <JellyDropBlock />
      <JellyCrewBlock />
      <ValuesGrid />
      <ManifestPreview />
      <ProofSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
