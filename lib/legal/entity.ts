// Legal entity & contact data. EVERY value marked PLACEHOLDER must be replaced before production.
// scripts/check-placeholders.mjs (Phase 3) fails `next build` in production while any remain.

export const PLACEHOLDER = "[DO UZUPEŁNIENIA]";

export const legalEntity = {
  companyLegalName: "JLTECHNOLOGY sp. z o.o.", // data controller, as registered in KRS (brand: Jelly Labs / JellyLabs)
  registeredAddress: "ul. Zygmunta Augusta 29/2, 34-600 Limanowa, Polska",
  taxId: "NIP 7372261002",
  regon: "REGON 545806942",
  companyRegisterId: "KRS 0001268658",
  contactEmail: "office@jellylabs.tech", // main contact + data protection matters
  contactEmailSecondary: "malgorzata@jellylabs.tech",
  linkedinUrl: "https://www.linkedin.com/company/jellylabs-tech/posts/",
} as const;

export const isPlaceholder = (v: string) => v.includes("DO UZUPEŁNIENIA") || v.includes("[");

export const showDevPlaceholders = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";
