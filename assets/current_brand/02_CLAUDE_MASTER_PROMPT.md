# MASTER PROMPT FOR CLAUDE / CLAUDE CODE

You are a senior brand strategist, UX designer, conversion copywriter and creative frontend engineer. Build a production-ready bilingual website for **Jelly Labs**, a Poland-based staff augmentation and technology talent company serving software houses, product companies and enterprises in Poland, DACH, the UK, Europe and international markets.

Do not merely generate a visual mockup. Build a coherent, responsive, accessible and maintainable website with working navigation, forms, localization structure, SEO and a clear conversion funnel.

## 1. Read these source files first

- `01_MASTER_WEBSITE_BRIEF_PL.md`
- `03_SITE_COPY_EN.md`
- `04_SITE_COPY_PL.md`
- `05_FORMS_LEGAL_CRM.md`
- `06_ASSET_MANIFEST.md`
- `07_DESIGN_TOKENS.json`
- everything inside `assets/current_brand`
- `assets/concepts/JellyLabs_Hero_Concept.svg`

Treat the provided copy and strategy as the source of truth. Do not replace it with generic agency copy.

## 2. Brand

Jelly Labs is bold, human, fast and operationally credible.

Core lines:

- **Hard problems. Fluid teams.**
- **Verified tech talent. Ready when you are.**
- **People. Solutions. Impact.**
- Campaign line: **Who the f*ck is Jelly?**

The tone is 70% enterprise credibility and 30% rebel energy. The provocative line may appear as a small eyebrow, teaser or 404 element. It must not obscure the actual offer.

The website must not look like:

- a generic blue software house,
- a candy store,
- a crypto startup,
- a pirate-themed costume page,
- a template with stock photos of people using laptops.

## 3. Primary users and conversions

### B2B client

Path:

`Landing page → understand offer → inspect solutions/talent → Get the Jelly Drop or Build Your Crew → submit form → double opt-in → CRM`

Primary CTA: **GET THE JELLY DROP**

Secondary CTA: **BUILD YOUR CREW**

### Developer

Path:

`Landing page → For Developers → understand terms/process → Join Jelly Crew → candidate form`

Developer CTA: **JOIN JELLY CREW**

Do not combine the B2B lead form and candidate form.

## 4. Information architecture

Create these routes:

- `/`
- `/solutions`
- `/talent`
- `/how-it-works`
- `/for-developers`
- `/about`
- `/insights`
- `/jelly-list`
- `/contact`
- `/privacy`
- `/cookies`
- `/jelly-box-terms`

Create EN as the default language and a structurally identical PL version. Use a scalable i18n structure rather than duplicating components.

Desktop navigation:

`Logo | Solutions | Talent | How it works | For Developers | About | Insights | EN/PL | GET THE JELLY DROP`

Mobile navigation:

- full-screen dark menu,
- large touch targets,
- both Get the Jelly Drop and Join Jelly Crew visible,
- keyboard accessible and correctly trapped while open.

## 5. Homepage sections in this order

1. Hero with animated Jellies.
2. Moving capability signal bar.
3. Market problem and three proof principles.
4. Solutions preview.
5. Available talent preview.
6. Four-step process.
7. Jelly Drop / The Jelly Signal lead magnet.
8. Jelly Crew developer block.
9. Why Jelly values.
10. About/manifest preview.
11. Proof/case study placeholders — no invented proof.
12. FAQ.
13. Final CTA.
14. Footer.

Use the exact copy from the EN and PL copy files.

## 6. Hero animation

Create three premium organic, translucent, soft-body shapes. They are called Jellies but must not look like gummy bears.

### Blue Jelly

- colors: cyan, electric blue and violet,
- meaning: speed, technology and scaling,
- movement: fast but controlled, longer horizontal orbit.

### Green Jelly

- colors: acid green and emerald,
- meaning: people, growth and opportunity,
- movement: elastic vertical bounce and slow rotation.

### Heat Jelly

- colors: orange and red,
- meaning: energy, human connection and impact,
- movement: warmer pulse and diagonal orbit.

### Animation sequence

1. On initial load the three shapes enter slowly from different edges.
2. They float behind and beside the hero copy without reducing readability.
3. They deform subtly and react to pointer proximity.
4. Every few seconds they approach each other, exchange a soft wave of color and separate.
5. On first scroll they move outward to reveal the next section.
6. No flashing, aggressive shaking or continuous high-speed motion.

Use React Three Fiber/Drei only for this hero if the environment supports it. Use a CSS/SVG fallback on mobile and for `prefers-reduced-motion`. Load WebGL after critical text. Automatically reduce quality on low-power devices. The page must remain functional if WebGL fails.

Hero content:

- Eyebrow: WHO THE F*CK IS JELLY?
- H1: Hard problems. Fluid teams.
- Body: Verified software engineers and flexible delivery teams for companies that need to move now.
- CTA: GET THE JELLY DROP
- CTA: BUILD YOUR CREW
- Text link: Are you a developer? Join Jelly Crew →

