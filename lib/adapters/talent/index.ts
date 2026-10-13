import "server-only";
import type { TalentAdapter, TalentProfile, TalentQuery } from "./types";
import { MOCK_TALENT } from "@/data/talent.mock";

function matches(p: TalentProfile, q: TalentQuery) {
  if (q.featured !== undefined && p.featured !== q.featured) return false;
  if (q.role && p.role !== q.role) return false;
  if (q.stack && ![...p.coreStack, ...p.secondaryStack].includes(q.stack)) return false;
  if (q.seniority && p.seniority !== q.seniority) return false;
  if (q.availability && p.availability !== q.availability) return false;
  if (q.english && p.englishLevel !== q.english) return false;
  return true;
}

const mockAdapter: TalentAdapter = {
  async list(q = {}) {
    const out = MOCK_TALENT.filter((p) => matches(p, q)).sort((a, b) => b.availabilityVerifiedAt.localeCompare(a.availabilityVerifiedAt));
    return q.limit ? out.slice(0, q.limit) : out;
  },
};

// Phase 3: `cms` adapter (fetch published + consentToPublish profiles, strip privateCrmId).
export function getTalentAdapter(): TalentAdapter {
  switch (process.env.TALENT_SOURCE ?? "mock") {
    default:
      return mockAdapter;
  }
}
