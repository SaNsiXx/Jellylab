# Jelly Labs — website

Bilingual (EN default, PL under `/pl`, identical slugs) marketing + lead-generation site for Jelly Labs.
Next.js 16 App Router · TypeScript (strict) · Tailwind v4 · next-intl · React Three Fiber (hero only) · Zod + React Hook Form · MDX.

## Local setup

```bash
npm install
cp .env.example .env.local   # defaults run everything with console adapters
npm run dev                  # http://localhost:3000
```

> Windows PowerShell blocks `npm.ps1` by default — use `npm.cmd run dev` (or Git Bash / cmd).

In dev, form submissions are logged (redacted) and the double opt-in link is printed to the server console.

## Scripts

| Script | What it does |
|---|---|
| `dev` / `build` / `start` | Next.js. `prebuild` regenerates tokens and runs the placeholder gate |
| `typecheck`, `lint` | strict TS, ESLint (core-web-vitals + a11y) |
| `check:placeholders` | lists unresolved legal/consent/config placeholders; **fails when `DEPLOY_ENV=production`** |
| `qa` | Playwright + axe (WCAG 2.2 AA) at 375/768/1024/1440/1920, overflow + one-H1 checks → `.qa/` |
| `e2e` | end-to-end flows: consent, Jelly List + double opt-in, crew, contact, candidate, careers → apply |
| `lighthouse` | Lighthouse mobile + desktop (with/without WebGL) against `next start -p 3100` |
| `tokens` | `assets/current_brand/07_DESIGN_TOKENS.json` → `app/tokens.css` |
| `brand`, `brand:svgs` | wordmark layers; jelly elements, campaign cards, icons |

## Structure

```
app/[locale]/…        routes (home, solutions, for-developers, careers, about,
                      jelly-list (+check-inbox/confirm/confirmed), contact, privacy, cookies)
app/api/forms/[type]  form endpoint (validation, honeypot, rate limit, CRM, notification email, double opt-in)
app/api/doi/confirm   double opt-in confirmation (POST only)
app/api/og            Open Graph image generator
components/           hero (WebGL + SVG fallback), forms, consent, legal, layout, ui
lib/adapters/         crm · mailing · ratelimit · storage · careers  (swap via env)
lib/forms/            shared Zod schemas + consent texts/versions
messages/{en,pl}.json all UI copy (keys must match)
content/              careers/*.json (job offers), legal/*.mdx  (editable at /keystatic)
scripts/              build/QA tooling
```

## Deployment (Vercel → jellylabs.com)

EN at `https://jellylabs.com`, PL at `https://jellylabs.com/pl`. Step-by-step: `docs/DEPLOYMENT.md`.

- Preview: import the GitHub repo in Vercel, no env vars needed; `*.vercel.app` is never indexed and the placeholder check only warns.
- Launch: add the domain, set `NEXT_PUBLIC_SITE_URL=https://jellylabs.com`, `DEPLOY_ENV=production` and the integration variables. The build fails until `docs/LAUNCH_CHECKLIST.md` is resolved.

## Quality results (Phase 4, production build)

- Lighthouse mobile 89–93 (home 92–93 over 3 runs), desktop 98–100 (home with WebGL 98, without 100); a11y 100; best practices 100; CLS 0. SEO 69 only because non-production robots blocks crawling (expected).
- axe: 0 violations, 60 route×width combinations EN+PL; reduced-motion clean.
- Mobile never downloads three.js (~268 KB gzip JS total); desktop loads it (240 KB gzip) after idle.
- E2E 28/28 (after the October 2026 content changes: Jelly Box, Talent, How it works and Insights removed; Careers added).

CI (`.github/workflows/ci.yml`) runs typecheck, lint, production build, the e2e suite and axe on every push and PR.

## Documentation

- `docs/DEPLOYMENT.md` — Vercel preview and launch on jellylabs.com
- `docs/LAUNCH_CHECKLIST.md` — legal placeholders, configuration, copy to review, QA checklist
- `docs/INTEGRATIONS.md` — CRM, email/double opt-in, rate limiting, CV storage, submission emails, job offers, analytics, consent manager
- `docs/CONTENT_EDITING.md` — copy, job offers (Careers), legal pages, consent versions, tokens, images
- `docs/ASSETS.md` — asset origin, rights and status
- `docs/IMAGE_PROMPTS.md` — prompts for remaining imagery
