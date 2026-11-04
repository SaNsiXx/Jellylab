/// <reference lib="webworker" />
// CPU jellies (for machines without GPU acceleration): the same blobs as the WebGL ray-marcher, projected to 2D,
// fused with the same smooth minimum and shaded as a height field with the shader's lighting model
// (core glow, overlap seam, fresnel rim, softbox, speculars, caustics, bloom). Runs off the main thread.

type Init = { type: "init"; canvas: OffscreenCanvas; camZ: number; tanHalf: number; goo: number };
type Resize = { type: "resize"; w: number; h: number };
type Frame = { type: "frame"; blobs: Float32Array; kinds: Float32Array; time: number; wobble: number; size: number };

const LIME = [0.776, 1.0, 0.0];
const VIOLET = [0.545, 0.361, 0.965];
const BLEND = [0.86, 0.92, 0.66];
const norm3 = (x: number, y: number, z: number) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l] as const;
};
const L1 = norm3(-0.55, 0.8, 0.6);
const L2 = norm3(0.75, -0.45, 0.4);
const TILE = 16;
const BLOOM = 0.55; // world units beyond a blob where its glow is still visible
const HGOO = 0.22; // smoothing of the height union (world units)

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;
let camZ = 6;
let tanHalf = 0.32;
let goo = 0.52;
let W = 0;
let H = 0;
let img: ImageData;
let dist = new Float32Array(0); // fused signed distance (world units)
let height = new Float32Array(0); // height field inside the jelly
let mixT = new Float32Array(0); // 0 lime … 1 violet
let active = new Uint8Array(0); // per tile: anything to draw?
let colSin = new Float32Array(0);
let rowSin = new Float32Array(0);
let colCau = new Float32Array(0);
let rowCau = new Float32Array(0);

