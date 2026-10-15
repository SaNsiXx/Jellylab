# Integrations

Every external service sits behind an adapter selected by environment variables. With no configuration
the site runs on **console adapters** (dev only). Secrets are server-only — never prefix them with `NEXT_PUBLIC_`.

| Concern | Adapter file | Env selector | Dev default | Production |
|---|---|---|---|---|
| CRM | `lib/adapters/crm/index.ts` | `CRM_PROVIDER` | `console` | `pipedrive` |
| Email + double opt-in | `lib/adapters/mailing/index.ts` | `MAIL_PROVIDER` | `console` | `brevo` |
| Rate limiting | `lib/adapters/ratelimit/index.ts` | `RATE_LIMIT_PROVIDER` | `memory` | `upstash` |
| CV storage | `lib/adapters/storage/index.ts` | `CV_STORAGE_PROVIDER` | `mock` | *to implement* |
| Talent data | `lib/adapters/talent/index.ts` | `TALENT_SOURCE` | `files` (`content/talent/*.json`) | `files` or external CMS |
| Jelly Box addresses | `lib/adapters/shipping/index.ts` | `SHIPPING_PROVIDER` | `console` | `webhook` |
| Insights | `lib/adapters/insights/index.ts` | — | MDX files | MDX or CMS |
| Analytics | `components/consent/AnalyticsScripts.tsx`, `lib/analytics/track.ts` | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_LINKEDIN_*` | off | on after consent |
| Consent manager | `components/consent/ConsentBanner.tsx`, `lib/analytics/consent.ts` | — | built-in | built-in or CMP |

## Form pipeline

`POST /api/forms/{jelly-list|crew|contact|candidate}` (`app/api/forms/[type]/route.ts`):

1. Honeypot field or submit < 2 s after page load → silent `200` (nothing stored).
2. Rate limit: 5 submissions / 10 min per hashed IP per form type → `429`.
3. Zod validation with the **same schema** as the browser (`lib/forms/schemas.ts`) → `422 { fieldErrors }` (i18n keys).
4. Build a `SubmissionRecord` (`lib/adapters/crm/types.ts`): UTC timestamp, locale, form type, UTM/referrer/landing page,
   privacy-notice version, consents (exact text + version + state, stored separately from request data). IP is not stored.
5. Candidate CV → storage adapter (type/size/magic-byte checked). Then CRM `createLead` / `createCandidate`.
6. Jelly List always, Crew/Contact only when marketing-email consent was given → signed DOI token (7 days, `DOI_SECRET`)
   → `sendDoubleOptIn` email linking to `/jelly-list/confirm?t=…`.
7. Confirm page posts to `/api/doi/confirm` (POST only, so link scanners can't confirm) → CRM `confirmEmail` + mailing `subscribe`.

## Pipedrive (CRM)

`CRM_PROVIDER=pipedrive`, `PIPEDRIVE_API_TOKEN` (Settings → Personal preferences → API).
- Leads: Organization (if company) → Person (name, email, phone) → Lead `[website:<form>] <company>` + a note containing the
  full structured record (needs, timeline, UTM, consents with text/version).
- Candidates: Person + note. Pipedrive is not an ATS — swap `createCandidate` to your ATS when ready.
- DOI: finds the person by email and adds a `marketing_email_confirmed=true` note.
- Recommended next step: create custom fields (consent version, Jelly Drop status, Jelly Box status, UTM source) and map them in
  `pipedrive().createLead`; build the pipeline from 05_FORMS_LEGAL_CRM.md §6.

## Brevo (email)

`MAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `MAIL_FROM` (verified sender/domain), `MAIL_FROM_NAME`,
`BREVO_LIST_ID_JELLY_LIST`, `BREVO_LIST_ID_SIGNAL`, `BREVO_LIST_ID_MARKETING`.
- The DOI email is sent as transactional mail (template in `lib/server/emails.ts`, copy in `messages/*.json → emails`).
- `subscribe` runs **only after confirmation** and adds the contact to lists based on purpose/interest.
- Configure in Brevo: an automation "added to Jelly List" → send current Jelly Drop; one reminder for unconfirmed signups is
  NOT implemented on the site (no record of unconfirmed contacts is pushed to Brevo) — handle via CRM task if needed.
- Another ESP: implement `MailingAdapter` (`sendDoubleOptIn`, `subscribe`) and add a case in `getMailer()`.

## Upstash (rate limiting)

`RATE_LIMIT_PROVIDER=upstash`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Uses the REST pipeline API, no SDK.
Fails open (never blocks real leads if Redis is down). The memory limiter is per-instance and ineffective on serverless.

## CV storage (to implement)

