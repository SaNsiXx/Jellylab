// Generates the brand SVG asset set (replaces the missing PNGs from 06_ASSET_MANIFEST.md):
//   public/jelly/{energy}-{shape}.svg      36 transparent jelly elements (12 shapes × 3 energies)
//   public/campaign/*.svg (+ 1200px PNGs)  3 campaign cards: Jelly Drop, Tech Bench Inbox, Jelly Box
//   public/icons/*.svg                     10 service / capability icons
// Run: npm run brand:svgs   — everything is deterministic; edit numbers here, not the outputs.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = (...p) => path.join(root, "public", ...p);

const ENERGIES = {
  electric: ["#13C8FF", "#306BFF", "#6B38FF"],
  acid: ["#D7FF54", "#8DFF45", "#00D47E"],
  heat: ["#FFD25A", "#FF9A31", "#FF4D5E"],
};
const BG = "#07080D";

/* ───────────────────────── Jelly shapes ─────────────────────────
   kind "fill": closed geometry. kind "stroke": tube geometry (stroke width w).
   Geometry has NO fill/stroke attributes so <use> can paint it per layer.
   hl = specular highlights [cx, cy, rx, ry, rotateDeg] in a 512 box. */
const SHAPES = {
  bubble: { kind: "fill", geo: `<circle cx="256" cy="256" r="150"/>`, hl: [[200, 186, 62, 30, -30]] },
  capsule: { kind: "fill", geo: `<rect x="76" y="186" width="360" height="140" rx="70" transform="rotate(-22 256 256)"/>`, hl: [[190, 232, 70, 18, -22]] },
  "soft-square": { kind: "fill", geo: `<rect x="128" y="128" width="256" height="256" rx="84" transform="rotate(8 256 256)"/>`, hl: [[200, 180, 58, 24, -20]] },
  loop: {
    kind: "stroke",
    w: 44,
    geo: `<path d="M108 300 C 96 200 220 130 330 150 C 430 168 440 260 380 320 C 320 380 190 400 140 350 C 110 320 118 290 150 262"/>`,
    hl: [[220, 150, 60, 12, -14]],
  },
  ring: { kind: "stroke", w: 54, geo: `<circle cx="256" cy="256" r="128"/>`, hl: [[178, 160, 46, 14, -40]] },
  bean: {
    kind: "fill",
    geo: `<path d="M86 248 C78 150 180 112 270 122 C 372 134 428 196 420 266 C 412 336 352 372 282 360 C 238 352 214 334 168 350 C 112 370 90 318 86 248 Z"/>`,
    hl: [[200, 170, 70, 22, -12]],
  },
  "double-bubble": {
    kind: "fill",
    geo: `<circle cx="220" cy="292" r="118"/><circle cx="352" cy="166" r="68"/><circle cx="282" cy="452" r="24"/>`,
    hl: [[176, 236, 44, 20, -30], [334, 142, 22, 10, -30]],
  },
  wave: { kind: "stroke", w: 58, geo: `<path d="M86 316 C 140 170 230 170 256 256 C 282 342 372 342 426 196"/>`, hl: [[176, 214, 38, 10, -48]] },
  crescent: {
    kind: "fill",
    geo: `<path d="M150 430 C 90 320 140 160 300 92 C 360 68 420 72 440 86 C 360 110 300 170 270 250 C 236 340 216 400 150 430 Z"/>`,
    hl: [[300, 140, 46, 12, -40]],
  },
  disc: { kind: "fill", geo: `<ellipse cx="256" cy="256" rx="180" ry="96"/>`, hl: [[190, 210, 76, 18, -6]] },
  drop: { kind: "fill", geo: `<path d="M256 70 C 312 70 356 168 356 292 C 356 392 312 444 256 444 C 200 444 156 392 156 292 C 156 168 200 70 256 70 Z"/>`, hl: [[214, 170, 24, 62, 4]] },
  "tri-node": {
    kind: "fill",
    geo: `<circle cx="256" cy="162" r="78"/><circle cx="174" cy="304" r="78"/><circle cx="338" cy="304" r="78"/>`,
    hl: [[230, 126, 30, 14, -30], [148, 270, 30, 14, -30], [312, 270, 30, 14, -30]],
  },
};

