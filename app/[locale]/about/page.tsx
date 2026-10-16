import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { showDevPlaceholders } from "@/lib/legal/entity";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { NeonHeadline } from "@/components/ui/NeonHeadline";
import { ContactDetails } from "@/components/layout/ContactDetails";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  return pageMetadata(toLocale((await params).locale), "about", routes.about);
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const tc = await getTranslations("cta");
  const paras = t.raw("paragraphs") as string[];
  const manifesto = t.raw("manifesto") as string[];

  return (
    <>
      <PageHero title={t("title")} accent="heat">
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted uppercase">{t("location")}</p>
      </PageHero>

      <Section className="pt-0 lg:pt-0">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {paras.map((p, i) => (
              <Reveal key={p} delay={i * 60}>
                <p className={`${i === 0 ? "font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl" : "mt-6 text-lg text-muted"}`}>{p}</p>
              </Reveal>
            ))}
          </div>
          {/* "Our principles" replaced by a contact block (PDF p.10). */}
          <aside aria-labelledby="about-contact-title" className="lg:col-span-4 lg:col-start-9">
            <div className="card p-7">
              <h2 id="about-contact-title" className="eyebrow">{t("contactTitle")}</h2>
              <p className="mt-5 font-display text-xl font-medium tracking-tight">{t("contactBody")}</p>
              <ContactDetails />
              <div className="mt-8">
                <ButtonLink href={routes.contact} arrow>
                  {tc("talkHuman")}
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <section aria-labelledby="manifesto-title" className="relative isolate overflow-hidden border-y border-line py-24 lg:py-40">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -z-10 h-80 w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[image:var(--gradient-blue-jelly)] opacity-15 blur-3xl" />
        <div className="container-jl max-w-4xl text-center">
          <h2 id="manifesto-title" className="eyebrow justify-center">{t("manifestoTitle")}</h2>
          <p className="h2 mt-8"><NeonHeadline text={manifesto[0] ?? ""} /></p>
          <p className="lead mx-auto mt-8">{manifesto[1]}</p>
          <p className="neon-text mt-10 inline-block font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("manifestoEnd")}</p>
        </div>
      </section>

      {showDevPlaceholders && (
        <Section labelledBy="team-title">
          <h2 id="team-title" className="h3 text-2xl">{t("teamTitle")}</h2>
          <p className="mt-4 rounded-2xl border border-dashed border-orange/50 p-5 font-mono text-sm text-orange">{t("teamPlaceholder")}</p>
        </Section>
      )}

      <div className="container-jl pb-24 lg:pb-36">
        <ButtonLink href={routes.contact} arrow>
          {tc("workWithJelly")}
        </ButtonLink>
      </div>
    </>
  );
}
