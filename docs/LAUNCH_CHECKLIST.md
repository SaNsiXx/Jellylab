# Launch checklist

Run `npm run check:placeholders` — it lists everything below that is still open. A deploy with `DEPLOY_ENV=production` fails until the list is empty.

## Legal & entity (blocking)
- [ ] `lib/legal/entity.ts`: company legal name, registered address, KRS, NIP, contact email, LinkedIn URL
- [ ] `content/legal/{en,pl}/privacy.mdx`, `cookies.mdx`, `jelly-box-terms.mdx`: fill every `[DO UZUPEŁNIENIA]`, set `status` to something other than `DRAFT`, set `updatedAt`
- [ ] `lib/forms/consents.ts`: consent wording approved by counsel/DPO (recruitment + future-offers texts are drafts); replace each `…-DRAFT-1` version
- [ ] `lib/analytics/consent.ts`: `CONSENT_POLICY_VERSION` (bump re-asks all visitors)
- [ ] Retention periods, processor agreements (hosting, CRM, ESP, analytics), decision on IP storage (currently not stored)

## Configuration (blocking)
- [ ] `NEXT_PUBLIC_SITE_URL`, `DOI_SECRET`
- [ ] `CRM_PROVIDER=pipedrive` + `PIPEDRIVE_API_TOKEN` (or another adapter in `lib/adapters/crm`)
- [ ] `MAIL_PROVIDER=brevo` + key, list IDs, `MAIL_FROM` (verified sender); ESP automation sends the Jelly Drop after subscribe
- [ ] `RATE_LIMIT_PROVIDER=upstash` + URL/token
- [ ] `TALENT_SOURCE` ≠ `mock`: implement the CMS case in `lib/adapters/talent/index.ts` returning `TalentProfile[]` (only `published && consentToPublish`, strip `privateCrmId`, `isSample: false`)
- [ ] CV storage: implement private storage + malware scanning in `lib/adapters/storage` (mock refuses uploads in production; LinkedIn URL still works)
- [ ] Optional: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`, `NEXT_PUBLIC_LINKEDIN_CONVERSIONS`

## Content to supply / approve
- [ ] Official `JellyLabs-wordmark.svg` (current logo is extracted from the JPG — see `components/layout/Wordmark.tsx`)
- [ ] Rights/provenance for the supplied `01_Get_The_Jelly_Drop` image (`assets/generated/`)
- [ ] Real talent profiles, case studies (with permission), team bios/photos, first Insights articles
- [ ] Review copy written/translated during the build (not in the brand pack): form labels/errors/success texts, cookie banner, DOI emails & screens, Insights empty state, PL dev FAQ, PL capability areas, PL talent/insights newsletter lines, Proof heading
- [ ] Confirm the public promise "reply within one business day" (crew form success text)
- [ ] PL FAQ likely typo: "Przedstawiamy doświadczenie…" → "Sprawdzamy…"?

## QA before go-live
- [ ] `npm run typecheck && npm run lint && npm run build`
- [ ] `npm run e2e` against staging with real adapters (check lead + note in Pipedrive, DOI email, list subscription)
- [ ] `npm run qa` and `npm run lighthouse` against staging
- [ ] Manual: keyboard-only pass (menu trap, forms, consent), screen reader spot-check, iOS Safari + Android Chrome, reduced motion
- [ ] Verify robots.txt allows crawling and sitemap URLs use the production domain
