import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { legalEntity, isPlaceholder } from "@/lib/legal/entity";
import { PageHero } from "@/components/ui/PageHero";
import { ContactSwitcher } from "@/components/forms/ContactSwitcher";
import { TrackedLink } from "@/components/ui/TrackedLink";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  return pageMetadata(toLocale((await params).locale), "contact", routes.contact);
}

function Pending({ value }: { value: string }) {
  return <span className="rounded-md border border-dashed border-orange/50 px-1.5 py-0.5 font-mono text-xs text-orange">{value}</span>;
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const tAlly = await getTranslations("a11y");
  const { contactEmail, linkedinUrl } = legalEntity;

  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} accent="blue" />
      <section className="container-jl grid gap-14 pb-24 lg:grid-cols-12 lg:pb-36">
        <div className="lg:col-span-8">
          {/* Reads ?form= and ?profile= → client boundary inside Suspense keeps the page static. */}
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <ContactSwitcher />
          </Suspense>
        </div>
        <aside aria-labelledby="alt-title" className="lg:col-span-3 lg:col-start-10">
          <h2 id="alt-title" className="eyebrow">{t("altTitle")}</h2>
          <dl className="mt-6 grid gap-6">
            <div>
              <dt className="text-sm text-muted">{t("email")}</dt>
              <dd className="mt-1">
                {isPlaceholder(contactEmail) ? (
                  <Pending value={contactEmail} />
                ) : (
                  <TrackedLink plain href={`mailto:${contactEmail}`} event="contact_click" eventProps={{ method: "email" }} className="text-lg hover:text-cyan">
                    {contactEmail}
                  </TrackedLink>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t("linkedin")}</dt>
              <dd className="mt-1">
                {isPlaceholder(linkedinUrl) ? (
                  <Pending value={linkedinUrl} />
                ) : (
                  <TrackedLink plain href={linkedinUrl} target="_blank" rel="noopener noreferrer" event="contact_click" eventProps={{ method: "linkedin" }} className="text-lg hover:text-cyan">
                    LinkedIn <span className="sr-only">{tAlly("external")}</span>
                  </TrackedLink>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t("location")}</dt>
              <dd className="mt-1 text-lg">{t("locationValue")}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </>
  );
}
