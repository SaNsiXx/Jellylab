# Editing content

All changes go through git; run `npm run dev` to preview and `npm run build` before deploying.

## Content panel (Keystatic)

`npm run dev` → **http://localhost:3000/keystatic**. Edits job offers (Careers) and the four legal documents
and saves straight into the repo files (commit + push as usual). On deployments the panel is hidden until GitHub mode is set up.

GitHub mode (edit on the live site, changes are committed to the repo):
1. Set `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=SaNsiXx/Jellylab` locally, run `npm run dev`, open `/keystatic` and follow the
   prompt to create the Keystatic GitHub App (it writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
   `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` to `.env`).
2. Copy those five variables to Vercel → Settings → Environment Variables, add the deployment URL as a callback URL in
   the GitHub App, redeploy. Editors sign in with GitHub at `https://<site>/keystatic`.

## Page copy (EN + PL)

All UI text lives in `messages/en.json` and `messages/pl.json`. Both files must have **identical keys**; message keys
are type-checked, so a missing or misspelled key fails `npm run typecheck`. Polish plurals use ICU syntax
(`one / few / many / other`), e.g. `forms.errorSummary`.

Neon headlines: the second half of every big heading glows. To choose where it starts, put `|` in the text,
e.g. `"Markets | we work with."` — the marker is never displayed (also stripped from SEO titles and previews).

Source of truth for wording: `assets/current_brand/03_SITE_COPY_EN.md` and `04_SITE_COPY_PL.md`. Text that was written
or translated during the build (not in the pack) is listed in `docs/LAUNCH_CHECKLIST.md` → "Review copy".

## Job offers (Careers)

`/keystatic` → **Job offers** (or one JSON file per offer in `content/careers/`). Fields: title, short description (EN + PL),
seniority, tech stack, contract (B2B / employment / both), work model, location, optional rate, posted date, optional
"valid until" (the offer disappears automatically after it). An offer appears on `/careers` only when **Published** is ticked.

Each offer has an **Apply** button → `/for-developers?offer=<file name>#join`: the candidate form shows "Applying for: …" and the
offer id is sent with the application (and in the notification email). Offers are also published as schema.org
`JobPosting` (Google for Jobs). Delete `content/careers/sample-senior-dotnet-engineer.json` (or untick Published) before
launch — sample offers carry a badge and are hidden on the live site anyway.

## Legal pages

`content/legal/{en,pl}/privacy.mdx`, `cookies.mdx`. Replace every `[DO UZUPEŁNIENIA]`, set
`updatedAt`, and change `status: DRAFT` to `status: FINAL` (removes the draft banner and allows indexing).

## Legal entity & contact

`lib/legal/entity.ts` — company name, address, KRS, NIP, email, LinkedIn. Used in the footer, contact page, consent
texts, privacy notice under forms and Organization schema.

## Consent wording

`lib/forms/consents.ts`. **Whenever wording changes, bump the matching version** in `CONSENT_VERSIONS` — every submission
stores the exact text and version shown. Cookie banner policy version: `lib/analytics/consent.ts → CONSENT_POLICY_VERSION`
(bumping it asks every visitor again).

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
