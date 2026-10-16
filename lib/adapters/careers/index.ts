import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Job offers for /careers. One JSON file per offer in content/careers/, edited in the content panel
// (/keystatic → Careers) or by hand. Only `published` offers are shown; `sample` offers (placeholders)
// appear on local / preview deployments with a badge and are hidden on the live site (DEPLOY_ENV=production).

export type JobOffer = {
  id: string; // file name, used in ?offer=<id>
  title: { en: string; pl: string };
  summary: { en: string; pl: string };
  seniority: "junior" | "mid" | "senior" | "lead" | "architect";
  stack: string[];
  contractType: "b2b" | "employment" | "open";
  workModel: ("remote" | "hybrid" | "onsite")[];
  location: { en: string; pl: string };
  rate?: string;
  datePosted: string; // YYYY-MM-DD
  validThrough?: string; // YYYY-MM-DD
  sample: boolean;
};

type OfferFile = Omit<JobOffer, "id" | "sample" | "stack" | "workModel"> & {
  stack?: string[];
  workModel?: JobOffer["workModel"];
  published?: boolean;
  sample?: boolean;
};

const DIR = path.join(process.cwd(), "content", "careers");
const showSamples = process.env.DEPLOY_ENV !== "production";

export async function listJobOffers(): Promise<JobOffer[]> {
  let names: string[] = [];
  try {
    names = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const today = new Date().toISOString().slice(0, 10);
  const offers = await Promise.all(
    names.map(async (name): Promise<JobOffer | null> => {
      const f = JSON.parse(await readFile(path.join(DIR, name), "utf8")) as OfferFile;
      if (!f.published) return null;
      if (f.sample && !showSamples) return null;
      if (f.validThrough && f.validThrough < today) return null; // expired offers disappear automatically
      return {
        id: name.replace(/\.json$/, ""),
        title: f.title,
        summary: f.summary,
        seniority: f.seniority,
        stack: f.stack ?? [],
        contractType: f.contractType,
        workModel: f.workModel ?? [],
        location: f.location,
        rate: f.rate || undefined,
        datePosted: f.datePosted,
        validThrough: f.validThrough || undefined,
        sample: !!f.sample,
      };
    }),
  );
  return offers.filter((o): o is JobOffer => o !== null).sort((a, b) => b.datePosted.localeCompare(a.datePosted));
}
