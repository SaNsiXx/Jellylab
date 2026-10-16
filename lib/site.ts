// Route and navigation config. Slugs are identical in EN and PL (brief §13.5).

// Production: NEXT_PUBLIC_SITE_URL=https://jellylabs.com. Vercel previews fall back to the project's stable alias
// (server-side only: canonical, sitemap, structured data), local dev to localhost.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const routes = {
  home: "/",
  solutions: "/solutions",
  forDevelopers: "/for-developers",
  careers: "/careers",
  about: "/about",
  jellyList: "/jelly-list",
  contact: "/contact",
  privacy: "/privacy",
  cookies: "/cookies",
} as const;

/** Where "BUILD YOUR CREW" / "ASK ABOUT SPECIALISTS" land: the client request form on the contact page. */
export const crewHref = () => ({ pathname: routes.contact, query: { form: "crew" } });

export const developerJoinHref = `${routes.forDevelopers}#join`;

/** Apply for a specific job offer: candidate form with the offer id prefilled. */
export const applyHref = (offerId: string) => ({ pathname: routes.forDevelopers, query: { offer: offerId }, hash: "join" });

export type NavKey = "solutions" | "forDevelopers" | "careers" | "about";

export const mainNav: { key: NavKey; href: string }[] = [
  { key: "solutions", href: routes.solutions },
  { key: "forDevelopers", href: routes.forDevelopers },
  { key: "careers", href: routes.careers },
  { key: "about", href: routes.about },
];