The mock validates files (type, size, magic bytes) and discards them on local, preview and CI runs. On the live site
(`DEPLOY_ENV=production`) it **refuses** uploads ("add your LinkedIn URL instead") until real storage exists.
Implement `CvStorage.save(file, id)` returning an opaque reference: private bucket (S3/R2/GCS), server-side encryption,
malware scan before access, retention per the privacy policy. Never return a public URL.

## Talent data

Default source (`TALENT_SOURCE=files`): one JSON file per profile in `content/talent/`, editable in the content panel
(`/keystatic`, see `docs/CONTENT_EDITING.md`). Rules enforced by `lib/adapters/talent/index.ts`:
- only `published && consentToPublish` profiles are shown; `privateCrmId` (if present) never leaves the server;
- `sample: true` profiles show a "Sample profile" badge and are hidden on the live site;
- the production build fails if there is no real (non-sample) published profile.

To use an external CMS instead (Airtable, Notion, Sanity, Pipedrive…), add an adapter and select it:

```ts
// lib/adapters/talent/index.ts
const cmsAdapter: TalentAdapter = {
  async list(q = {}) {
    const res = await fetch(`${process.env.CMS_URL}/talent?published=true`, {
      headers: { Authorization: `Bearer ${process.env.CMS_TOKEN}` },
      next: { revalidate: 300 },
    });
    const rows = (await res.json()) as CmsTalent[];
    const profiles = rows
      .filter((r) => r.published && r.consentToPublish)            // never publish without consent
      .map(({ privateCrmId, ...r }) => ({ ...r, isSample: false })); // never expose CRM ids
    return profiles.filter((p) => matches(p, q)).slice(0, q.limit);
  },
};
// in getTalentAdapter(): case "cms": return cmsAdapter;   then set TALENT_SOURCE=cms
```

## Jelly Box (delivery address)

Flow (05_FORMS_LEGAL_CRM.md §1, §4): Jelly List signup → double opt-in → sales qualifies the company →
**invitation link** (signed token, 14 days) → `/jelly-box/address` form → address stored **outside the CRM** → CRM gets
only a status note (`jelly_box_status=invited | address_received`).

Issue an invitation, either:
- CLI: `npm run jelly-box:invite -- --email cto@acme.com --id <submissionId> --locale pl --base https://jellylabs.com`
  (prints the link; needs the same `DOI_SECRET` as the site), or
- API (for CRM automations, e.g. a Pipedrive "Jelly Box approved" stage → Make/Zapier):
  `POST /api/jelly-box/invite` with `Authorization: Bearer $ADMIN_API_KEY` and
  `{"email":"…","submissionId":"…","locale":"pl","send":true}` → returns the link and, with `send: true`, emails it via the
  mailing adapter. Disabled (404) unless `ADMIN_API_KEY` is set.

Address storage: `SHIPPING_PROVIDER=webhook` + `JELLY_BOX_WEBHOOK_URL` (+ optional `JELLY_BOX_WEBHOOK_SECRET`, sent as
`X-Jelly-Signature`) — e.g. a Make/Zapier scenario writing to an access-restricted sheet or the courier system. Delete
addresses after the period stated in the Jelly Box Terms. `JELLY_BOX_ACTIVE=false` closes the form and the invite endpoint.
Address rules enforced: company address in Poland, PL postal code format, confirmation checkbox, honeypot, rate limit;
identity (email, submission id) comes only from the signed token.

## Analytics

Nothing loads without consent. Google Consent Mode v2 defaults to `denied`.
- GA4: `NEXT_PUBLIC_GA4_ID` → loaded after **analytics** consent.
- LinkedIn Insight Tag: `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` → loaded after **marketing** consent.
- LinkedIn conversions: `NEXT_PUBLIC_LINKEDIN_CONVERSIONS={"jelly_list_submit":123,"client_request_submit":456}`.

Events (`lib/analytics/track.ts`): `hero_get_jelly_drop_click`, `hero_build_crew_click`, `talent_profile_request`,
`jelly_list_form_start`, `jelly_list_submit`, `double_opt_in_confirmed`, `client_request_submit`,
`developer_form_submit`, `newsletter_signup`, `language_change`, `contact_click`. In dev they are logged to the console.

## Consent manager

Built-in banner: equal-weight accept/reject, per-category settings, footer "Cookie settings" re-opens it; stored in
`localStorage` (`jl-consent`) with a policy version. To use Cookiebot/CookieYes/Usercentrics instead: remove
`<ConsentBanner />` from `app/[locale]/layout.tsx`, load the CMP script, and call `setConsent({ analytics, marketing })`
from its consent callback — tracking and script loading keep working unchanged.
