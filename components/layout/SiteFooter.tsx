import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/site";
import { legalEntity, isPlaceholder } from "@/lib/legal/entity";
import { Wordmark } from "./Wordmark";
import { CookieSettingsButton } from "@/components/consent/ConsentBanner";

function Placeholder({ children }: { children: string }) {
  return <span className="rounded-md border border-dashed border-orange/50 px-1.5 py-0.5 font-mono text-xs text-orange">{children}</span>;
}

export async function SiteFooter() {
  const t = await getTranslations();
  const links = [
    { href: routes.solutions, label: t("nav.solutions") },
    { href: routes.talent, label: t("nav.talent") },
    { href: routes.forDevelopers, label: t("nav.forDevelopers") },
    { href: routes.about, label: t("nav.about") },
    { href: routes.insights, label: t("nav.insights") },
    { href: routes.contact, label: t("nav.contact") },
  ];
  const legal = [
    { href: routes.privacy, label: t("footer.legal.privacy") },
    { href: routes.cookies, label: t("footer.legal.cookies") },
    { href: routes.jellyBoxTerms, label: t("footer.legal.jellyBox") },
  ];
  const { companyLegalName, registeredAddress, companyRegisterId, taxId, contactEmail, linkedinUrl } = legalEntity;
  const companyLine = [companyLegalName, registeredAddress, companyRegisterId, taxId];

  return (
    <footer className="relative border-t border-line">
      <div className="container-jl grid gap-14 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-5">
          <Wordmark className="h-8 w-auto" />
          <p className="mt-6 max-w-sm text-muted">{t("footer.tagline")}</p>
          <p className="mt-10 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("footer.claim")}</p>
        </div>

        <nav aria-label={t("a11y.footerNav")} className="lg:col-span-3">
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center text-muted transition-colors hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className="grid content-start gap-3 not-italic text-muted lg:col-span-4">
          <p>{t("footer.location")}</p>
          <p>
            {isPlaceholder(contactEmail) ? (
              <Placeholder>{`E-mail: ${contactEmail}`}</Placeholder>
            ) : (
              <a href={`mailto:${contactEmail}`} className="hover:text-fg">{contactEmail}</a>
            )}
          </p>
          <p>
            {isPlaceholder(linkedinUrl) ? (
              <Placeholder>{`LinkedIn: ${linkedinUrl}`}</Placeholder>
            ) : (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                LinkedIn <span className="sr-only">{t("a11y.external")}</span>
              </a>
            )}
          </p>
        </address>
      </div>

      <div className="border-t border-line">
        <div className="container-jl flex flex-col gap-4 py-6 text-sm text-muted lg:flex-row lg:items-center lg:justify-between">
          <p className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} Jelly Labs.</span>
            <span className="sr-only">{t("footer.companyLabel")}:</span>
            {companyLine.some(isPlaceholder) ? (
              <Placeholder>{`${t("footer.companyLabel")}: [PEŁNA NAZWA, ADRES, KRS/NIP — DO UZUPEŁNIENIA]`}</Placeholder>
            ) : (
              <span>{companyLine.join(" · ")}</span>
            )}
          </p>
          <nav aria-label={t("a11y.legalNav")}>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="inline-flex min-h-10 items-center hover:text-fg" />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
