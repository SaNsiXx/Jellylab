import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { CandidateForm } from "@/components/forms/CandidateForm";
import { FormBoundary } from "@/components/forms/ui";
import { JsonLd } from "@/components/seo/JsonLd";
import { NeonHeadline } from "@/components/ui/NeonHeadline";

export async function generateMetadata({ params }: PageProps<"/[locale]/for-developers">) {
  return pageMetadata(toLocale((await params).locale), "forDevelopers", routes.forDevelopers);
}

export default async function ForDevelopersPage({ params }: PageProps<"/[locale]/for-developers">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("devPage");
  const tc = await getTranslations("cta");
  const te = await getTranslations("forms.errors");
  const expect = t.raw("expect") as string[];
  const process = t.raw("process") as string[];
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} accent="green">
        <div className="mt-10">
          <ButtonLink href="#join" arrow>
            {tc("joinCrew")}
          </ButtonLink>
        </div>
      </PageHero>

      <Section className="pt-0 lg:pt-0">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="h3 text-2xl sm:text-3xl">{t("expectTitle")}</h2>
            <ul className="mt-6 grid gap-3">
              {expect.map((e) => (
                <li key={e} className="flex gap-3 border-b border-line pb-3 text-lg text-fg/90">
                  <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
                  {e}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="h3 text-2xl sm:text-3xl">{t("processTitle")}</h2>
            <ol className="mt-6 grid gap-3">
              {process.map((p, i) => (
                <li key={p} className="card flex items-center gap-5 p-5">
                  <span className="font-mono text-sm text-green">0{i + 1}</span>
                  <span className="font-display text-lg font-medium tracking-tight">{p}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>

      <Section id="join" labelledBy="join-title" className="border-t border-line">
        <div className="mx-auto max-w-3xl">
          <h2 id="join-title" className="h2"><NeonHeadline text={t("formTitle")} /></h2>
          <div className="mt-10">
            <FormBoundary fallback={<p role="alert">{te("server")}</p>}>
              <CandidateForm />
            </FormBoundary>
          </div>
        </div>
      </Section>

      <Section labelledBy="dev-faq-title" className="border-t border-line">
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 id="dev-faq-title" className="h2 lg:col-span-4"><NeonHeadline text={t("faqTitle")} /></h2>
          <div className="divide-y divide-line border-y border-line lg:col-span-8">
            {faq.map((i) => (
              <details key={i.q} className="group">
                <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 font-display text-lg font-medium tracking-tight sm:text-xl [&::-webkit-details-marker]:hidden">
                  {i.q}
                  <span aria-hidden="true" className="relative size-5 shrink-0 text-muted transition-transform duration-[var(--duration-standard)] group-open:rotate-45">
                    <span className="absolute top-1/2 left-0 h-px w-5 bg-current" />
                    <span className="absolute top-0 left-1/2 h-5 w-px bg-current" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-muted">{i.a}</p>
              </details>
            ))}
          </div>
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
          }}
        />
      </Section>
    </>
  );
}
