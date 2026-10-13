import "server-only";

// Server-only configuration. Nothing here is ever sent to the browser (no NEXT_PUBLIC_ prefix).
// See .env.example for every variable and how to obtain it.

const read = (k: string) => {
  const v = process.env[k];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

export const env = {
  isProd: process.env.NODE_ENV === "production",
  /** The live site (jellylabs.com). Vercel previews run NODE_ENV=production but are NOT live. */
  isLive: process.env.DEPLOY_ENV === "production",
  siteUrl: read("NEXT_PUBLIC_SITE_URL"),
  doiSecret: read("DOI_SECRET"),

  crmProvider: (read("CRM_PROVIDER") ?? "console") as "console" | "pipedrive",
  pipedriveToken: read("PIPEDRIVE_API_TOKEN"),

  mailProvider: (read("MAIL_PROVIDER") ?? "console") as "console" | "brevo",
  brevoKey: read("BREVO_API_KEY"),
  brevoListJellyList: read("BREVO_LIST_ID_JELLY_LIST"),
  brevoListSignal: read("BREVO_LIST_ID_SIGNAL"),
  brevoListMarketing: read("BREVO_LIST_ID_MARKETING"),
  mailFrom: read("MAIL_FROM") ?? "hello@example.com",
  mailFromName: read("MAIL_FROM_NAME") ?? "Jelly Labs",

  rateLimitProvider: (read("RATE_LIMIT_PROVIDER") ?? "memory") as "memory" | "upstash",
  upstashUrl: read("UPSTASH_REDIS_REST_URL"),
  upstashToken: read("UPSTASH_REDIS_REST_TOKEN"),

  cvStorageProvider: (read("CV_STORAGE_PROVIDER") ?? "mock") as "mock",
};
