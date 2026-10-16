import { config, collection, singleton, fields } from "@keystatic/core";

// Content panel at /keystatic. Local mode (default): edits files in this repo — run `npm run dev`.
// GitHub mode (for editing on the deployed site): set NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=owner/repo and the
// Keystatic GitHub App env vars — see docs/CONTENT_EDITING.md → "Content panel".
const githubRepo = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined;

const mdxBody = (label: string) =>
  fields.mdx({
    label,
    options: { image: false, table: true, codeBlock: false },
  });

function legal(locale: "en" | "pl", doc: "privacy" | "cookies", label: string) {
  return singleton({
    label,
    path: `content/legal/${locale}/${doc}`,
    format: { contentField: "body" },
    entryLayout: "content",
    schema: {
      title: fields.text({ label: "Title", validation: { length: { min: 1 } } }),
      updatedAt: fields.text({ label: "Last updated", description: "e.g. 2026-11-01" }),
      status: fields.select({
        label: "Status",
        description: "DRAFT shows a warning banner, hides the page from search and blocks the production build.",
        options: [
          { label: "Draft", value: "DRAFT" },
          { label: "Final (approved by counsel)", value: "FINAL" },
        ],
        defaultValue: "DRAFT",
      }),
      body: mdxBody("Document"),
    },
  });
}

const textPair = (label: string) => fields.object({ en: fields.text({ label: "EN", validation: { length: { min: 1 } } }), pl: fields.text({ label: "PL", validation: { length: { min: 1 } } }) }, { label });

export default config({
  storage: githubRepo ? { kind: "github", repo: githubRepo } : { kind: "local" },
  ui: {
    brand: { name: "Jelly Labs" },
    navigation: {
      Careers: ["careers"],
      "Legal — EN": ["privacyEn", "cookiesEn"],
      "Legal — PL": ["privacyPl", "cookiesPl"],
    },
  },
  collections: {
    // One JSON file per offer in content/careers/ → /careers and the "Applying for" chip on the candidate form.
    careers: collection({
      label: "Job offers",
      path: "content/careers/*",
      slugField: "id",
      format: { data: "json" },
      columns: ["id", "datePosted"],
      schema: {
        id: fields.slug({
          name: { label: "Offer ID", description: "Short and stable, e.g. senior-dotnet-engineer. Used in the apply link." },
          slug: { label: "File name" },
        }),
        title: textPair("Job title"),
        summary: fields.object(
          {
            en: fields.text({ label: "EN", multiline: true, validation: { length: { min: 1 } } }),
            pl: fields.text({ label: "PL", multiline: true, validation: { length: { min: 1 } } }),
          },
          { label: "Short description" },
        ),
        seniority: fields.select({
          label: "Seniority",
          options: [
            { label: "Junior", value: "junior" },
            { label: "Mid", value: "mid" },
            { label: "Senior", value: "senior" },
            { label: "Lead", value: "lead" },
            { label: "Architect", value: "architect" },
          ],
          defaultValue: "senior",
        }),
        stack: fields.array(fields.text({ label: "Technology" }), { label: "Tech stack", itemLabel: (p) => p.value }),
        contractType: fields.select({
          label: "Contract",
          options: [
            { label: "B2B", value: "b2b" },
            { label: "Employment contract", value: "employment" },
            { label: "Open to both", value: "open" },
          ],
          defaultValue: "b2b",
        }),
        workModel: fields.multiselect({
          label: "Work model",
          options: [
            { label: "Remote", value: "remote" },
            { label: "Hybrid", value: "hybrid" },
            { label: "Onsite", value: "onsite" },
          ],
          defaultValue: ["remote"],
        }),
        location: textPair("Location"),
        rate: fields.text({ label: "Rate (optional)", description: "e.g. 150–190 PLN/h B2B. Leave empty to hide." }),
        datePosted: fields.date({ label: "Posted", validation: { isRequired: true } }),
        validThrough: fields.date({ label: "Valid until (optional)", description: "The offer disappears automatically after this date." }),
        published: fields.checkbox({ label: "Published", defaultValue: false }),
        sample: fields.checkbox({ label: "Sample / placeholder (badged, hidden on the live site)", defaultValue: false }),
      },
    }),
  },
  singletons: {
    privacyEn: legal("en", "privacy", "Privacy Policy (EN)"),
    cookiesEn: legal("en", "cookies", "Cookie Policy (EN)"),
    privacyPl: legal("pl", "privacy", "Polityka prywatności (PL)"),
    cookiesPl: legal("pl", "cookies", "Polityka cookies (PL)"),
  },
});
