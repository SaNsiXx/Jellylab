# Launch checklist

Run `npm run check:placeholders` — it lists everything below that is still open. A deploy with `DEPLOY_ENV=production` fails until the list is empty.

## Legal & entity (blocking)
- [ ] `lib/legal/entity.ts`: company legal name, registered address, KRS, NIP, contact email, LinkedIn URL
- [ ] `content/legal/{en,pl}/privacy.mdx`, `cookies.mdx`: fill every `[DO UZUPEŁNIENIA]`, set `status` to something other than `DRAFT`, set `updatedAt`
- [ ] `lib/forms/consents.ts`: consent wording approved by counsel/DPO (recruitment + future-offers texts are drafts); replace each `…-DRAFT-1` version
- [ ] `lib/analytics/consent.ts`: `CONSENT_POLICY_VERSION` (bump re-asks all visitors)
- [ ] Retention periods, processor agreements (hosting, CRM, ESP, analytics), decision on IP storage (currently not stored)

## Configuration (blocking)
- [ ] `NEXT_PUBLIC_SITE_URL`, `DOI_SECRET`
- [ ] `CRM_PROVIDER=pipedrive` + `PIPEDRIVE_API_TOKEN` (or another adapter in `lib/adapters/crm`)
- [ ] `MAIL_PROVIDER=brevo` + key, list IDs, `MAIL_FROM` (verified sender); ESP automation sends the Jelly Drop after subscribe
- [ ] `RATE_LIMIT_PROVIDER=upstash` + URL/token
- [ ] `NOTIFY_EMAIL_LEADS` / `NOTIFY_EMAIL_CANDIDATES` (or `NOTIFY_EMAIL`) set, `MAIL_PROVIDER=brevo` with a verified sender — every submission is emailed there
- [ ] CV storage: implement private storage + malware scanning in `lib/adapters/storage` (the mock refuses uploads on the live site; LinkedIn URL still works)
- [ ] Optional: content panel on the live site (Keystatic GitHub mode, see `docs/CONTENT_EDITING.md`)
- [ ] Optional: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`, `NEXT_PUBLIC_LINKEDIN_CONVERSIONS`

## Content to supply / approve
- [ ] Official `JellyLabs-wordmark.svg` (current logo is extracted from the JPG — see `components/layout/Wordmark.tsx`)
- [ ] Rights/provenance for the supplied campaign images `01_Get_The_Jelly_Drop` and `02_Your_Tech_Bench_Inbox` (`assets/`)
- [ ] Real job offers in `/keystatic` → Job offers (sample removed), case studies (with permission), team bios/photos
- [ ] Review copy written/translated during the build (not in the brand pack): form labels/errors/success texts, cookie banner, DOI emails & screens, Careers page and empty state, PL dev FAQ, PL capability areas, PL talent/insights newsletter lines, Proof heading
- [ ] Confirm the public promise "reply within one business day" (crew form success text)
- [ ] PL FAQ likely typo: "Przedstawiamy doświadczenie…" → "Sprawdzamy…"?

## QA before go-live
- [ ] GitHub Actions CI green on `main` (typecheck, lint, build, e2e, axe)
- [ ] `npm run typecheck && npm run lint && npm run build`
- [ ] `npm run e2e` against staging with real adapters (check lead + note in Pipedrive, DOI email, list subscription)
- [ ] `npm run qa` and `npm run lighthouse` against staging
- [ ] Manual: keyboard-only pass (menu trap, forms, consent), screen reader spot-check, iOS Safari + Android Chrome, reduced motion
- [ ] Verify robots.txt allows crawling and sitemap URLs use the production domain
