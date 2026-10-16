import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { ContactSwitcher } from "@/components/forms/ContactSwitcher";
import { ContactDetails } from "@/components/layout/ContactDetails";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  return pageMetadata(toLocale((await params).locale), "contact", routes.contact);
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");

  return (
    <>
      <PageHero title={t("title")} accent="blue" />
      <section className="container-jl grid gap-14 pb-24 lg:grid-cols-12 lg:pb-36">
        <div className="lg:col-span-8">
          {/* Reads ?form= → client boundary inside Suspense keeps the page static. */}
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <ContactSwitcher />
          </Suspense>
        </div>
        <aside aria-labelledby="alt-title" className="lg:col-span-3 lg:col-start-10">
          <h2 id="alt-title" className="eyebrow">{t("altTitle")}</h2>
          <ContactDetails />
        </aside>
      </section>
    </>
  );
}
