import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">) {
  return pageMetadata(toLocale((await params).locale), "howItWorks", routes.howItWorks);
}

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  const steps = t.raw("howPage.steps") as { title: string; body: string }[];

  return (
    <>
      <PageHero title={t("howPage.title")} accent="blue">
        <Eyebrow accent="blue" className="mt-8">{t("process.eyebrow")}</Eyebrow>
      </PageHero>
      <section className="container-jl pb-24 lg:pb-36">
        <ol className="relative grid gap-4 before:absolute before:top-6 before:bottom-6 before:left-[1.45rem] before:w-px before:bg-[linear-gradient(var(--color-cyan),var(--color-violet),transparent)] sm:gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative pl-16 sm:pl-20">
              <Reveal delay={i * 70}>
                <span aria-hidden="true" className="absolute top-6 left-0 flex size-12 items-center justify-center rounded-full border border-cyan/60 bg-bg font-mono text-sm text-cyan shadow-[0_0_18px_-4px_var(--color-cyan)]">
                  0{i + 1}
                </span>
                <div className="card p-6 sm:p-8">
                  <h2 className="h3 text-2xl sm:text-3xl">{s.title}</h2>
                  <p className="mt-3 max-w-2xl text-lg text-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="mt-14 pl-16 sm:pl-20">
          <ButtonLink href={routes.contact} arrow>
            {t("cta.startConversation")}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
