# Assets — attribution & status

| Asset | Location | Origin | Status |
|---|---|---|---|
| Wordmark ("Jelly" animated + "Labs") | `public/brand/jellylabs-wordmark*.{webp,png}` | Extracted by `scripts/build-wordmark.mjs` from the client's `assets/concepts/logo2.jpg` (spectrum variant) | **Interim** — replace with official `JellyLabs-wordmark.svg` |
| Logo concept variants (heat / electric / acid / spectrum) | `assets/concepts/logo1–4.jpg` | Client brand pack | Reference |
| Reference renders & moodboards | `assets/concepts/*.jpg` | Client brand pack | Reference only, not shipped |
| 01 Get the Jelly Drop | `public/campaign/jelly-drop.jpg`, `01_Get_The_Jelly_Drop_1200.png`; original `assets/generated/01_Get_The_Jelly_Drop_source.webp` | Supplied by client (frame cropped) | **Confirm usage rights / provenance** |
| 02 Your Tech Bench Inbox | `public/campaign/tech-bench-inbox.jpg`, `02_Your_Tech_Bench_Inbox_1200.png`; original `assets/concepts/02_Your_Tech_Bench_Inbox_1200.png` (SVG version kept as fallback) | Supplied by client | **Confirm usage rights / provenance** |
| 03 Drop Your Contact | `public/campaign/jelly-box.svg`, `03_Drop_Your_Contact_1200.png` | Generated in code | Not used since the Jelly Box campaign was removed (kept for later) |
| 36 jelly elements (12 shapes × 3 energies) | `public/jelly/*.svg` | Generated in code | Ready |
| 10 service/capability icons | `public/icons/*.svg` | Generated in code | Ready |
| Hero Jellies | `components/hero/*` | WebGL shaders + SVG fallback, in code | Ready |
| Favicon / Apple icon | `app/icon.svg`, `app/apple-icon.png` | Generated in code | Ready |
| Open Graph images | `/api/og?title=…` | Generated at request time (next/og) | Ready |
| Fonts: Space Grotesk, Inter | via `next/font` (self-hosted at build) | Google Fonts, SIL Open Font License 1.1 | Ready |
| Icons in UI chrome (arrows, menu, chevrons) | inline SVG | In code | Ready |

## Still missing before full launch

- Official logo SVG (designer source file or professional vectorisation).
- Team / founder photography (real people, with consent — do not generate).
- Case studies with client permission and verified results.

No stock photography, client logos, testimonials or invented statistics are used anywhere on the site.