## 7. Visual system

Use `07_DESIGN_TOKENS.json`.

Key rules:

- near-black background,
- white and soft-grey typography,
- color concentrated in Jellies, CTA states and small data accents,
- large geometric typography,
- premium whitespace,
- 20–28 px card radii,
- restrained glass effects,
- thin borders,
- visible keyboard focus,
- never place rainbow gradients on every component.

Use the provided Jelly Labs wordmark in the header and footer. Preserve its aspect ratio.

## 8. Talent cards

Create a reusable `TalentCard` component with:

- anonymized title,
- seniority,
- core stack,
- availability,
- English level,
- location/remote mode,
- last verified date,
- Request profile CTA.

Use mock data clearly marked in code as placeholder content. Do not invent real candidate names, employer history or contact data.

Add filters by role, stack, seniority, availability and language. If a live backend is unavailable, implement fully working client-side mock filtering and isolate the data access behind an adapter.

## 9. Forms

Implement:

1. Jelly List / Jelly Drop B2B form.
2. Build Your Crew client request form.
3. Join Jelly Crew candidate form.
4. Contact form.

Follow `05_FORMS_LEGAL_CRM.md`.

Requirements:

- server and client validation,
- clear error messages,
- honeypot and rate-limit adapter,
- consent checkboxes never preselected,
- email consent and phone consent separate,
- marketing consent not required to submit a direct service request,
- store UTM/referrer/source,
- create integration adapters for CRM and mailing system,
- implement double-opt-in state and confirmation screens,
- never expose secrets to the browser.

Use placeholders for legal entity information and block production build or show a clear build warning if they remain.

## 10. Insights

Create an Insights index supporting:

- Jelly Drop,
- Market Signals,
- Delivery,
- People,
- AI & Technology.

Use MDX or a replaceable CMS adapter. Build article cards, article template, author/date/read time, Open Graph metadata and newsletter CTA.

## 11. Recommended implementation

Preferred:

- Next.js App Router,
- TypeScript,
- Tailwind CSS,
- Framer Motion,
- React Three Fiber/Drei only in hero,
- Zod for schema validation,
- React Hook Form,
- MDX or replaceable headless CMS adapter.

If this stack is unavailable, preserve the architecture and behavior with the closest supported equivalents.

Use:

- strict TypeScript,
- semantic HTML,
- reusable components,
- CSS variables generated from design tokens,
- route-level metadata,
- lazy loading,
- optimized image handling,
- error boundaries around WebGL and forms.

## 12. SEO, accessibility and performance

- WCAG 2.2 AA.
- Full keyboard navigation.
- Correct labels and ARIA only where necessary.
- One H1 per route.
- EN/PL metadata and hreflang.
- Canonical URLs.
- Sitemap and robots.txt.
- Organization, Service, Article and FAQ schema.
- Open Graph images.
- Respect reduced motion.
- Aim for Lighthouse 85+ mobile and 95+ desktop.
- Keep LCP copy independent from hero animation.
- Prevent CLS.

## 13. Analytics

Create a consent-aware event layer for:

- hero_get_jelly_drop_click,
- hero_build_crew_click,
- talent_profile_request,
- jelly_list_form_start,
- jelly_list_submit,
- double_opt_in_confirmed,
- client_request_submit,
- developer_form_submit,
- newsletter_signup,
- language_change,
- contact_click.

Prepare adapters/placeholders for GA4, LinkedIn Insight Tag and the selected consent manager.

## 14. No fabrication

Never invent:

- client logos,
- testimonials,
- revenue,
- number of developers,
- placement speed,
- conversion statistics,
- candidate details,
- certifications.

Render explicit content placeholders where proof is missing and document what must be supplied before launch.

## 15. Work in phases

### Phase 1

Before coding, output:

1. final sitemap,
2. component tree,
3. proposed file structure,
4. dependencies and why each is needed,
5. list of unresolved production placeholders.

### Phase 2

Build:

- design system,
- header/navigation,
- homepage,
- hero animation with fallback,
- footer,
- EN/PL switch.

Stop and present the working result for review.

### Phase 3

After approval, build remaining routes, forms, content model, SEO and analytics.

### Phase 4

Run:

- typecheck,
- lint,
- production build,
- accessibility checks,
- responsive review at 375, 768, 1024, 1440 and 1920 px,
- performance review with and without WebGL.

Fix all blocking issues before declaring completion.

## 16. Final handoff

Provide:

- full source,
- README with local setup and deployment,
- `.env.example`,
- list of integrations,
- content editing instructions,
- asset attribution/status,
- legal placeholder checklist,
- QA checklist,
- instructions for replacing mock talent data with CMS data.

Start now with Phase 1. Do not ask generic questions already answered in the source files. Only ask if a missing fact would materially change architecture or prevent safe implementation.

