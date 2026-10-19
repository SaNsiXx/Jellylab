// Legal entity & contact data. EVERY value marked PLACEHOLDER must be replaced before production.
// scripts/check-placeholders.mjs (Phase 3) fails `next build` in production while any remain.

export const PLACEHOLDER = "[DO UZUPEŁNIENIA]";

export const legalEntity = {
  companyLegalName: "JellyLabs", // data controller name as provided by Jelly Labs HR
  registeredAddress: PLACEHOLDER, // PLACEHOLDER
  taxId: PLACEHOLDER, // PLACEHOLDER — NIP
  companyRegisterId: PLACEHOLDER, // PLACEHOLDER — KRS
  contactEmail: "office@jellylabs.tech", // main contact + data protection matters
  contactEmailSecondary: "malgorzata@jellylabs.tech",
  linkedinUrl: "https://www.linkedin.com/company/jellylabs-tech/",
} as const;

export const isPlaceholder = (v: string) => v.includes("DO UZUPEŁNIENIA") || v.includes("[");

export const showDevPlaceholders = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";
