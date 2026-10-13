// INTERIM wordmark: the brand pack ships only JPG wordmarks on a near-black background.
// This "un-blends" the dark background into true alpha so the logo sits cleanly on any dark
// surface, then crops to the letterforms. Replace with JellyLabs-wordmark.svg when supplied
// (see docs/ASSETS.md) — components/layout/Wordmark.tsx is the only consumer.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "assets/concepts/logo2.jpg"); // spectrum variant
const outBase = path.join(root, "public/brand/jellylabs-wordmark");

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// Background colour = median of the four corners.
const px = (x, y) => {
  const i = (y * width + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};
const corners = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3)];
const bg = [0, 1, 2].map((c) => corners.map((p) => p[c]).sort((a, b) => a - b)[1]);

const out = Buffer.alloc(width * height * 4);
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    const o = (y * width + x) * 4;
    // alpha = how far the pixel departs from bg, relative to the max possible departure
    let a = 0;
    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      const range = v >= bg[c] ? 255 - bg[c] : bg[c];
      a = Math.max(a, range ? Math.abs(v - bg[c]) / range : 0);
    }
    a = a < 0.04 ? 0 : Math.min(1, a); // kill JPEG noise
    for (let c = 0; c < 3; c++) {
      out[o + c] = a ? Math.max(0, Math.min(255, Math.round((data[i + c] - bg[c] * (1 - a)) / a))) : 0;
    }
    out[o + 3] = Math.round(a * 255);
    if (a > 0.25) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 4;
const crop = {
  left: Math.max(0, minX - pad),
  top: Math.max(0, minY - pad),
  width: Math.min(width, maxX + pad) - Math.max(0, minX - pad),
  height: Math.min(height, maxY + pad) - Math.max(0, minY - pad),
};
const img = sharp(out, { raw: { width, height, channels: 4 } }).extract(crop);
await img.clone().resize({ width: 640 }).webp({ quality: 92, alphaQuality: 100 }).toFile(`${outBase}.webp`);
await img.clone().resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(`${outBase}.png`);
console.log(`wordmark ${crop.width}×${crop.height} (ratio ${(crop.width / crop.height).toFixed(4)}) bg=${bg}`);

// Split layers for the animated wordmark: "Jelly" becomes an alpha mask that a moving neon
// gradient shows through; "Labs" stays as the original white letterforms.
{
  const full = await sharp(`${outBase}.png`).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = full.info;
  // Widest empty column run in the middle third = gap between "Jelly" and "Labs".
  let best = [0, 0], start = -1;
  for (let x = Math.floor(w / 3); x < Math.floor((2 * w) / 3); x++) {
    let a = 0;
    for (let y = 0; y < h; y++) a = Math.max(a, full.data[(y * w + x) * ch + 3]);
    if (a < 10) { if (start < 0) start = x; }
    else if (start >= 0) { if (x - start > best[1] - best[0]) best = [start, x]; start = -1; }
  }
  const split = Math.round((best[0] + best[1]) / 2);
  const jelly = Buffer.alloc(w * h * 4);
  const labs = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const x = i % w;
    const a = full.data[i * ch + 3];
    if (x < split) { jelly[i * 4] = jelly[i * 4 + 1] = jelly[i * 4 + 2] = 255; jelly[i * 4 + 3] = a; }
    else for (let c = 0; c < 4; c++) labs[i * 4 + c] = full.data[i * ch + c];
  }
  await sharp(jelly, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`${outBase}-jelly-mask.png`);
  await sharp(labs, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(`${outBase}-labs.webp`);
  console.log(`split at x=${split}/${w}`);
}
