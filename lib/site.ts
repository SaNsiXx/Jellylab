// Route and navigation config. Slugs are identical in EN and PL (brief §13.5).

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const routes = {
  home: "/",
  solutions: "/solutions",
  talent: "/talent",
  howItWorks: "/how-it-works",
  forDevelopers: "/for-developers",
  about: "/about",
  insights: "/insights",
  jellyList: "/jelly-list",
  contact: "/contact",
  privacy: "/privacy",
  cookies: "/cookies",
  jellyBoxTerms: "/jelly-box-terms",
} as const;

/** Where "BUILD YOUR CREW" and "REQUEST PROFILE" land (see Phase 1 decision). */
export const crewHref = (profileId?: string) => ({
  pathname: routes.contact,
  query: profileId ? { form: "crew", profile: profileId } : { form: "crew" },
});

export const developerJoinHref = `${routes.forDevelopers}#join`;

export type NavKey = "solutions" | "talent" | "howItWorks" | "forDevelopers" | "about" | "insights";

export const mainNav: { key: NavKey; href: string }[] = [
  { key: "solutions", href: routes.solutions },
  { key: "talent", href: routes.talent },
  { key: "howItWorks", href: routes.howItWorks },
  { key: "forDevelopers", href: routes.forDevelopers },
  { key: "about", href: routes.about },
  { key: "insights", href: routes.insights },
];
