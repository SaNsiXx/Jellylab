import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { TalentAdapter, TalentProfile, TalentQuery } from "./types";

// Talent data source. Default ("files"): one JSON file per profile in content/talent/, editable in the
// Keystatic panel (/keystatic) or by hand. To use an external CMS instead, implement a TalentAdapter and
// select it with TALENT_SOURCE (see docs/INTEGRATIONS.md → "Talent data").
//
// Publishing rules (never relaxed): only `published && consentToPublish` profiles are returned, and no
// private CRM identifiers ever leave the server. Sample profiles (`sample: true`) are shown on local and
// preview deployments with a visible badge, and are hidden on the live site (DEPLOY_ENV=production).

type TalentFile = {
  id: string;
  publicTitle: { en: string; pl: string };
  role: string;
  seniority: TalentProfile["seniority"];
  coreStack: string[];
  secondaryStack?: string[];
  availability: TalentProfile["availability"];
  availabilityVerifiedAt: string; // YYYY-MM-DD
  englishLevel: TalentProfile["englishLevel"];
  location: { en: string; pl: string };
  workModel: TalentProfile["workModel"];
  engagementModel?: string[];
  featured?: boolean;
  published?: boolean;
  consentToPublish?: boolean;
  sample?: boolean;
  privateCrmId?: string; // allowed in the file, stripped here
};

const DIR = path.join(process.cwd(), "content", "talent");
const showSamples = process.env.DEPLOY_ENV !== "production";

function matches(p: TalentProfile, q: TalentQuery) {
  if (q.featured !== undefined && p.featured !== q.featured) return false;
  if (q.role && p.role !== q.role) return false;
  if (q.stack && ![...p.coreStack, ...p.secondaryStack].includes(q.stack)) return false;
  if (q.seniority && p.seniority !== q.seniority) return false;
  if (q.availability && p.availability !== q.availability) return false;
  if (q.english && p.englishLevel !== q.english) return false;
  return true;
}

async function loadFiles(): Promise<TalentProfile[]> {
  let names: string[] = [];
  try {
    names = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const profiles = await Promise.all(
    names.map(async (name): Promise<TalentProfile | null> => {
      const f = JSON.parse(await readFile(path.join(DIR, name), "utf8")) as TalentFile;
      if (!f.published || !f.consentToPublish) return null;
      if (f.sample && !showSamples) return null;
      return {
        id: f.id,
        publicSlug: name.replace(/\.json$/, ""),
        publicTitle: f.publicTitle,
        role: f.role,
        seniority: f.seniority,
        coreStack: f.coreStack ?? [],
        secondaryStack: f.secondaryStack ?? [],
        availability: f.availability,
        availabilityVerifiedAt: new Date(`${f.availabilityVerifiedAt.slice(0, 10)}T09:00:00Z`).toISOString(),
        englishLevel: f.englishLevel,
        location: f.location,
        workModel: f.workModel ?? [],
        engagementModel: f.engagementModel ?? [],
        featured: !!f.featured,
        isSample: !!f.sample,
      };
    }),
  );
  return profiles.filter((p): p is TalentProfile => p !== null);
}

const filesAdapter: TalentAdapter = {
  async list(q = {}) {
    const out = (await loadFiles()).filter((p) => matches(p, q)).sort((a, b) => b.availabilityVerifiedAt.localeCompare(a.availabilityVerifiedAt));
    return q.limit ? out.slice(0, q.limit) : out;
  },
};

export function getTalentAdapter(): TalentAdapter {
  switch (process.env.TALENT_SOURCE ?? "files") {
    // case "cms": return cmsAdapter;   ← external CMS, see docs/INTEGRATIONS.md
    default:
      return filesAdapter;
  }
}
