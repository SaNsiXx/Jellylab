import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata, absoluteUrl, localizedPath } from "@/lib/seo";
import { applyHref, developerJoinHref, routes } from "@/lib/site";
import { listJobOffers, type JobOffer } from "@/lib/adapters/careers";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";

// Re-read offers hourly so ones past "valid until" drop off without a redeploy (edits in /keystatic redeploy anyway).
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/careers">) {
  return pageMetadata(toLocale((await params).locale), "careers", routes.careers);
}

const EMPLOYMENT_TYPE: Record<JobOffer["contractType"], string | string[]> = {
  b2b: "CONTRACTOR",
  employment: "FULL_TIME",
  open: ["FULL_TIME", "CONTRACTOR"],
};

/** schema.org JobPosting (Google for Jobs). Remote → TELECOMMUTE; hybrid/onsite → place from the location field. */
function jobPosting(o: JobOffer, locale: "en" | "pl") {
  const remoteOnly = o.workModel.length > 0 && o.workModel.every((m) => m === "remote");
  return {
    "@type": "JobPosting",
    title: o.title[locale],
    description: o.summary[locale],
    datePosted: o.datePosted,
    ...(o.validThrough ? { validThrough: o.validThrough } : {}),
    employmentType: EMPLOYMENT_TYPE[o.contractType],
    hiringOrganization: { "@type": "Organization", name: "Jelly Labs", sameAs: absoluteUrl("/") },
    ...(remoteOnly
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: o.location.en } }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: o.location[locale], addressCountry: "PL" } } }),
    skills: o.stack.join(", "),
    directApply: true,
    url: absoluteUrl(`${localizedPath(locale, routes.forDevelopers)}?offer=${o.id}#join`),
  };
}

export default async function CareersPage({ params }: PageProps<"/[locale]/careers">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("careersPage");
  const tf = await getTranslations("forms.options");
  const tc = await getTranslations("cta");
  const format = await getFormatter();
  const offers = await listJobOffers();

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} accent="green" />
      <section className="container-jl pb-24 lg:pb-36" aria-label={t("listLabel")}>
        {offers.length > 0 ? (
          <ul className="grid gap-5">
            {offers.map((o, i) => (
              <li key={o.id}>
                <Reveal delay={i * 60}>
                  <article className="card grid gap-6 p-7 sm:p-9 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-green/40 px-3 py-1 font-mono text-[0.6875rem] tracking-wider text-green uppercase">
                          {tf(`seniority.${o.seniority}`)}
                        </span>
                        {o.sample && (
                          <span className="rounded-full border border-dashed border-orange/60 px-2.5 py-0.5 font-mono text-[0.6875rem] text-orange">{t("sampleBadge")}</span>
                        )}
                      </div>
                      <h2 className="h3 mt-5 text-2xl sm:text-3xl">{o.title[locale]}</h2>
                      <p className="mt-3 max-w-2xl text-muted">{o.summary[locale]}</p>
                      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="text-muted">{t("contract")}</dt>
                          <dd className="mt-0.5 font-medium">{tf(`contractType.${o.contractType}`)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">{t("workModel")}</dt>
                          <dd className="mt-0.5 font-medium">
                            {[o.location[locale], ...o.workModel.map((m) => tf(`workModel.${m}`))].join(" · ")}
                          </dd>
                        </div>
                        {o.rate && (
                          <div>
                            <dt className="text-muted">{t("rate")}</dt>
                            <dd className="mt-0.5 font-medium tabular">{o.rate}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-muted">{t("posted")}</dt>
                          <dd className="mt-0.5 font-medium">
                            <time dateTime={o.datePosted}>{format.dateTime(new Date(`${o.datePosted}T12:00:00Z`), { day: "numeric", month: "short", year: "numeric" })}</time>
                          </dd>
                        </div>
                      </dl>
                      {o.stack.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={t("stack")}>
                          {o.stack.map((s) => (
                            <li key={s} className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-xs">
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="lg:col-span-3 lg:col-start-10 lg:justify-self-end">
                      <ButtonLink href={applyHref(o.id)} arrow aria-label={`${t("apply")} — ${o.title[locale]}`}>
                        {t("apply")}
                      </ButtonLink>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card p-8 text-center sm:p-12">
            <h2 className="h3 text-2xl">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">{t("emptyBody")}</p>
            <div className="mt-8">
              <ButtonLink href={developerJoinHref} arrow>
                {tc("joinCrew")}
              </ButtonLink>
            </div>
          </div>
        )}
        {offers.length > 0 && (
          <p className="mt-10 text-muted">
            {t("noMatch")}{" "}
            <ButtonLink href={developerJoinHref} variant="ghost" className="inline-flex underline underline-offset-4">
              {tc("joinCrew")}
            </ButtonLink>
          </p>
        )}
      </section>
      {offers.length > 0 && <JsonLd data={{ "@context": "https://schema.org", "@graph": offers.map((o) => jobPosting(o, locale)) }} />}
    </>
  );
}
