# Jelly Labs — prompts for missing images

These prompts generate the images listed as missing in `06_ASSET_MANIFEST.md`.
They work in GPT-Image / ChatGPT, Midjourney v7, Gemini (Imagen) and Ideogram. Settings for each tool are under each prompt.

## Before you start

1. **Use the shared style block.** Paste it at the end of every prompt (or add it once as a "style reference" / custom instruction). It keeps all images consistent with the site.
2. **Generate without text, then add the text afterwards.** Image models still misspell words, and text inside an image can't be translated, read by screen readers, or indexed by search engines. Headlines go on top in code or Figma. Where a card really needs baked-in text (social posts, email), use the **"with text"** variant, in GPT-Image or Ideogram only.
3. **Transparent PNGs:** most generators can't output real transparency. Generate on **pure black (#000000)**. I can turn black into proper transparency with the same un-blend script used for the logo. Drop the files into `assets/generated/` and ask.
4. **Save with the exact filenames below.** The site's image slots already expect these names and aspect ratios.

---

## Shared style block (append to every prompt)

```
Style: premium dark tech brand, "neon laboratory". Near-black background #07080D with a faint
graph-paper grid (thin lines, very low contrast) and soft neon light bleeding from the corners.
Hero objects are glossy, translucent, soft-body "jellies": organic liquid-glass forms with
saturated glowing rims, bright specular highlights, subtle internal refraction and caustics,
slight iridescent sheen. Three colour energies only:
- Electric: cyan #13C8FF → electric blue #306BFF → ultraviolet #6B38FF
- Acid: lime #D7FF54 → acid green #8DFF45 → emerald #00D47E
- Heat: amber #FFD25A → orange #FF9A31 → hot red #FF4D5E
Thin neon "circuit trace" lines ending in small glowing dots may connect elements.
Cinematic studio lighting, high detail, octane/redshift-quality render, sharp focus, generous
negative space, calm composition.
```

## Negative prompt (use wherever the tool supports it)

```
gummy bears, candy, sweets, cartoon, cute faces, eyes, mascots, emoji, pirates, skulls, ships,
parrots, stock photo, people at laptops, office, handshake, crypto coins, bitcoin, blockchain
cubes, generic blue corporate gradient, rainbow everywhere, clutter, watermark, logo, text,
letters, typography, lens dirt, low resolution, plastic toy look, flat vector
```

---

## 1. `01_Get_The_Jelly_Drop_1200.png` — Jelly Drop campaign card

**Where it's used:** homepage "Your tech bench. In your inbox." block, `/jelly-list`, Insights. **Size:** 1200×1200 (1:1).

```
A single drop of glossy translucent jelly falling from above into a shallow pool of liquid
light, captured at the moment of impact: the drop is Heat energy (amber to orange to hot red),
the splash crown and ripples glow in the same warm tones, tiny suspended droplets catch
specular highlights. The pool sits on a dark lab surface with a faint graph-paper grid.
Two thin neon circuit traces (cyan and lime) run in from the left edge and end in glowing dots
at the ripple. Composition: subject centred slightly right and low, clear dark negative space
in the upper-left third for a headline. Square format.
[SHARED STYLE BLOCK]
```

- Midjourney: add `--ar 1:1 --style raw --s 250 --no text,letters,candy,gummy`
- GPT-Image / Gemini: "square 1200×1200"

**With-text variant (GPT-Image / Ideogram only):** append
`Top-left, clean geometric sans-serif (like Space Grotesk), white: "Get the Jelly Drop." Small monospace caps below in light grey: "VERIFIED TECH TALENT. READY WHEN YOU ARE." No other text.`

---

## 2. `02_Your_Tech_Bench_Inbox_1200.png` — The Jelly Signal newsletter card

**Where it's used:** newsletter sign-up blocks, Insights index. **Size:** 1200×1200 (1:1).

