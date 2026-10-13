# Editing content

All changes go through git; run `npm run dev` to preview and `npm run build` before deploying.

## Page copy (EN + PL)

All UI text lives in `messages/en.json` and `messages/pl.json`. Both files must have **identical keys**; message keys
are type-checked, so a missing or misspelled key fails `npm run typecheck`. Polish plurals use ICU syntax
(`one / few / many / other`), e.g. `talentPage.results`.

Source of truth for wording: `assets/current_brand/03_SITE_COPY_EN.md` and `04_SITE_COPY_PL.md`. Text that was written
or translated during the build (not in the pack) is listed in `docs/LAUNCH_CHECKLIST.md` → "Review copy".

## Insights (The Jelly Signal)

Add `content/insights/en/<slug>.mdx` and, for the Polish version, `content/insights/pl/<slug>.mdx` (same slug → linked via
hreflang). Frontmatter:

```yaml
---
title: "Headline"
excerpt: "One or two sentences for cards and meta description."
category: market_signals        # jelly_drop | market_signals | delivery | people | ai_technology
author: "Jelly Labs"            # optional authorRole: "…"
publishedAt: "2026-11-03"
updatedAt: "2026-11-10"         # optional
coverImage: "/insights/my-cover.jpg"   # optional, put the file in public/insights/
draft: true                     # optional: hidden everywhere
seo: { title: "…", description: "…", ogImage: "/…" }   # optional
---
```

Body is Markdown/MDX (headings `##`, lists, quotes, tables). Reading time, Article schema, OG image and the newsletter CTA
are added automatically. Delete `content/insights/*/sample-article-template.mdx` before launch (it is already hidden in
production via `sample: true`). Never publish unverified figures (rates, availability, placement speed).

## Legal pages

`content/legal/{en,pl}/privacy.mdx`, `cookies.mdx`, `jelly-box-terms.mdx`. Replace every `[DO UZUPEŁNIENIA]`, set
`updatedAt`, and change `status: DRAFT` to `status: FINAL` (removes the draft banner and allows indexing).

## Legal entity & contact

`lib/legal/entity.ts` — company name, address, KRS, NIP, email, LinkedIn. Used in the footer, contact page, consent
texts, privacy notice under forms and Organization schema.

## Consent wording

`lib/forms/consents.ts`. **Whenever wording changes, bump the matching version** in `CONSENT_VERSIONS` — every submission
stores the exact text and version shown. Cookie banner policy version: `lib/analytics/consent.ts → CONSENT_POLICY_VERSION`
(bumping it asks every visitor again).

## Talent profiles

Today: `data/talent.mock.ts` (sample data, badged). Production: connect a CMS — see `docs/INTEGRATIONS.md` → "Talent data".
Only publish profiles with `consentToPublish: true`; no names, employers or contact data.

## Design tokens

`assets/current_brand/07_DESIGN_TOKENS.json` → regenerated into `app/tokens.css` on every `dev`/`build`
(`npm run tokens`). Use semantic utilities (`bg-bg`, `text-muted`, `border-line`, `text-cyan`…), not raw hex.

## Images

- Generated brand art: edit numbers in `scripts/build-brand-svgs.mjs`, run `npm run brand:svgs`
  (outputs `public/jelly`, `public/campaign`, `public/icons`).
- Supplied campaign artwork overrides the SVG: add the file to `public/campaign/` and map it in
  `components/ui/BrandArt.tsx → RASTER` (keep the original in `assets/generated/`).
- Logo: `components/layout/Wordmark.tsx` (see `docs/ASSETS.md`).
- Prompts for new imagery: `docs/IMAGE_PROMPTS.md`.
