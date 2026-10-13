// Consent wording + versions. Single source for what the visitor SEES and what the CRM STORES.
// Email + phone wording comes from 05_FORMS_LEGAL_CRM.md. Recruitment wording is a DRAFT written
// for this build. ALL versions containing "DRAFT" block a production deploy (scripts/check-placeholders.mjs)
// until approved by legal counsel / DPO. Bump the version whenever the wording changes.
import { legalEntity, isPlaceholder } from "@/lib/legal/entity";

export type ConsentKey = "marketingEmail" | "phone" | "recruitment" | "futureOffers";
type Locale = "en" | "pl";

export const CONSENT_VERSIONS: Record<ConsentKey | "privacyNotice", string> = {
  marketingEmail: "2026-10-DRAFT-1",
  phone: "2026-10-DRAFT-1",
  recruitment: "2026-10-DRAFT-1",
  futureOffers: "2026-10-DRAFT-1",
  privacyNotice: "2026-10-DRAFT-1",
};

export function controllerName(locale: Locale) {
  if (!isPlaceholder(legalEntity.companyLegalName)) return legalEntity.companyLegalName;
  return locale === "pl" ? "[PEŁNA NAZWA ADMINISTRATORA]" : "[FULL CONTROLLER NAME]";
}

export function controllerWithAddress(locale: Locale) {
  const addr = isPlaceholder(legalEntity.registeredAddress) ? (locale === "pl" ? "[ADRES]" : "[ADDRESS]") : legalEntity.registeredAddress;
  return `${controllerName(locale)}, ${addr}`;
}

export function consentText(key: ConsentKey, locale: Locale): string {
  const c = controllerName(locale);
  const texts: Record<ConsentKey, Record<Locale, string>> = {
    marketingEmail: {
      pl: `Chcę otrzymywać od ${c} na podany adres e-mail newsletter „The Jelly Signal” oraz informacje handlowe i marketingowe dotyczące usług Jelly Labs. Wiem, że zgodę mogę wycofać w każdym czasie.`,
      en: `I would like to receive “The Jelly Signal” newsletter and commercial and marketing information about Jelly Labs services from ${c} at the email address provided. I understand that I may withdraw my consent at any time.`,
    },
    phone: {
      pl: `Wyrażam zgodę na kontakt telefoniczny przez ${c} w celu przedstawiania informacji handlowych i marketingowych dotyczących usług Jelly Labs. Wiem, że zgodę mogę wycofać w każdym czasie.`,
      en: `I agree to be contacted by phone by ${c} to receive commercial and marketing information about Jelly Labs services. I understand that I may withdraw my consent at any time.`,
    },
    // DRAFT — not in the brand pack; requires legal approval.
    recruitment: {
      pl: `Wyrażam zgodę na przetwarzanie moich danych osobowych przez ${c} w celu prowadzenia procesów rekrutacyjnych do projektów, na które każdorazowo wyrażę zgodę. Mój profil może zostać przekazany klientowi wyłącznie po uprzednim uzgodnieniu ze mną. Wiem, że zgodę mogę wycofać w każdym czasie.`,
      en: `I agree to ${c} processing my personal data to run recruitment processes for opportunities I agree to each time. My profile may only be shared with a client after it has been agreed with me first. I understand that I may withdraw my consent at any time.`,
    },
    // DRAFT — retention period to be set by legal.
    futureOffers: {
      pl: `Wyrażam zgodę na przetwarzanie moich danych osobowych przez ${c} na potrzeby przyszłych procesów rekrutacyjnych i informowania mnie o nowych ofertach dopasowanych do mojego profilu. Wiem, że zgodę mogę wycofać w każdym czasie.`,
      en: `I agree to ${c} processing my personal data for future recruitment processes and to inform me about new opportunities matching my profile. I understand that I may withdraw my consent at any time.`,
    },
  };
  return texts[key][locale];
}

export type ConsentRecord = { key: ConsentKey; granted: boolean; text: string; version: string };

export function consentRecord(key: ConsentKey, granted: boolean, locale: Locale): ConsentRecord {
  return { key, granted, text: consentText(key, locale), version: CONSENT_VERSIONS[key] };
}