function resize(w: number, h: number) {
  if (w === W && h === H) return;
  W = canvas.width = w;
  H = canvas.height = h;
  img = ctx.createImageData(W, H);
  dist = new Float32Array(W * H);
  height = new Float32Array(W * H);
  mixT = new Float32Array(W * H);
  active = new Uint8Array(Math.ceil(W / TILE) * Math.ceil(H / TILE));
  colSin = new Float32Array(W);
  colCau = new Float32Array(W);
  rowSin = new Float32Array(H);
  rowCau = new Float32Array(H);
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function render({ blobs, kinds, time, wobble, size }: Frame) {
  // In 3D, balls at different depths don't all touch; flattened to 2D everything overlaps, so on small layouts
  // (phones: size ≈ 0.4) the fixed goo radius would melt the cluster into one mass — scale it with the cluster.
  const kGoo = goo * Math.min(1, Math.max(0.4, size / 1.2));
  const hh = camZ * tanHalf;
  const px = (2 * hh) / H; // world size of one pixel
  const x0 = -(W / 2) * px + px / 2;
  const y0 = (H / 2) * px - px / 2;

  // project the blobs onto the z=0 plane (perspective from the same camera as the shader)
  const bx: number[] = [];
  const by: number[] = [];
  const br: number[] = [];
  const bk: number[] = [];
  for (let i = 0; i < kinds.length; i++) {
    const r = blobs[i * 4 + 3]!;
    if (r < 0.002) continue;
    const s = camZ / (camZ - blobs[i * 4 + 2]!);
    bx.push(blobs[i * 4]! * s);
    by.push(blobs[i * 4 + 1]! * s);
    br.push(r * s);
    bk.push(kinds[i]!);
  }

  // living surface + caustics are separable sines → one value per column and per row
  const amp = 0.028 + 0.075 * wobble;
  const zWave = Math.sin(0.8 + time * 0.6283);
  for (let i = 0; i < W; i++) {
    const x = x0 + i * px;
    colSin[i] = Math.sin(x * 3.1 + time * 1.2566);
    colCau[i] = Math.sin(x * 9 + time * 1.2566);
  }
  for (let j = 0; j < H; j++) {
    const y = y0 - j * px;
    rowSin[j] = Math.sin(y * 2.7 - time * 0.9425) * amp * zWave;
    rowCau[j] = Math.sin(y * 8 - time * 0.9425);
  }

  const data = img.data;
  data.fill(0);
  const tw = Math.ceil(W / TILE);
  const th = Math.ceil(H / TILE);
  const list = new Int16Array(br.length);

  // pass 1: distance, colour mix and height for every pixel of the tiles near a blob
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const i0 = tx * TILE;
      const j0 = ty * TILE;
      const i1 = Math.min(W, i0 + TILE);
      const j1 = Math.min(H, j0 + TILE);
      const rx0 = x0 + i0 * px;
      const rx1 = x0 + (i1 - 1) * px;
      const ry1 = y0 - j0 * px;
      const ry0 = y0 - (j1 - 1) * px;
      let n = 0;
      for (let b = 0; b < br.length; b++) {
        const dx = Math.max(rx0 - bx[b]!, 0, bx[b]! - rx1);
        const dy = Math.max(ry0 - by[b]!, 0, by[b]! - ry1);
        if (Math.sqrt(dx * dx + dy * dy) - br[b]! < kGoo + BLOOM) list[n++] = b;
      }
      active[ty * tw + tx] = n ? 1 : 0;
      if (!n) continue;
      for (let j = j0; j < j1; j++) {
        const y = y0 - j * px;
        const ws = rowSin[j]!;
        for (let i = i0; i < i1; i++) {
          const x = x0 + i * px;
          let d = 1e3;
          let wl = 0;
          let wv = 0;
          let wr = 0;
          let hs = 0; // smooth union of the balls' own heights → rounded bulges like the 3D jellies
          for (let q = 0; q < n; q++) {
            const b = list[q]!;
            const dx = x - bx[b]!;
            const dy = y - by[b]!;
            const r = br[b]!;
            const rho2 = dx * dx + dy * dy;
            const e = Math.sqrt(rho2) - r;
            if (rho2 < r * r) {
              // smooth bump (flat at its foot, so no ring where a ball ends inside the mass); the steep outline
              // comes from the bridge profile below
              const q = 1 - rho2 / (r * r);
              const hb = r * q * (2 - q);
              const sh = Math.min(1, Math.max(0, 0.5 + 0.5 * (hb - hs) / HGOO));
              hs = hs + (hb - hs) * sh + HGOO * sh * (1 - sh);
            }
            // smooth minimum (same as the shader's smin)
            const h = Math.min(1, Math.max(0, 0.5 + 0.5 * (e - d) / kGoo));
            d = e + (d - e) * h - kGoo * h * (1 - h);
            // colour weights: fall off outside a ball (cheap exp(-9e)), grow inside it so each ball keeps its colour
            const f = e > 0 ? 1 / (1 + 9 * e + 40 * e * e) : (1 - 5 * e) * (1 - 5 * e) * (1 - 5 * e);
            const w = r * r * f;
            wl += w * (1 - bk[b]!);
            wv += w * bk[b]!;
            wr += w * r;
          }
          d += colSin[i]! * ws;
          const k = j * W + i;
          dist[k] = d;
          mixT[k] = wv / (wl + wv + 1e-4);
          if (d < 0) {
            // the gooey bridges between balls: a sphere-like profile of the depth below the fused outline
            // (√(depth·(2R − depth)) is exact for a single ball), kept a little lower so the balls bulge above it
            const R = wr / (wl + wv + 1e-6);
            const depth = Math.min(-d, R);
            const bridge = Math.sqrt(depth * (2 * R - depth)) * 0.8;
            const sh = Math.min(1, Math.max(0, 0.5 + 0.5 * (bridge - hs) / HGOO));
            height[k] = hs + (bridge - hs) * sh + HGOO * sh * (1 - sh);
          } else height[k] = 0;
        }
      }
    }
  }

  // pass 2: shade
  const inv2px = 1 / (2 * px);
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      if (!active[ty * tw + tx]) continue;
      const i0 = tx * TILE;
      const j0 = ty * TILE;
      const i1 = Math.min(W, i0 + TILE);
      const j1 = Math.min(H, j0 + TILE);
      for (let j = j0; j < j1; j++) {
        for (let i = i0; i < i1; i++) {
          const k = j * W + i;
          const d = dist[k]!;
          const t = mixT[k]!;
          const m = smoothstep(0.18, 0.82, t);
          const cr = LIME[0]! + (VIOLET[0]! - LIME[0]!) * m;
          const cg = LIME[1]! + (VIOLET[1]! - LIME[1]!) * m;
          const cb = LIME[2]! + (VIOLET[2]! - LIME[2]!) * m;
          let r: number;
          let g: number;
          let b: number;
          let a: number;
          if (d >= 0) {
            // outside: bloom + anti-aliased rim (straight alpha, so divide the premultiplied mix back out)
            const glow = Math.exp(-d * 7) * 0.3;
            const cov = 1 - smoothstep(0, px * 2.2, d); // a bit wider than the shader's: this buffer gets upscaled more
            a = Math.max(glow, cov * 0.9);
            if (a < 0.004) continue;
            const rr = Math.min(1, cr * 1.1 + 0.18);
            const rg = Math.min(1, cg * 1.1 + 0.18);
            const rb = Math.min(1, cb * 1.1 + 0.18);
            r = (cr * glow + (rr * a - cr * glow) * cov) / a;
            g = (cg * glow + (rg * a - cg * glow) * cov) / a;
            b = (cb * glow + (rb * a - cb * glow) * cov) / a;
          } else {
            const hl = i > 0 ? height[k - 1]! : 0;
            const hr = i < W - 1 ? height[k + 1]! : 0;
            const hu = j > 0 ? height[k - W]! : 0;
            const hd = j < H - 1 ? height[k + W]! : 0;
            const [nx, ny, nz] = norm3(-(hr - hl) * inv2px, -(hu - hd) * inv2px, 1);
            const ov = 1 - Math.abs(2 * t - 1);
            const diff = Math.max(nx * L1[0] + ny * L1[1] + nz * L1[2], 0) * 0.6 + 0.4;
            const f1 = 1 - nz;
            const fres = f1 * f1 * f1;
            const base = 0.16 + 0.42 * diff + 0.7 * nz * nz;
            r = cr * base;
            g = cg * base;
            b = cb * base;
            const s = ov * ov * 0.45; // luminous overlap seam
            const bl = 0.5 + 0.4 * diff;
            r += (BLEND[0]! * bl - r) * s;
            g += (BLEND[1]! * bl - g) * s;
            b += (BLEND[2]! * bl - b) * s;
            const rim = 0.5 + 0.5 * nx;
            r += (0.82 + (0.7 - 0.82) * rim) * fres * 0.85;
            g += (1.0 + (0.55 - 1.0) * rim) * fres * 0.85;
            b += (0.3 + (1.0 - 0.3) * rim) * fres * 0.85;
            // reflection of the view ray (0,0,-1) about n
            const qx = 2 * nz * nx;
            const qy = 2 * nz * ny;
            const qz = 2 * nz * nz - 1;
            const soft = smoothstep(0.5, 0.78, qy) * smoothstep(0.95, 0.45, Math.abs(qx + 0.25)) * 0.28;
            const s1 = Math.pow(Math.max(qx * L1[0] + qy * L1[1] + qz * L1[2], 0), 90) * 1.5;
            const s2 = Math.pow(Math.max(qx * L2[0] + qy * L2[1] + qz * L2[2], 0), 24) * 0.4;
            const cau = (colCau[i]! * rowCau[j]! * 0.5 + 0.5) * 0.07;
            r += soft + s1 + 0.78 * s2 + cr * cau;
            g += soft + s1 + 0.62 * s2 + cg * cau;
            b += soft + s1 + 1.0 * s2 + cb * cau;
            a = 0.9 + 0.1 * fres;
          }
          const o = k * 4;
          data[o] = r * 255;
          data[o + 1] = g * 255;
          data[o + 2] = b * 255;
          data[o + 3] = a * 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

self.onmessage = (e: MessageEvent<Init | Resize | Frame>) => {
  const m = e.data;
  if (m.type === "init") {
    canvas = m.canvas;
    ctx = canvas.getContext("2d")!;
    camZ = m.camZ;
    tanHalf = m.tanHalf;
    goo = m.goo;
  } else if (m.type === "resize") {
    resize(m.w, m.h);
  } else if (W && H) {
    const t0 = performance.now();
    render(m);
    self.postMessage({ ms: performance.now() - t0 });
  } else {
    self.postMessage({ ms: 0 });
  }
};
