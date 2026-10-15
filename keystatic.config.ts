import { config, collection, singleton, fields } from "@keystatic/core";

// Content panel at /keystatic. Local mode (default): edits files in this repo — run `npm run dev`.
// GitHub mode (for editing on the deployed site): set NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=owner/repo and the
// Keystatic GitHub App env vars — see docs/CONTENT_EDITING.md → "Content panel".
const githubRepo = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined;

const CATEGORY_OPTIONS = [
  { label: "Jelly Drop", value: "jelly_drop" },
  { label: "Market Signals", value: "market_signals" },
  { label: "Delivery", value: "delivery" },
  { label: "People", value: "people" },
  { label: "AI & Technology", value: "ai_technology" },
] as const;

const mdxBody = (label: string) =>
  fields.mdx({
    label,
    options: { image: false, table: true, codeBlock: false },
  });

function insights(locale: "en" | "pl") {
  return collection({
    label: locale === "en" ? "Insights — English" : "Insights — Polski",
    path: `content/insights/${locale}/*`,
    slugField: "title",
    format: { contentField: "body" },
    entryLayout: "content",
    columns: ["title", "publishedAt"],
    schema: {
      title: fields.slug({
        name: { label: "Title", description: 'Optional: put "|" where the neon half of the headline should start.' },
        slug: { label: "URL slug", description: "Use the SAME slug in EN and PL so the two versions are linked." },
      }),
      excerpt: fields.text({ label: "Excerpt", multiline: true, validation: { length: { min: 1 } } }),
      category: fields.select({ label: "Category", options: CATEGORY_OPTIONS, defaultValue: "market_signals" }),
      author: fields.text({ label: "Author", defaultValue: "Jelly Labs" }),
      authorRole: fields.text({ label: "Author role (optional)" }),
      publishedAt: fields.date({ label: "Published", validation: { isRequired: true } }),
      updatedAt: fields.date({ label: "Updated (optional)" }),
      coverImage: fields.image({ label: "Cover image (optional)", directory: "public/insights", publicPath: "/insights/" }),
      draft: fields.checkbox({ label: "Draft (hidden everywhere)", defaultValue: false }),
      sample: fields.checkbox({ label: "Sample / placeholder (hidden on the live site)", defaultValue: false }),
      seo: fields.object(
        {
          title: fields.text({ label: "SEO title (optional)" }),
          description: fields.text({ label: "SEO description (optional)", multiline: true }),
          ogImage: fields.text({ label: "OG image path (optional)" }),
        },
        { label: "SEO" },
      ),
      body: mdxBody("Article"),
    },
  });
}

function legal(locale: "en" | "pl", doc: "privacy" | "cookies" | "jelly-box-terms", label: string) {
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
      Talent: ["talent"],
      Insights: ["insightsEn", "insightsPl"],
      "Legal — EN": ["privacyEn", "cookiesEn", "jellyBoxTermsEn"],
      "Legal — PL": ["privacyPl", "cookiesPl", "jellyBoxTermsPl"],
    },
  },
  collections: {
    talent: collection({
      label: "Talent profiles",
      path: "content/talent/*",
      slugField: "id",
      format: { data: "json" },
      columns: ["id", "availability"],
      schema: {
        id: fields.slug({
          name: { label: "Public ID", description: "Anonymised, e.g. JL-0142. Never a name." },
          slug: { label: "File name" },
        }),
        publicTitle: textPair("Public title"),
        role: fields.text({ label: "Role (filter group)", description: "e.g. Frontend, Backend, DevOps & Cloud, Data & AI, QA, eCommerce" }),
        seniority: fields.select({
          label: "Seniority",
          options: [
            { label: "Mid", value: "mid" },
            { label: "Senior", value: "senior" },
            { label: "Lead", value: "lead" },
            { label: "Architect", value: "architect" },
          ],
          defaultValue: "senior",
        }),
        coreStack: fields.array(fields.text({ label: "Technology" }), { label: "Core stack", itemLabel: (p) => p.value }),
        secondaryStack: fields.array(fields.text({ label: "Technology" }), { label: "Secondary stack", itemLabel: (p) => p.value }),
        availability: fields.select({
          label: "Availability",
          options: [
            { label: "Immediate", value: "immediate" },
            { label: "In 2 weeks", value: "2_weeks" },
            { label: "In 1 month", value: "1_month" },
            { label: "Future", value: "future" },
          ],
          defaultValue: "immediate",
        }),
        availabilityVerifiedAt: fields.date({ label: "Availability last verified", validation: { isRequired: true } }),
        englishLevel: fields.select({
          label: "English",
          options: [
            { label: "B2", value: "B2" },
            { label: "C1", value: "C1" },
            { label: "C2", value: "C2" },
          ],
          defaultValue: "C1",
        }),
        location: textPair("Location"),
        workModel: fields.multiselect({
          label: "Work model",
          options: [
            { label: "Remote", value: "remote" },
            { label: "Hybrid", value: "hybrid" },
            { label: "Onsite", value: "onsite" },
          ],
          defaultValue: ["remote"],
        }),
        engagementModel: fields.multiselect({
          label: "Engagement model",
          options: [
            { label: "B2B", value: "B2B" },
            { label: "Employment", value: "employment" },
          ],
          defaultValue: ["B2B"],
        }),
        featured: fields.checkbox({ label: "Featured on the homepage", defaultValue: false }),
        published: fields.checkbox({ label: "Published", defaultValue: false }),
        consentToPublish: fields.checkbox({
          label: "Candidate consented to publication",
          description: "Required — profiles without consent are never shown.",
          defaultValue: false,
        }),
        sample: fields.checkbox({ label: "Sample / placeholder (badged, hidden on the live site)", defaultValue: false }),
      },
    }),
    insightsEn: insights("en"),
    insightsPl: insights("pl"),
  },
  singletons: {
    privacyEn: legal("en", "privacy", "Privacy Policy (EN)"),
    cookiesEn: legal("en", "cookies", "Cookie Policy (EN)"),
    jellyBoxTermsEn: legal("en", "jelly-box-terms", "Jelly Box Terms (EN)"),
    privacyPl: legal("pl", "privacy", "Polityka prywatności (PL)"),
    cookiesPl: legal("pl", "cookies", "Polityka cookies (PL)"),
    jellyBoxTermsPl: legal("pl", "jelly-box-terms", "Regulamin Jelly Box (PL)"),
  },
});