/** One glossy translucent jelly. `p` = unique id prefix (several jellies can share one SVG). */
function jelly(p, shapeKey, energy, { glow = 0.5 } = {}) {
  const s = SHAPES[shapeKey];
  const [c1, c2, c3] = ENERGIES[energy];
  const paint = (attrs) => (s.kind === "fill" ? `fill="${attrs.fill ?? "none"}" ${attrs.stroke ? `stroke="${attrs.stroke}" stroke-width="${attrs.sw}"` : ""}` : `fill="none" stroke="${attrs.fill ?? attrs.stroke}" stroke-width="${attrs.sw ?? s.w}" stroke-linecap="round" stroke-linejoin="round"`);
  const w = s.w ?? 0;
  return `
  <defs>
    <g id="${p}-geo">${s.geo}</g>
    <linearGradient id="${p}-body" gradientUnits="userSpaceOnUse" x1="96" y1="96" x2="416" y2="416">
      <stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="${p}-core" gradientUnits="userSpaceOnUse" cx="270" cy="276" r="190">
      <stop offset="0" stop-color="${BG}" stop-opacity=".55"/><stop offset=".65" stop-color="${BG}" stop-opacity=".12"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${p}-caustic" gradientUnits="userSpaceOnUse" cx="330" cy="340" r="150">
      <stop offset="0" stop-color="${c1}" stop-opacity=".55"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${p}-rim" gradientUnits="userSpaceOnUse" x1="96" y1="96" x2="416" y2="416">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="${c1}" stop-opacity=".55"/><stop offset="1" stop-color="${c3}" stop-opacity=".95"/>
    </linearGradient>
    <radialGradient id="${p}-spec"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="${p}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="${p}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    <mask id="${p}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <use href="#${p}-geo" ${s.kind === "fill" ? `fill="#fff"` : `fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`}/>
    </mask>
  </defs>
  <use href="#${p}-geo" ${paint({ fill: c2, sw: w * 1.2 })} filter="url(#${p}-blur)" opacity="${glow}"/>
  <use href="#${p}-geo" ${paint({ fill: `url(#${p}-body)` })} opacity=".92"/>
  <g mask="url(#${p}-mask)">
    <rect width="512" height="512" fill="url(#${p}-core)"/>
    <rect width="512" height="512" fill="url(#${p}-caustic)"/>
    ${s.kind === "stroke" ? `<use href="#${p}-geo" fill="none" stroke="${c3}" stroke-opacity=".35" stroke-width="${w * 0.45}" stroke-linecap="round" transform="translate(4 6)"/>` : ""}
    ${s.hl.map(([cx, cy, rx, ry, r]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${cx} ${cy})" fill="url(#${p}-spec)" opacity=".8" filter="url(#${p}-soft)"/><ellipse cx="${cx - rx * 0.45}" cy="${cy + ry * 0.1}" rx="${Math.max(5, rx * 0.16)}" ry="${Math.max(3, ry * 0.32)}" transform="rotate(${r} ${cx} ${cy})" fill="#fff" opacity=".9"/>`).join("")}
  </g>
  ${s.kind === "fill" ? `<use href="#${p}-geo" fill="none" stroke="url(#${p}-rim)" stroke-width="4"/>` : `<use href="#${p}-geo" fill="none" stroke="url(#${p}-rim)" stroke-width="${w}" stroke-linecap="round" stroke-opacity=".28"/>`}`;
}

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${title ? `<title>${title}</title>` : ""}${body}</svg>\n`;

/* ───────────────────────── Shared card backdrop ───────────────────────── */
function backdrop(p, accent) {
  return `
  <defs>
    <pattern id="${p}-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
    <pattern id="${p}-fine" width="15" height="15" patternUnits="userSpaceOnUse"><path d="M15 0H0V15" fill="none" stroke="#fff" stroke-opacity=".02"/></pattern>
    <radialGradient id="${p}-g1" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="700"><stop offset="0" stop-color="#306BFF" stop-opacity=".22"/><stop offset="1" stop-color="#306BFF" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-g2" gradientUnits="userSpaceOnUse" cx="1200" cy="1200" r="760"><stop offset="0" stop-color="${accent}" stop-opacity=".2"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="1200" rx="56" fill="${BG}"/>
  <rect width="1200" height="1200" rx="56" fill="url(#${p}-fine)"/>
  <rect width="1200" height="1200" rx="56" fill="url(#${p}-grid)"/>
  <rect width="1200" height="1200" rx="56" fill="url(#${p}-g1)"/>
  <rect width="1200" height="1200" rx="56" fill="url(#${p}-g2)"/>
  <g stroke="#fff" stroke-opacity=".3" stroke-width="2">${[[90, 90], [1110, 90], [90, 1110], [1110, 1110]].map(([x, y]) => `<path d="M${x - 12} ${y}H${x + 12}M${x} ${y - 12}V${y + 12}"/>`).join("")}</g>
  <rect x="1" y="1" width="1198" height="1198" rx="55" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="2"/>`;
}

const trace = (d, color, end) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-opacity=".75"/><circle cx="${end[0]}" cy="${end[1]}" r="9" fill="${color}"/><circle cx="${end[0]}" cy="${end[1]}" r="20" fill="${color}" opacity=".18"/>`;
/** Places a 512-box jelly at (x, y) with scale s and rotation r. */
const place = (inner, x, y, s, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-256 -256)">${inner}</g>`;

/* 01 — Get the Jelly Drop: a heat drop falling into a pool of light. */
function cardDrop() {
  const ripples = [0, 1, 2, 3, 4]
    .map((i) => `<ellipse cx="700" cy="890" rx="${120 + i * 70}" ry="${26 + i * 15}" fill="none" stroke="url(#cd-ripple)" stroke-width="${4 - i * 0.6}" opacity="${0.9 - i * 0.17}"/>`)
    .join("");
  const droplets = [
    [600, 780, 0.12], [790, 760, 0.1], [520, 840, 0.07], [880, 830, 0.08], [700, 720, 0.06], [650, 690, 0.045], [760, 690, 0.04],
  ]
    .map(([x, y, s], i) => place(jelly(`cdd${i}`, "bubble", "heat", { glow: 0.6 }), x, y, s))
    .join("");
  return svg(
    1200,
    1200,
    `${backdrop("cd", "#FF4D5E")}
  <defs>
    <linearGradient id="cd-ripple" x1="0" x2="1"><stop offset="0" stop-color="#FFD25A"/><stop offset=".5" stop-color="#FF9A31"/><stop offset="1" stop-color="#FF4D5E"/></linearGradient>
    <radialGradient id="cd-pool" cx="700" cy="890" r="420" gradientUnits="userSpaceOnUse" gradientTransform="translate(700 890) scale(1 .25) translate(-700 -890)"><stop offset="0" stop-color="#FF9A31" stop-opacity=".55"/><stop offset=".6" stop-color="#FF4D5E" stop-opacity=".12"/><stop offset="1" stop-color="#FF4D5E" stop-opacity="0"/></radialGradient>
  </defs>
  ${trace("M0 940 H300 C350 940 360 900 410 900 H560", "#13C8FF", [560, 900])}
  ${trace("M0 1010 H420 C470 1010 490 960 540 950", "#8DFF45", [540, 950])}
  <ellipse cx="700" cy="890" rx="440" ry="110" fill="url(#cd-pool)"/>
  ${ripples}
  ${place(jelly("cdm", "drop", "heat", { glow: 0.7 }), 700, 470, 0.92, 4)}
  ${droplets}`,
    "Get the Jelly Drop",
  );
}

/* 02 — Your tech bench, in your inbox: glass envelope with three jellies rising. */
function cardInbox() {
  return svg(
    1200,
    1200,
    `${backdrop("ci", "#6B38FF")}
  <defs>
    <linearGradient id="ci-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#13C8FF"/><stop offset=".35" stop-color="#6B38FF"/><stop offset=".65" stop-color="#8DFF45"/><stop offset="1" stop-color="#FF9A31"/></linearGradient>
    <linearGradient id="ci-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
    <filter id="ci-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <path d="M60 1060 H360 L390 1030 L420 1090 L450 1000 L480 1110 L510 1060 H1140" fill="none" stroke="#13C8FF" stroke-opacity=".4" stroke-width="3"/>
  ${place(jelly("ci1", "bubble", "electric"), 500, 470, 0.44)}
  ${place(jelly("ci2", "bean", "acid"), 690, 330, 0.5, -12)}
  ${place(jelly("ci3", "capsule", "heat"), 800, 540, 0.34, 8)}
  <g transform="translate(330 620)">
    <rect width="540" height="360" rx="34" fill="none" stroke="url(#ci-edge)" stroke-width="10" filter="url(#ci-glow)" opacity=".7"/>
    <rect width="540" height="360" rx="34" fill="url(#ci-glass)" stroke="url(#ci-edge)" stroke-width="3"/>
    <path d="M14 22 L270 210 L526 22" fill="none" stroke="url(#ci-edge)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 342 L200 168 M526 342 L340 168" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
    <rect x="40" y="26" width="200" height="8" rx="4" fill="#fff" opacity=".35"/>
  </g>`,
    "Your tech bench. In your inbox.",
  );
}

/* 03 — Drop your contact / Jelly Box: matte box, lid lifted, three jellies inside. */
function cardBox() {
  const edge = `stroke="url(#cb-edge)" stroke-width="3" stroke-linejoin="round"`;
  return svg(
    1200,
    1200,
    `${backdrop("cb", "#FF9A31")}
  <defs>
    <linearGradient id="cb-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#13C8FF"/><stop offset=".5" stop-color="#8DFF45"/><stop offset="1" stop-color="#FF4D5E"/></linearGradient>
    <linearGradient id="cb-left" x1="0" x2="1"><stop offset="0" stop-color="#0c0e15"/><stop offset="1" stop-color="#151926"/></linearGradient>
    <linearGradient id="cb-right" x1="0" x2="1"><stop offset="0" stop-color="#11141e"/><stop offset="1" stop-color="#090b11"/></linearGradient>
    <radialGradient id="cb-inner" cx="600" cy="640" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF9A31" stop-opacity=".55"/><stop offset=".5" stop-color="#6B38FF" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <clipPath id="cb-open"><path d="M600 520 L860 640 L600 760 L340 640 Z M340 640 V 300 H 860 V 640"/></clipPath>
    <filter id="cb-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>
  <path d="M600 520 L860 640 L600 760 L340 640 Z" fill="url(#cb-inner)"/>
  <g clip-path="url(#cb-open)">
    ${place(jelly("cb1", "bubble", "electric"), 520, 600, 0.36)}
    ${place(jelly("cb2", "bean", "acid"), 680, 590, 0.38, -18)}
    ${place(jelly("cb3", "capsule", "heat"), 600, 680, 0.34, 10)}
  </g>
  <path d="M340 640 L600 760 V1000 L340 880 Z" fill="url(#cb-left)" ${edge}/>
  <path d="M860 640 L600 760 V1000 L860 880 Z" fill="url(#cb-right)" ${edge}/>
  <path d="M340 640 L600 760 L860 640" fill="none" ${edge} filter="url(#cb-glow)" opacity=".8"/>
  <g transform="translate(0 -150) rotate(-6 600 520)">
    <path d="M600 400 L880 520 L600 640 L320 520 Z" fill="#10131c" ${edge}/>
    <path d="M320 520 V560 L600 680 V640 Z M880 520 V560 L600 680 V640 Z" fill="#0b0d14" ${edge}/>
    <path d="M600 400 L880 520 L600 640 L320 520 Z" fill="none" stroke="url(#cb-edge)" stroke-width="10" filter="url(#cb-glow)" opacity=".5"/>
  </g>
  ${place(jelly("cbs1", "bubble", "heat", { glow: 0.6 }), 700, 300, 0.07)}
  ${place(jelly("cbs2", "bubble", "electric", { glow: 0.6 }), 520, 330, 0.05)}
  ${place(jelly("cbs3", "bubble", "acid", { glow: 0.6 }), 640, 250, 0.04)}`,
    "Jelly Box",
  );
}

/* ───────────────────────── Icons (64 box, neon line + glass plate) ───────────────────────── */
const ICONS = {
  "staff-augmentation": `<circle cx="20" cy="22" r="4"/><circle cx="34" cy="22" r="4"/><circle cx="20" cy="38" r="4"/><circle cx="34" cy="38" r="4"/><path d="M24 22h6M20 26v8M34 26v8M24 38h6"/><circle cx="48" cy="44" r="5" class="a"/><path d="M38 41l5 2" class="a"/><path d="M48 41v6M45 44h6" class="a"/>`,
  "dedicated-teams": `<circle cx="32" cy="32" r="7"/><circle cx="16" cy="18" r="4"/><circle cx="48" cy="18" r="4"/><circle cx="16" cy="46" r="4"/><circle cx="48" cy="46" r="4"/><path d="M19 21l8 6M45 21l-8 6M19 43l8-6M45 43l-8-6M20 18h24M20 46h24"/>`,
  specialists: `<circle cx="32" cy="32" r="16"/><circle cx="32" cy="32" r="7"/><circle cx="32" cy="32" r="2" class="f"/><path d="M32 10v8M32 46v8M10 32h8M46 32h8"/>`,
  leadership: `<circle cx="32" cy="32" r="18"/><path d="M38 26l-4 10-10 4 4-10z"/><circle cx="32" cy="32" r="2" class="f"/><path d="M32 12v3M32 49v3M12 32h3M49 32h3"/>`,
  frontend: `<rect x="10" y="14" width="44" height="34" rx="6"/><path d="M10 22h44"/><circle cx="15" cy="18" r="1" class="f"/><circle cx="19" cy="18" r="1" class="f"/><path d="M27 30l-5 5 5 5M37 30l5 5-5 5M34 28l-4 14" class="a"/>`,
  backend: `<rect x="14" y="12" width="36" height="11" rx="4"/><rect x="14" y="27" width="36" height="11" rx="4"/><rect x="14" y="42" width="36" height="11" rx="4"/><circle cx="20" cy="17.5" r="1.5" class="f"/><circle cx="20" cy="32.5" r="1.5" class="f"/><circle cx="20" cy="47.5" r="1.5" class="f"/><path d="M30 17.5h14M30 32.5h14M30 47.5h14" class="a"/>`,
  "cloud-devops": `<path d="M20 44h26a10 10 0 0 0 1-20 14 14 0 0 0-27-3 10 10 0 0 0 0 23z"/><path d="M24 34c3-4 6-4 8 0s5 4 8 0c-3-4-6-4-8 0s-5 4-8 0z" class="a"/>`,
  "ai-data": `<circle cx="32" cy="12" r="3.5"/><circle cx="20" cy="26" r="3.5"/><circle cx="44" cy="26" r="3.5"/><path d="M30 15l-8 8M34 15l8 8M23.5 26h17"/><path d="M14 38l18 7 18-7-18-7z" class="a"/><path d="M14 45l18 7 18-7" class="a"/>`,
  quality: `<path d="M32 8l20 8v14c0 13-9 22-20 26-11-4-20-13-20-26V16z"/><path d="M23 32l6 6 12-13" class="a"/>`,
  ecommerce: `<path d="M16 22h32l-3 30H19z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4"/><circle cx="32" cy="37" r="4" class="a"/><circle cx="32" cy="37" r="1.5" class="f"/>`,
};

function icon(name, body) {
  return svg(
    64,
    64,
    `<defs>
    <linearGradient id="i-g" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#13C8FF"/><stop offset=".55" stop-color="#306BFF"/><stop offset="1" stop-color="#6B38FF"/></linearGradient>
    <linearGradient id="i-a" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#D7FF54"/><stop offset="1" stop-color="#00D47E"/></linearGradient>
    <filter id="i-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <style>.l{fill:none;stroke:url(#i-g);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.l .a{stroke:url(#i-a)}.l .f{fill:url(#i-g);stroke:none}</style>
  </defs>
  <g class="l" filter="url(#i-glow)" opacity=".55">${body}</g>
  <g class="l">${body}</g>`,
    name,
  );
}

/* ───────────────────────── Write everything ───────────────────────── */
await mkdir(out("jelly"), { recursive: true });
await mkdir(out("campaign"), { recursive: true });
await mkdir(out("icons"), { recursive: true });

let n = 0;
for (const energy of Object.keys(ENERGIES)) {
  for (const shape of Object.keys(SHAPES)) {
    await writeFile(out("jelly", `${energy}-${shape}.svg`), svg(512, 512, jelly("j", shape, energy), `${energy} ${shape} jelly`));
    n++;
  }
}

const cards = [
  // 01 uses the supplied artwork (assets/generated/01_Get_The_Jelly_Drop_source.webp) — don't overwrite its PNG.
  ["jelly-drop", cardDrop(), null],
  // 02 uses the supplied artwork (assets/concepts/02_Your_Tech_Bench_Inbox_1200.png) — don't overwrite its PNG.
  ["tech-bench-inbox", cardInbox(), null],
  ["jelly-box", cardBox(), "03_Drop_Your_Contact_1200.png"],
];
for (const [name, markup, png] of cards) {
  await writeFile(out("campaign", `${name}.svg`), markup);
  // PNG exports for email / social, where SVG is not supported.
  if (png) await sharp(Buffer.from(markup), { density: 96 }).resize(1200, 1200).png({ compressionLevel: 9 }).toFile(out("campaign", png));
}

for (const [name, body] of Object.entries(ICONS)) await writeFile(out("icons", `${name}.svg`), icon(name, body));

console.log(`jelly elements: ${n} · campaign cards: ${cards.length} (+PNG) · icons: ${Object.keys(ICONS).length}`);