```
A minimal dark glass envelope or inbox tray floating in space, semi-transparent, edges lit with
a thin rotating neon spectrum rim. From its open slot, three small glossy jellies rise like
bubbles: one Electric (cyan-blue-violet), one Acid (lime-emerald), one Heat (amber-red), each
glowing softly and casting coloured light onto the glass. Faint horizontal signal lines,
like an oscilloscope readout, pass behind the envelope. Lab graph-paper grid on the floor plane,
subtle reflections. Object centred, slight three-quarter angle from above, lots of dark
negative space. Square format.
[SHARED STYLE BLOCK]
```

- Midjourney: `--ar 1:1 --style raw --s 250`

**With-text variant:** `Top-left headline in white geometric sans: "Your tech bench. In your inbox." Small grey monospace caps: "THE JELLY SIGNAL". No other text.`

---

## 3. `03_Drop_Your_Contact_1200.png` — Jelly Box card

**Where it's used:** Jelly Box campaign, the double opt-in confirmation screen. **Size:** 1200×1200 (1:1).

```
A premium matte-black gift box, lid lifted and floating slightly above it, a thin neon spectrum
edge-light tracing the box seams. Inside the box, nested in dark foam, sit three glossy
translucent jellies: Electric, Acid and Heat, glowing and lighting the box interior in their
colours. A few tiny luminous droplets float above the opening. Dark lab surface with faint grid
and soft reflections. Luxury product-photography feel, three-quarter top view, subject centred,
generous negative space above. Square format.
[SHARED STYLE BLOCK]
```

- Midjourney: `--ar 1:1 --style raw --s 200`

**With-text variant:** `Headline in white geometric sans: "Drop your contact. Get the Jelly Box." Small grey monospace caps: "FOR VERIFIED B2B CONTACTS · SUBJECT TO TERMS". No other text.`

> Do not add prices, prize values, quantities or "free" claims. The Jelly Box terms are still a placeholder.

---

## 4. Open Graph images — 1200×630

Used when pages are shared on LinkedIn, Slack and other platforms. The page title is overlaid in code, so **the left 55% must stay empty and dark**.

**Base prompt (change the subject line for each page):**

```
Wide banner, dark near-black lab background with faint graph-paper grid and a few crosshair
markers. On the right 45% of the frame: [SUBJECT]. Two or three thin neon circuit traces run
horizontally from the left edge toward the subject and end in small glowing dots. Left 55% of
the frame stays empty, dark and calm for a headline overlay. 1200×630 composition.
[SHARED STYLE BLOCK]
```

| File | [SUBJECT] |
|---|---|
| `og-home.png` | three overlapping translucent jellies (Electric top, Acid right, Heat bottom), gently touching, colours blending where they overlap |
| `og-jelly-drop.png` | a single Heat-energy jelly drop splashing into a glowing pool |
| `og-about.png` | three jellies arranged in a loose triangle, connected by thin neon lines like a molecule or team diagram |
| `og-insights.png` | an oscilloscope-like neon waveform passing through a translucent Electric jelly lens, the wave changing colour as it exits |

- Midjourney: `--ar 40:21 --style raw`

---

## 5. Jelly element set — 36 transparent PNGs (12 shapes × 3 energies)

These are the reusable accents shown in the "Tactile tech energy" reference sheet: section accents, card inserts, motion elements.
**Size:** 1024×1024, on pure black for later conversion to transparency. **Filenames:** `jelly-{energy}-{shape}.png`, for example `jelly-acid-ring.png`.

```
A single [SHAPE] made of glossy translucent jelly / liquid glass, [ENERGY] colour energy,
saturated glowing rim, bright specular highlight top-left, soft internal refraction, gentle
iridescent sheen, isolated and centred on a pure solid black background (#000000), no floor,
no shadow, no grid, no other objects, studio product render, 3/4 view, high detail.
```

