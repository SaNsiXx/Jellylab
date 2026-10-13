import "server-only";
import { env } from "@/lib/server/env";

export type DoiPurpose = "jelly_list" | "marketing";

export type DoiEmail = {
  to: string;
  locale: "en" | "pl";
  confirmUrl: string;
  subject: string;
  html: string;
  text: string;
};

export interface MailingAdapter {
  readonly name: string;
  sendDoubleOptIn(mail: DoiEmail): Promise<void>;
  /** Called only AFTER double opt-in. Adds the contact to the right list(s); the ESP automation sends the Jelly Drop. */
  subscribe(input: { email: string; locale: "en" | "pl"; purpose: DoiPurpose; interest?: string }): Promise<void>;
}

/** Development adapter: prints the confirmation link to the server console so the DOI flow can be tested locally. */
const consoleMailer: MailingAdapter = {
  name: "console",
  async sendDoubleOptIn(m) {
    console.info(`[mail:console] DOI email (${m.locale}) → confirm at:\n  ${m.confirmUrl}`);
  },
  async subscribe(i) {
    console.info("[mail:console] subscribed", { purpose: i.purpose, locale: i.locale, interest: i.interest });
  },
};

/** Brevo (ex-Sendinblue): transactional email for the DOI message + Contacts API for lists. */
function brevo(apiKey: string): MailingAdapter {
  const call = async (path: string, body: unknown) => {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok && res.status !== 204) throw new Error(`Brevo ${path} → ${res.status}`);
  };
  return {
    name: "brevo",
    async sendDoubleOptIn(m) {
      await call("/smtp/email", {
        sender: { email: env.mailFrom, name: env.mailFromName },
        to: [{ email: m.to }],
        subject: m.subject,
        htmlContent: m.html,
        textContent: m.text,
        tags: ["doi"],
      });
    },
    async subscribe(i) {
      const lists = [
        i.purpose === "jelly_list" && (i.interest === "jelly_signal" ? env.brevoListSignal : env.brevoListJellyList),
        i.purpose === "jelly_list" && i.interest === "both" && env.brevoListSignal,
        i.purpose === "marketing" && env.brevoListMarketing,
      ]
        .filter((v): v is string => typeof v === "string")
        .map(Number);
      await call("/contacts", { email: i.email, attributes: { LOCALE: i.locale }, listIds: [...new Set(lists)], updateEnabled: true });
    },
  };
}

export function getMailer(): MailingAdapter {
  if (env.mailProvider === "brevo") {
    if (!env.brevoKey) throw new Error("MAIL_PROVIDER=brevo but BREVO_API_KEY is missing");
    return brevo(env.brevoKey);
  }
  return consoleMailer;
}
