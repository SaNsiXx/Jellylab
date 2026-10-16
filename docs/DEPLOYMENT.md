# Deployment — Vercel → jellylabs.com

URL structure (already implemented): **https://jellylabs.com** = English (default), **https://jellylabs.com/pl/…** = Polish,
identical slugs (`/careers` ↔ `/pl/careers`).

## Stage 1 — preview (now)

1. vercel.com → **Add New… → Project** → import GitHub repo **SaNsiXx/Jellylab** (authorise the Vercel GitHub app for it).
2. Framework is detected as **Next.js**; keep the default build (`npm run build`) and output settings. Root directory: repository root.
3. Environment variables — none required for the preview. Optional:
   - `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` → reviewers also see the dashed "content required" placeholders.
   - Do **not** set `DEPLOY_ENV` yet.
4. **Deploy.** The site is served at `https://<project>.vercel.app`; every `git push` to `main` redeploys.

What the preview does:
- `robots.txt` disallows everything → not indexed.
- Forms work end-to-end with **console adapters**: submissions are written (redacted) to Vercel → Project → Logs; the
  double opt-in link appears in the logs instead of an email. Nothing reaches a CRM or real inboxes.
- CV uploads are validated and discarded (nothing is stored on previews).
- Form submissions are only logged on previews (console mailer) unless `MAIL_PROVIDER` and `NOTIFY_EMAIL*` are set.
- The content panel (`/keystatic`) is hidden on deployments until GitHub mode is configured.
- Placeholder check prints a warning in the build log but does not block.

## Stage 2 — launch on jellylabs.com

1. Resolve `docs/LAUNCH_CHECKLIST.md`.
2. Vercel → Project → **Settings → Domains** → add `jellylabs.com` and `www.jellylabs.com` (redirect www → apex);
   set the DNS records Vercel shows at your registrar.
3. **Settings → Environment Variables** (Production):
   `NEXT_PUBLIC_SITE_URL=https://jellylabs.com`, `DEPLOY_ENV=production`, `DOI_SECRET`, CRM/mail/rate-limit/storage
   variables from `.env.example`, analytics IDs.
4. Redeploy. The build **fails on purpose** if any placeholder or required setting is still missing.
5. After launch: submit `https://jellylabs.com/sitemap.xml` in Google Search Console; run `npm run e2e` and
   `npm run lighthouse` against the live URL.
