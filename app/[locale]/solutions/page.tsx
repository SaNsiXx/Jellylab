import { getTranslations, setRequestLocale } from "next-intl/server";
import { UsersThree, StackSimple, Compass } from "@phosphor-icons/react/dist/ssr";
import { toLocale } from "@/i18n/locale";
import { pageMetadata, absoluteUrl, localizedPath } from "@/lib/seo";
import { crewHref, routes } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { FinalCTA } from "@/components/home/Sections";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({ params }: PageProps<"/[locale]/solutions">) {
  return pageMetadata(toLocale((await params).locale), "solutions", routes.solutions);
}

export default async function SolutionsPage({ params }: PageProps<"/[locale]/solutions">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("solutionsPage");
  const tc = await getTranslations("cta");
  const caps = t.raw("capabilities") as { area: string; stack: string }[];

  const services = [
    { key: "staffAug", Icon: UsersThree, list: t.raw("staffAug.list") as string[], cta: tc("requestSpecialists") },
    { key: "teams", Icon: StackSimple, list: t.raw("teams.list") as string[], cta: tc("designTeam") },
    { key: "leadership", Icon: Compass, list: [] as string[], cta: tc("talkProblem") },
  ] as const;

  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} accent="blue" />
      <Section className="pt-0 lg:pt-0">
        <div className="grid gap-5">
          {services.map(({ key, Icon, list, cta }, i) => (
            <Reveal key={key} delay={i * 60}>
              <article id={key} className="card grid gap-8 p-7 sm:p-10 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-6">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-line bg-white/[0.03] text-cyan">
                    <Icon size={24} weight="light" aria-hidden="true" />
                  </span>
                  <h2 className="h2 mt-8 text-[clamp(1.75rem,3vw,2.5rem)]">{t(`${key}.title`)}</h2>
                  <p className="mt-4 text-lg text-muted">{t(`${key}.body`)}</p>
                  <div className="mt-8">
                    <ButtonLink href={crewHref()} variant="secondary" arrow>
                      {cta}
                    </ButtonLink>
                  </div>
                </div>
                {list.length > 0 && (
                  <div className="lg:col-span-5 lg:col-start-8">
                    <p className="eyebrow">{t(`${key}.listTitle` as "staffAug.listTitle")}</p>
                    <ul className="mt-5 grid gap-3">
                      {list.map((li) => (
                        <li key={li} className="flex gap-3 border-b border-line pb-3 text-fg/90">
                          <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section labelledBy="caps-title" className="border-t border-line">
        <h2 id="caps-title" className="h2">{t("capabilitiesTitle")}</h2>
        <dl className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {caps.map((c) => (
            <div key={c.area} className="bg-bg p-7">
              <dt className="font-display text-xl font-semibold tracking-tight">{c.area}</dt>
              <dd className="mt-2 font-mono text-sm text-muted">{c.stack}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <FinalCTA />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": services.map(({ key }) => ({
            "@type": "Service",
            name: t(`${key}.title`),
            description: t(`${key}.body`),
            serviceType: "IT staff augmentation",
            areaServed: ["PL", "DE", "AT", "CH", "GB", "EU"],
            provider: { "@type": "Organization", name: "Jelly Labs", url: absoluteUrl("/") },
            url: absoluteUrl(`${localizedPath(locale, routes.solutions)}#${key}`),
          })),
        }}
      />
    </>
  );
}
