// Mirrors talentProfile in 08_CMS_CONTENT_MODEL.json, minus fields that must never reach the browser
// (privateCrmId). Adapters are responsible for stripping them.

export type Seniority = "mid" | "senior" | "lead" | "architect";
export type Availability = "immediate" | "2_weeks" | "1_month" | "future";
export type EnglishLevel = "B2" | "C1" | "C2";
export type WorkModel = "remote" | "hybrid" | "onsite";

export type TalentProfile = {
  id: string;
  publicSlug: string;
  publicTitle: { en: string; pl: string };
  role: string;
  seniority: Seniority;
  coreStack: string[];
  secondaryStack: string[];
  availability: Availability;
  availabilityVerifiedAt: string; // ISO datetime
  englishLevel: EnglishLevel;
  location: { en: string; pl: string };
  workModel: WorkModel[];
  engagementModel: string[];
  featured: boolean;
  /** True when the record is placeholder/sample content and must show a visible badge. */
  isSample: boolean;
};

export type TalentQuery = {
  featured?: boolean;
  limit?: number;
  role?: string;
  stack?: string;
  seniority?: Seniority;
  availability?: Availability;
  english?: EnglishLevel;
};

export interface TalentAdapter {
  list(query?: TalentQuery): Promise<TalentProfile[]>;
}
