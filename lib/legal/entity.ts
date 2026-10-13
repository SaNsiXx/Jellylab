// Legal entity & contact data. EVERY value marked PLACEHOLDER must be replaced before production.
// scripts/check-placeholders.mjs (Phase 3) fails `next build` in production while any remain.

export const PLACEHOLDER = "[DO UZUPEŁNIENIA]";

export const legalEntity = {
  companyLegalName: PLACEHOLDER, // PLACEHOLDER — full legal name of the data controller
  registeredAddress: PLACEHOLDER, // PLACEHOLDER
  taxId: PLACEHOLDER, // PLACEHOLDER — NIP
  companyRegisterId: PLACEHOLDER, // PLACEHOLDER — KRS
  contactEmail: PLACEHOLDER, // PLACEHOLDER
  linkedinUrl: PLACEHOLDER, // PLACEHOLDER
} as const;

export const isPlaceholder = (v: string) => v.includes("DO UZUPEŁNIENIA") || v.includes("[");

export const showDevPlaceholders = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";
