import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { AnalyticsScripts } from "@/components/consent/AnalyticsScripts";
import { MicroInteractions } from "@/components/ui/MicroInteractions";
import { Backdrop } from "@/components/layout/Backdrop";
import "../globals.css";
import { toLocale } from "@/i18n/locale";

// next/font self-hosts at build time: no requests to Google from the visitor's browser (GDPR).
// Same faces as Jelly Match: the parent brand and its products read as one family.
const display = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});
const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  // Body text is never the LCP element (the Outfit H1 is), so don't compete for early bandwidth.
  preload: false,
});
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], weight: ["400"], variable: "--font-jetbrains", display: "swap", preload: false });

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  colorScheme: "dark",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("homeTitle"), template: `%s — ${t("siteName")}` },
    description: t("homeDescription"),
    applicationName: t("siteName"),
    openGraph: { siteName: t("siteName"), type: "website", locale: locale === "pl" ? "pl_PL" : "en_GB" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("a11y");

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        {/* Living backdrop: drifting auras, cursor-lit dot grid, glossy droplets (see components/layout/Backdrop.tsx). */}
        <Backdrop />
        <div className="grain" aria-hidden="true" />
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-5 focus:py-3 focus:font-semibold focus:text-bg"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
          <ConsentBanner />
          <AnalyticsScripts />
          <MicroInteractions />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
