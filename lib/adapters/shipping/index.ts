import "server-only";
import { env } from "@/lib/server/env";

// Jelly Box delivery addresses are stored SEPARATELY from the CRM (05_FORMS_LEGAL_CRM.md §4):
// a dedicated store with restricted access and its own deletion schedule. The CRM only receives a status.

export type JellyBoxAddressRecord = {
  submissionId: string; // links back to the Jelly List submission / CRM lead
  email: string; // from the signed invitation token, not user-editable
  locale: "en" | "pl";
  receivedAt: string; // ISO UTC
  company: string;
  recipientName: string;
  street: string;
  postalCode: string;
  city: string;
  country: "PL";
  phone: string;
  notes?: string;
  noticeVersion: string;
};

export interface ShippingStore {
  readonly name: string;
  saveAddress(record: JellyBoxAddressRecord): Promise<void>;
}

/** Development / preview: logs a redacted line only — the address itself is never printed or kept. */
const consoleStore: ShippingStore = {
  name: "console",
  async saveAddress(r) {
    console.info("[shipping:console] Jelly Box address received", { submissionId: r.submissionId, city: r.city, at: r.receivedAt });
  },
};

/**
 * Webhook: POSTs the record as JSON to a URL you control (e.g. a Make/Zapier scenario writing to an
 * access-restricted sheet or the courier system). Optional shared secret in `X-Jelly-Signature`.
 */
function webhook(url: string, secret?: string): ShippingStore {
  return {
    name: "webhook",
    async saveAddress(r) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(secret ? { "X-Jelly-Signature": secret } : {}) },
        body: JSON.stringify(r),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Jelly Box webhook → ${res.status}`);
    },
  };
}

export function getShippingStore(): ShippingStore {
  if (env.shippingProvider === "webhook") {
    if (!env.jellyBoxWebhookUrl) throw new Error("SHIPPING_PROVIDER=webhook but JELLY_BOX_WEBHOOK_URL is missing");
    return webhook(env.jellyBoxWebhookUrl, env.jellyBoxWebhookSecret);
  }
  return consoleStore;
}