- **[SHAPE]**, one at a time: bubble (sphere) · capsule · soft rounded square · twisted loop (Möbius-like band) · ring (torus) · bean · double bubble (two fused spheres) · wave (S-shaped tube) · crescent / teardrop blade · flat ellipsoid disc · vertical drop · tri-node (three fused spheres around a hole)
- **[ENERGY]**: Electric (cyan #13C8FF → blue #306BFF → violet #6B38FF) · Acid (lime #D7FF54 → green #8DFF45 → emerald #00D47E) · Heat (amber #FFD25A → orange #FF9A31 → red #FF4D5E)

Tip: in Midjourney, generate the Electric set first, then use the best result as `--sref` (style reference) for the other two energies, so all 36 match. Add `--ar 1:1 --style raw --no background,floor,shadow,text`.

---

## 6. Service icons — 6 PNGs (glass "lab" icons)

For Solutions cards: Staff Augmentation, Dedicated Teams, AI/Data, Cloud/DevOps, QA, eCommerce.
**Size:** 512×512 on pure black (converted to transparency later). **Filenames:** `icon-{service}.png`.

> These would work better as SVG, since they need to stay crisp at 24–48px. Use these PNGs as concept art, or for large decorative placements only.

```
A minimal 3D icon made of 2–3 stacked translucent glass plates with glowing neon edges
(Electric energy: cyan to violet), floating at a slight isometric angle, depicting [CONCEPT].
Simple, iconic, readable at small sizes, no text. Isolated on pure black (#000000), no floor,
no shadow.
```

| File | [CONCEPT] |
|---|---|
| `icon-staff-augmentation.png` | a small figure-like node snapping onto a larger connected grid of nodes |
| `icon-dedicated-teams.png` | four nodes connected in a tight square cluster |
| `icon-ai-data.png` | a neural-network triangle of nodes above a stack of data layers |
| `icon-cloud-devops.png` | a soft cloud shape with a circular infinity loop arrow through it |
| `icon-qa.png` | a checkmark inside a hexagonal shield lens |
| `icon-ecommerce.png` | an open shopping bag silhouette with a small glowing node inside |

---

## 7. The Jelly Signal edition covers — 1600×900

One cover per newsletter or Insights article. Change the [THEME] line for each edition.

```
Editorial cover art, dark lab background with faint grid. A single translucent jelly sculpture
expressing [THEME], lit with neon rim light, placed right-of-centre. Left 50% empty for title
overlay. Calm, premium, magazine-quality. 16:9.
[SHARED STYLE BLOCK]
```

Example [THEME] values: "availability shifting week to week, shown as a jelly stretched across a timeline" · "AI and LLM skills, shown as a jelly refracting a neural-network pattern" · "delivery under pressure, shown as a jelly compressed between two glass plates and keeping its shape".

---

## 8. Hero concept reference — `JellyLabs_Hero_Concept_1600x900.png` (optional)

The live hero is already rendered in WebGL, so this image is only a reference or fallback for presentations.

```
Wide hero composition: three large overlapping translucent jellies on the right half
(Electric top-left of cluster, Acid right, Heat bottom), touching and exchanging colour where
they overlap. Thin neon circuit traces (cyan, lime, red) run in from the left edge and end in
glowing dots at each jelly. Left half dark and empty for headline. Faint graph-paper grid,
crosshair markers in the corners. 16:9.
[SHARED STYLE BLOCK]
```

- Midjourney: `--ar 16:9 --style raw --s 300`

---

## Do not generate these

| Asset | Why |
|---|---|
| Team / founder photos | Must be real people with consent. A generated face presented as the team would mislead visitors. Brief a photographer: dark background, black-and-white portraits, one coloured jelly light (Electric, Acid or Heat) as a rim light. |
| Client logos, case-study results, testimonials | Must be real and approved (`permissionConfirmed`, `evidenceConfirmed`). |
| `JellyLabs-wordmark.svg` | An image model can't reproduce the exact logo. Ask the designer for the source file, or have the JPG professionally vectorised. |
| Certificates or award badges | Not allowed without proof. |
