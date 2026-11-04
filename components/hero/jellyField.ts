import { GlRenderer, CpuRenderer, type JellyRenderer } from "./jellyRenderers";
import { CAM_Z, TAN_HALF } from "./jellyScene";

/**
 * Gooey WebGL jellies for the hero.
 *  - idle: a lime/violet cluster orbits and breathes; touching blobs fuse (pale overlap like the logo)
 *  - swarm: smaller jellies drift around the whole hero; the cursor collects them and they fuse on contact
 *  - pointer: a jelly follows the cursor, pulls everything nearby towards it and merges with it
 *  - scroll (`progress` 0→1): the cluster gathers into one big jelly that squeezes out lime drops — the shortlist
 *  - speed (scroll velocity, pointer speed) makes the surface ripple
 *  - follow (phones/tablets): the canvas is fixed behind the whole page; the jelly floats along and turns into a
 *    new shape for every section tagged `data-jelly` (see FORMS), vanishing in some; a touch only nudges it
 * Every blob is a damped spring, so all motion overshoots and settles like jelly.
 * Rendering is pluggable (jellyRenderers.ts): a WebGL ray-marcher on GPUs, a 2.5D CPU renderer in a worker otherwise.
 */

type Vec3 = [number, number, number];
type Blob = { o: Vec3; r: number; kind: number; f: Vec3; ph: number };

const CLUSTER: Blob[] = [
  { o: [-0.58, 0.32, 0.0], r: 0.6, kind: 0, f: [0.31, 0.27, 0.22], ph: 0.0 },
  { o: [0.46, 0.46, -0.2], r: 0.54, kind: 1, f: [0.26, 0.33, 0.2], ph: 1.7 },
  { o: [0.04, -0.34, 0.2], r: 0.66, kind: 1, f: [0.22, 0.24, 0.3], ph: 3.1 },
  { o: [-0.66, -0.6, -0.1], r: 0.36, kind: 0, f: [0.37, 0.29, 0.25], ph: 4.4 },
  { o: [0.8, -0.42, 0.1], r: 0.4, kind: 0, f: [0.29, 0.35, 0.27], ph: 5.2 },
  { o: [0.12, 0.98, -0.3], r: 0.28, kind: 1, f: [0.34, 0.25, 0.31], ph: 2.4 },
  { o: [-0.22, 0.72, 0.25], r: 0.34, kind: 0, f: [0.27, 0.31, 0.24], ph: 0.9 },
  { o: [0.58, 0.04, -0.35], r: 0.46, kind: 1, f: [0.24, 0.28, 0.33], ph: 3.8 },
];

/**
 * Swarm of smaller jellies spread over the hero, as fractions of the half-viewport (x, y in -1..1),
 * radius as a fraction of the half-height. Desktop anchors keep clear of the headline column on the left.
 */
type Drifter = { a: [number, number]; r: number; kind: number; ph: number };
const SWARM: Drifter[] = [
  { a: [-0.86, 0.8], r: 0.075, kind: 1, ph: 0.3 },
  { a: [-0.38, 0.9], r: 0.05, kind: 0, ph: 1.1 },
  { a: [0.08, 0.76], r: 0.09, kind: 0, ph: 2.0 },
  { a: [0.94, 0.84], r: 0.065, kind: 1, ph: 2.9 },
  { a: [0.97, -0.12], r: 0.08, kind: 0, ph: 3.7 },
  { a: [0.88, -0.78], r: 0.1, kind: 1, ph: 4.5 },
  { a: [0.42, -0.86], r: 0.06, kind: 0, ph: 5.3 },
  { a: [0.02, -0.6], r: 0.085, kind: 1, ph: 0.7 },
  { a: [-0.42, -0.84], r: 0.055, kind: 0, ph: 1.6 },
  { a: [-0.94, -0.7], r: 0.07, kind: 1, ph: 2.4 },
  { a: [0.12, 0.22], r: 0.06, kind: 1, ph: 3.2 },
  { a: [-0.05, -0.12], r: 0.05, kind: 0, ph: 4.1 },
];
const DROPS = 5;
// blob order: cluster, cursor, drops, swarm — the swarm sits last so the lite shader can simply loop over fewer blobs
const CURSOR = CLUSTER.length;
const SWARM0 = CURSOR + 1 + DROPS;
const N = SWARM0 + SWARM.length;
/** How strongly a touch pulls the jellies, relative to a mouse cursor. */
const TOUCH = 0.35;

/** Shapes the following jelly takes, by the `data-jelly` value of the section on screen. */
export const FORMS = ["cluster", "chain", "shortlist", "hidden", "split", "ring"] as const;
export type Form = (typeof FORMS)[number];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const elastic = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

type Spring = { p: number[]; v: number[] }; // x, y, z, r

export type JellyOptions = {
  reduced: boolean;
  coarse: boolean;
  /** Called (after the engine stopped itself) when even the lowest resolution can't keep up. */
  onSlow?: () => void;
  /**
   * Offline recording (scripts/record-jellies.mjs): full resolution, no pointer, frames driven by `advance()`,
   * and every idle frequency snapped to a multiple of 2π/period so the clip loops seamlessly.
   */
  capture?: { period: number; scale?: number };
  /** Render on the CPU (worker + 2D canvas) — for machines without GPU acceleration. Needs a canvas without a context. */
  cpu?: boolean;
  /** The canvas is fixed behind the page and the jelly follows the route set with `setRoute` / `setStation`. */
  follow?: boolean;
};

export class JellyField {
  private renderer: JellyRenderer;
  private springs: Spring[] = Array.from({ length: N }, () => ({ p: [0, 0, 0, 0], v: [0, 0, 0, 0] }));
  private blobBuf = new Float32Array(N * 4);
  private kindBuf = new Float32Array(N);
  private raf = 0;
  private running = false;
  private visible = true;
  private last = 0;
  private time = 0;
  private born = NaN; // time of start(); NaN = not started (blobs stay popped-out at radius 0)
  private scale: number;
  private minScale: number;
  private frameAvg = 16;
  private basePace = 16;
  private slowFrames = 0;
  private progress = 0;
  private wobble = 0;
  private velocity = 0;
  private pointer = { x: 0, y: 0, inside: false, speed: 0, lastX: 0, lastY: 0 };
  private hover = 0;
  private dispose: (() => void)[] = [];
  private swarmCount = 0;
  private route: Form[] = ["cluster"];
  private station = 0;
  private wasEmpty = false;
  private followSize = 0.4;
  // canvas CSS size, refreshed by the ResizeObserver (reading clientWidth inside the frame forces a layout)
  private cw = 1;
  private ch = 1;
  private skip = false;
  /** Free band for the hero jelly (viewport px at the top of the page): below the header, above the copy. */
  private band: [number, number] | null = null;
  private poke: { x: number; y: number } | null = null;
  private attractor: Element | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: JellyOptions,
  ) {
    // touch screens drop the swarm when following; desktop keeps it for the hero scene
    const swarm = opts.follow && opts.coarse ? 0 : opts.coarse ? 8 : SWARM.length;
    this.renderer = opts.cpu ? new CpuRenderer(canvas, () => this.fail()) : new GlRenderer(canvas, { n: N, lite: SWARM0, swarm });
    this.swarmCount = opts.follow && opts.coarse ? 0 : this.renderer.swarm;
    // GPU: buffer in device pixels (capped) so edges and highlights stay crisp on retina screens — the shader only
    // marches rays near the jellies, so the empty rest of the screen is nearly free. The CPU renderer starts coarser.
    const dpr = window.devicePixelRatio || 1;
    this.scale = opts.capture ? (opts.capture.scale ?? 1) : opts.cpu ? (opts.coarse ? 0.5 : 0.42) : Math.min(dpr, opts.coarse ? 2 : 1.5);
    // phones keep at least 1 CSS px per pixel: a busy CPU (not the GPU) is what slows them, and blur would not help
    this.minScale = opts.cpu ? 0.24 : Math.min(this.scale, opts.coarse ? 1 : 0.75);

    CLUSTER.forEach((b, i) => (this.kindBuf[i] = b.kind));
    this.kindBuf[CURSOR] = 0; // lime, like the CTAs
    for (let j = 0; j < DROPS; j++) this.kindBuf[CURSOR + 1 + j] = 0;
    SWARM.forEach((d, j) => (this.kindBuf[SWARM0 + j] = d.kind));

    this.measure();
    this.resize();
    // start everything at its idle position with zero radius → the intro "pops" them in
    this.layout(0, true);

    const ro = new ResizeObserver(() => {
      this.measure();
      this.resize();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      this.visible = !!e?.isIntersecting;
      if (this.visible) this.kick();
    });
    io.observe(canvas);
    const onVis = () => !document.hidden && this.kick();
    document.addEventListener("visibilitychange", onVis);
    this.dispose.push(() => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    });

    if (!opts.coarse && !opts.reduced && !opts.capture) {
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        const [hw, hh] = this.half();
        this.pointer.x = ((e.clientX - r.left) / r.width) * 2 * hw - hw;
        this.pointer.y = hh - ((e.clientY - r.top) / r.height) * 2 * hh;
        this.pointer.speed += Math.hypot(e.clientX - this.pointer.lastX, e.clientY - this.pointer.lastY);
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;
        this.pointer.inside = inside;
      };
      const onLeave = () => (this.pointer.inside = false);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      this.dispose.push(() => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      });
    } else if (opts.coarse && !opts.reduced && !opts.capture) {
      // touch: just a nudge — the jelly leans towards the finger and ripples (scrolling cancels the touch)
      const onTouch = (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        const r = canvas.getBoundingClientRect();
        const [hw, hh] = this.half();
        this.pointer.x = ((e.clientX - r.left) / r.width) * 2 * hw - hw;
        this.pointer.y = hh - ((e.clientY - r.top) / r.height) * 2 * hh;
        if (e.type === "pointerdown") {
          // a tap pokes the jelly: dent + jiggle (applied to the springs on the next frame)
          this.pointer.speed += 140;
          this.poke = { x: this.pointer.x, y: this.pointer.y };
          this.kick();
        }
        this.pointer.inside = true;
      };
      const onUp = () => (this.pointer.inside = false);
      window.addEventListener("pointerdown", onTouch, { passive: true });
      window.addEventListener("pointermove", onTouch, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      this.dispose.push(() => {
        window.removeEventListener("pointerdown", onTouch);
        window.removeEventListener("pointermove", onTouch);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      });
    }
  }

  /** World half-extent of the z=0 plane. */
  private half(): [number, number] {
    const hh = CAM_Z * TAN_HALF;
    return [hh * (this.cw / Math.max(1, this.ch)), hh];
  }

  private measure() {
    this.cw = this.canvas.clientWidth;
    this.ch = this.canvas.clientHeight;
  }

  private resize() {
    const w = Math.max(1, Math.round(this.cw * this.scale));
    const h = Math.max(1, Math.round(this.ch * this.scale));
    this.renderer.resize(w, h);
    this.kick();
  }

  /** Cluster placement for the current viewport: right of the copy on wide screens, above it on phones. */
  private frame() {
    const [hw, hh] = this.half();
    const aspect = hw / hh;
    if (aspect >= 1.15) return { cx: hw * 0.44, cy: 0.02, s: Math.min(1.2, hw * 0.34), mx: hw * 0.1, my: 0.1 };
    // narrower screens: the copy sits low, so the jellies live in the top band above it
    if (aspect >= 0.8) return { cx: hw * 0.36, cy: hh * 0.58, s: hw * 0.34, mx: hw * 0.2, my: hh * 0.5 };
    return { cx: hw * 0.14, cy: hh * 0.66, s: hw * 0.42, mx: 0, my: hh * 0.55 };
  }

  /** Angular frequency, snapped to whole cycles per capture period when recording a loop. */
  private w(f: number) {
    const period = this.opts.capture?.period;
    if (!period) return f;
    const step = (2 * Math.PI) / period;
    return Math.max(1, Math.round(f / step)) * step;
  }

  /** Compute targets for every blob and step the springs (or snap them when `snap`). */
  private layout(dt: number, snap = false) {
    const targets = this.opts.follow ? this.routeTargets() : this.heroTargets();
    const k = 120;
    const c = 13;
    targets.forEach((tg, i) => {
      const sp = this.springs[i]!;
      for (let a = 0; a < 4; a++) {
        if (snap) {
          sp.p[a] = a === 3 ? 0 : tg[a]!;
          sp.v[a] = 0;
          continue;
        }
        const acc = k * (tg[a]! - sp.p[a]!) - c * sp.v[a]!;
        sp.v[a]! += acc * dt;
        sp.p[a]! += sp.v[a]! * dt;
      }
      this.blobBuf.set([sp.p[0]!, sp.p[1]!, sp.p[2]!, Math.max(0, sp.p[3]!)], i * 4);
    });
  }

  /**
   * Following jelly: the formation of the section on screen, morphing into the next one over the last stretch of
   * the section. Dragged a little by the scrolling page and nudged by touches; springs make it all wobble.
   */
  private routeTargets() {
    const i = Math.min(Math.floor(this.station), this.route.length - 1);
    const u = clamp01(this.station - i);
    const here = this.route[i]!;
    const next = this.route[i + 1];
    const w = next ? easeInOut(smooth(0.72, 1, u)) : 0;
    this.followSize = this.formSize(here) + (next ? (this.formSize(next) - this.formSize(here)) * w : 0);
    const cur = this.fullForm(here, u);
    const to = next && w > 0 ? this.fullForm(next, 0) : cur;
    const appearT = Number.isNaN(this.born) ? 0 : this.time - this.born;
    const drag = Math.max(-0.45, Math.min(0.45, this.velocity * 0.012));
    // desktop hero = the full hero scene (its own pointer pull and pop-in); elsewhere the cursor only tugs a little
    const heroScene = here === "cluster" && !this.opts.coarse;
    const tug = this.opts.coarse ? 1 : 0.4;

    return cur.map((a, j) => {
      const b = to[j]!;
      const pos = a.map((v, k) => v + (b[k]! - v) * w);
      pos[1]! += drag;
      if (j < CLUSTER.length && !heroScene) {
        if (this.hover > 0.01) {
          const dx = this.pointer.x - pos[0]!;
          const dy = this.pointer.y - pos[1]!;
          const pull = Math.exp(-Math.hypot(dx, dy) * 0.7) * 0.7 * this.hover * tug;
          pos[0]! += dx * pull;
          pos[1]! += dy * pull;
        }
        pos[3]! *= elastic(clamp01((appearT - j * 0.09) / 1.4));
      }
      return pos;
    });
  }

  /** Targets for every blob (cluster, cursor, drops, swarm) of one formation; desktop hero = the hero scene. */
  private fullForm(name: Form, u: number): number[][] {
    if (name === "cluster" && !this.opts.coarse) return this.heroTargets();
    const out = this.form(name, u);
    out.splice(CURSOR, 0, [0, 0, 0, 0]); // the cursor jelly only lives in the desktop hero scene
    SWARM.forEach(() => out.push([0, 0, 0, 0]));
    return out;
  }

  /** World scale of a formation: the hero cluster is big (like on desktop), the rest are sized off s = hw * 0.4. */
  private formSize(name: Form) {
    if (name !== "cluster") return this.sectionScale();
    return this.opts.coarse ? this.heroFrame().sc : this.frame().s;
  }

  /** Size of the section formations: from the width on phones, capped by the height on wide screens. */
  private sectionScale() {
    const [hw, hh] = this.half();
    return Math.min(hw * 0.4, hh * 0.6);
  }

  /**
   * Hero cluster placement. With a measured free band it fits between the header and the copy (screens differ a lot
   * in height — iOS Safari shows far less than the emulators), otherwise it falls back to proportions.
   */
  private heroFrame() {
    const [hw, hh] = this.half();
    const cx = hw * 0.16;
    if (!this.band) return { cx, cy: hh * 0.32, sc: hw * 0.62 };
    const toY = (px: number) => hh - (px / Math.max(1, this.ch)) * 2 * hh;
    const top = toY(this.band[0]);
    const bottom = toY(this.band[1]);
    // the orbiting cluster spans ~2.6 sc vertically, its centre ~0.15 sc above the anchor
    const sc = Math.max(hw * 0.3, Math.min(hw * 0.62, (top - bottom) / 2.6));
    return { cx, cy: (top + bottom) / 2 - 0.15 * sc, sc };
  }

  /** Targets (x, y, z, r) of the cluster blobs then the drops for one formation; u = 0→1 through its section. */
  private form(name: Form, u: number): number[][] {
    const [hw, hh] = this.half();
    const t = this.time;
    const s = this.sectionScale();
    const out: number[][] = [];
    const noDrops = () => {
      for (let j = 0; j < DROPS; j++) out.push([hw, 0, 0, 0]);
    };
    switch (name) {
      case "cluster": {
        // hero: a big orbiting cluster above the copy, bleeding off the top/right edge like the desktop one,
        // rising as the hero scrolls away
        const { cx, cy: cy0, sc } = this.heroFrame();
        const cy = cy0 + hh * u * 0.45;
        CLUSTER.forEach((b) =>
          out.push([
            cx + (b.o[0] + Math.sin(t * b.f[0] + b.ph) * 0.2) * sc,
            cy + (b.o[1] + Math.cos(t * b.f[1] + b.ph) * 0.17) * sc,
            (b.o[2] + Math.sin(t * b.f[2] + b.ph) * 0.3) * sc,
            b.r * sc * (1 + Math.sin(t * 1.6 + b.ph) * 0.04),
          ]),
        );
        noDrops();
        break;
      }
      case "chain": {
        // a wavy string of jellies peeking in from the right edge, drifting up with the cards
        CLUSTER.forEach((b, i) =>
          out.push([
            hw * (0.95 + Math.sin(t * 0.7 + i * 0.9) * 0.08),
            hh * (1 - i * 0.28 + (u - 0.5) * 0.5) + Math.sin(t * 0.9 + b.ph) * 0.06,
            b.o[2] * s,
            b.r * s * 0.62 * (1 + Math.sin(t * 1.9 + b.ph) * 0.06),
          ]),
        );
        noDrops();
        break;
      }
      case "shortlist": {
        // one big jelly on the right edge squeezes out the shortlist: lime drops fall across the screen
        const mx = hw * 0.98;
        const my = hh * (0.3 + (u - 0.5) * 0.4);
        const squeeze = 1 + smooth(0.3, 0.45, u) * (1 - smooth(0.45, 0.8, u)) * 0.12;
        CLUSTER.forEach((b) =>
          out.push([mx + b.o[0] * s * 0.32, my + b.o[1] * s * 0.32 + Math.sin(t * 2.1 + b.ph) * 0.04, b.o[2] * s * 0.3, b.r * s * 0.95 * squeeze]),
        );
        for (let j = 0; j < DROPS; j++) {
          const local = clamp01((u - 0.12 - j * 0.1) / 0.45);
          const r = 0.17 * s * smooth(0, 0.12, local) * (1 - smooth(0.88, 1, local));
          out.push([mx - local * hw * (0.3 + j * 0.25), my - 0.35 * s - local * hh * 1.1, 0.25, r]);
        }
        break;
      }
      case "split": {
        // lime jellies on the left edge, violet on the right, sliding past each other
        CLUSTER.forEach((b) => {
          const side = b.kind === 0 ? -1 : 1;
          out.push([
            side * hw * 1.06 + b.o[0] * s * 0.35 + Math.sin(t * 0.6 + b.ph) * 0.05,
            side * hh * (u - 0.5) * 0.9 + b.o[1] * s * 0.5 + Math.cos(t * 0.5 + b.ph) * 0.05,
            b.o[2] * s * 0.5,
            b.r * s * 0.6,
          ]);
        });
        noDrops();
        break;
      }
      case "ring": {
        // a slowly turning ring of jellies around the screen edges, passing under the pricing cards
        CLUSTER.forEach((b, i) => {
          const a = (i / CLUSTER.length) * Math.PI * 2 + t * 0.22;
          out.push([Math.cos(a) * hw * 0.92, hh * 0.15 + Math.sin(a) * hh * 0.75, b.o[2] * s * 0.5, b.r * s * 0.55 * (1 + Math.sin(t * 1.9 + b.ph) * 0.08)]);
        });
        noDrops();
        break;
      }
      case "hidden":
        // gone: the jellies shrink away off the right edge
        CLUSTER.forEach((b) => out.push([hw * 1.25, b.o[1] * hh * 0.5, 0, 0]));
        noDrops();
        break;
    }
    return out;
  }

  /** Hero targets: idle cluster, swarm, pointer, and the pinned scroll story (`progress`). */
  private heroTargets() {
    const { cx, cy, s, mx, my } = this.frame();
    const [, hh] = this.half();
    const t = this.time;
    const w = (f: number) => this.w(f);
    const p = this.progress;
    const gather = easeInOut(smooth(0.02, 0.5, p));
    const appearT = Number.isNaN(this.born) ? 0 : this.time - this.born;
    const hover = this.hover;

    const targets: number[][] = [];
    CLUSTER.forEach((b, i) => {
      const orbit: Vec3 = [
        cx + (b.o[0] + Math.sin(t * w(b.f[0]) + b.ph) * 0.2) * s,
        cy + (b.o[1] + Math.cos(t * w(b.f[1]) + b.ph) * 0.17) * s,
        (b.o[2] + Math.sin(t * w(b.f[2]) + b.ph) * 0.3) * s,
      ];
      const merged: Vec3 = [mx + b.o[0] * s * 0.3, my + b.o[1] * s * 0.3 + Math.sin(t * 2.1 + b.ph) * 0.04, b.o[2] * s * 0.3];
      const pos = orbit.map((v, k) => v + (merged[k]! - v) * gather) as Vec3;
      // pointer pull: the cluster leans into the cursor and stretches towards it
      if (hover > 0.01) {
        const dx = this.pointer.x - pos[0];
        const dy = this.pointer.y - pos[1];
        const pull = Math.exp(-Math.hypot(dx, dy) * 0.7) * 0.7 * hover * (1 - gather * 0.6);
        pos[0] += dx * pull;
        pos[1] += dy * pull;
      }
      // breathing + a squeeze while the big jelly pushes drops out
      const squeeze = 1 + Math.sin(t * w(1.6) + b.ph) * 0.04 + smooth(0.5, 0.62, p) * (1 - smooth(0.62, 0.9, p)) * 0.12;
      const appear = this.opts.reduced ? 1 : elastic(clamp01((appearT - i * 0.09) / 1.4));
      targets.push([...pos, b.r * s * (1 + gather * 0.14) * squeeze * appear]);
    });

    // cursor jelly
    targets.push([this.pointer.x, this.pointer.y, 0.6, 0.36 * s * hover * (1 - gather * 0.5)]);

    // shortlist drops: peel off the bottom of the merged jelly and fall
    for (let j = 0; j < DROPS; j++) {
      const local = clamp01((p - 0.48 - j * 0.07) / 0.34);
      const r = 0.17 * s * smooth(0, 0.12, local) * (1 - smooth(0.88, 1, local));
      const spread = (j - (DROPS - 1) / 2) * 0.42 * s;
      targets.push([mx + spread * smooth(0, 0.5, local), my - 0.5 * s - local * hh * 1.3, 0.25, r]);
    }

    // swarm: drifts around the hero, gets collected by the cursor, sucked into the big jelly on scroll
    const [hw] = this.half();
    const narrow = hw / hh < 0.8;
    const count = this.swarmCount;
    const absorb = easeInOut(smooth(0.05, 0.55, p));
    SWARM.forEach((d, j) => {
      if (j >= count) {
        targets.push([0, 0, 0, 0]);
        return;
      }
      // phones: the copy fills the lower part, so the swarm lives in the top band
      const ay = narrow ? 0.35 + ((d.a[1] + 1) / 2) * 0.6 : d.a[1];
      const drift: Vec3 = [
        d.a[0] * hw * 0.92 + Math.sin(t * w(0.23) + d.ph) * hh * 0.12,
        ay * hh * 0.9 + Math.cos(t * w(0.19) + d.ph * 1.3) * hh * 0.1,
        Math.sin(t * w(0.3) + d.ph) * 0.4,
      ];
      const into: Vec3 = [mx + d.a[0] * s * 0.18, my + d.a[1] * s * 0.18, 0];
      const pos = drift.map((v, k) => v + (into[k]! - v) * absorb) as Vec3;
      if (hover > 0.01) {
        const dx = this.pointer.x - pos[0];
        const dy = this.pointer.y - pos[1];
        const grab = Math.exp(-Math.hypot(dx, dy) * 1.05) * 0.85 * hover * (1 - absorb);
        pos[0] += dx * grab;
        pos[1] += dy * grab;
      }
      const appear = this.opts.reduced ? 1 : elastic(clamp01((appearT - 0.55 - j * 0.07) / 1.2));
      const breathe = 1 + Math.sin(t * w(1.9) + d.ph) * 0.06;
      targets.push([...pos, d.r * 1.5 * hh * (narrow ? 0.8 : 1) * breathe * appear * (1 - absorb * 0.55)]);
    });
    return targets;
  }

  private draw() {
    // following: the size of the formation on screen (morphing between two), so goo and ripples keep proportion
    const size = this.opts.follow ? this.followSize : this.frame().s;
    this.renderer.draw({ blobs: this.blobBuf, kinds: this.kindBuf, time: this.time, wobble: this.wobble, size });
  }

  /** The renderer can't go on (lost context, worker error, too slow) → the caller shows the recorded video. */
  private fail() {
    this.stop();
    this.opts.onSlow?.();
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.running || !this.visible || document.hidden) return;
    // touch screens with nothing going on (no scroll, touch, ripple or pop-in): every other frame is plenty for the
    // slow idle motion — half the GPU and CPU while the reader rests
    const calm =
      this.opts.coarse && Math.abs(this.velocity) < 0.3 && this.hover < 0.02 && this.wobble < 0.05 && !this.poke && this.time - this.born > 2;
    if (calm && !this.skip) {
      this.skip = true;
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    const paced = this.skip;
    this.skip = false;
    const elapsed = this.last ? now - this.last : 16;
    const dt = Math.min(0.033, elapsed / 1000);
    this.last = now;
    this.time += dt;

    if (this.attractor) {
      // lean towards the call to action (hovered or focused): it becomes the "pointer"
      const r = this.attractor.getBoundingClientRect();
      const c = this.canvas.getBoundingClientRect();
      const [hw, hh] = this.half();
      this.pointer.x = ((r.left + r.width / 2 - c.left) / c.width) * 2 * hw - hw;
      this.pointer.y = hh - ((r.top + r.height / 2 - c.top) / c.height) * 2 * hh;
    }
    const pull = this.attractor ? 0.6 : this.pointer.inside ? (this.opts.coarse ? TOUCH : 1) : 0;
    this.hover += (pull - this.hover) * Math.min(1, dt * 4);
    const wobbleTarget = Math.min(1, Math.abs(this.velocity) * 0.035 + this.pointer.speed * 0.0025);
    this.wobble += (wobbleTarget - this.wobble) * Math.min(1, dt * 3);
    this.pointer.speed *= 0.85;

    // a few sub-steps keep the springs stable at low frame rates
    const sub = 3;
    if (this.poke) this.applyPoke(this.poke);
    for (let i = 0; i < sub; i++) this.layout(dt / sub);
    // nothing on screen (a section where the jelly is gone) → one cleared frame, then the GPU rests
    let empty = true;
    for (let i = 3; i < this.blobBuf.length; i += 4) if (this.blobBuf[i]! > 0.002) empty = false;
    if (!empty || !this.wasEmpty) this.draw();
    this.wasEmpty = empty;

    // adaptive resolution: keep ~50 fps (real frame time, not the clamped dt; the CPU renderer reports its own cost)
    const frameTime = paced ? elapsed / 2 : elapsed; // a deliberately skipped frame isn't a slow one
    this.frameAvg = this.frameAvg * 0.9 + Math.min(this.renderer.cost() ?? frameTime, 250) * 0.1;
    // the budget is relative to the fastest pace the display gives us (it creeps back up when frames stay slow), so
    // a browser capping animations at 30 fps (iOS Low Power Mode, background panes) doesn't read as an overloaded GPU
    this.basePace = Math.min(frameTime, this.basePace + 0.05);
    // (the CPU renderer works off the main thread, so ~25 fps there is fine)
    const budget = this.opts.cpu ? 40 : Math.max(24, this.basePace * 1.5);
    if (this.frameAvg > budget && this.scale > this.minScale) {
      this.scale = Math.max(this.minScale, this.scale * 0.85);
      this.frameAvg = 16;
      this.resize();
    } else if (this.frameAvg > budget * 2.5 && this.scale <= this.minScale && ++this.slowFrames > 30) {
      // still choppy at the lowest resolution → give up, the caller swaps in the recorded video
      this.fail();
      return;
    } else if (this.frameAvg < budget * 1.8) {
      this.slowFrames = 0;
    }

    if (this.opts.reduced && this.time > 0.5) return; // one settled frame is enough
    this.raf = requestAnimationFrame(this.loop);
  };

  private kick() {
    if (this.running && !this.raf && this.visible && !document.hidden) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  /** Tap: blobs near the finger get pushed away and squashed; the springs make them wobble back. */
  private applyPoke({ x, y }: { x: number; y: number }) {
    this.poke = null;
    const reach = this.half()[0] * 0.9;
    this.springs.forEach((sp) => {
      const r = sp.p[3]!;
      if (r < 0.002) return;
      const dx = sp.p[0]! - x;
      const dy = sp.p[1]! - y;
      const d = Math.max(0.05, Math.hypot(dx, dy));
      const f = Math.exp(-d / reach) * 6 * reach;
      sp.v[0]! += (dx / d) * f;
      sp.v[1]! += (dy / d) * f;
      sp.v[3]! -= r * 7 * Math.exp(-d / reach);
    });
  }

  /** Begin rendering; the jellies pop in with an elastic stagger. */
  start() {
    this.running = true;
    this.born = this.time;
    this.kick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setProgress(p: number) {
    this.progress = clamp01(p);
    this.kick();
  }

  /** Follow mode: the formations of the tagged sections, top to bottom. */
  setRoute(forms: Form[]) {
    if (forms.length) this.route = forms;
  }

  /** Follow mode: index of the section on screen + progress through it (e.g. 2.4). */
  /** Lean the jellies towards an element (the hero CTAs on hover/focus) with a little wobble; null lets go. */
  attract(el: Element | null) {
    if (el && el !== this.attractor) this.pointer.speed += 90;
    this.attractor = el;
    this.kick();
  }

  /** Follow mode: the free band (viewport px, page at the top) the hero jelly should fit into. */
  setBand(top: number, bottom: number) {
    this.band = bottom - top > 40 ? [top, bottom] : null;
  }

  setStation(s: number) {
    this.station = Math.max(0, s);
  }

  /** Recording only: step the simulation by `dt` seconds and render one frame synchronously. */
  advance(dt: number, render = true) {
    if (Number.isNaN(this.born)) this.born = this.time - 60; // already popped in
    this.time += dt;
    for (let i = 0; i < 3; i++) this.layout(dt / 3);
    if (render) this.draw();
  }

  setVelocity(v: number) {
    this.velocity = v;
  }

  destroy() {
    this.stop();
    this.dispose.forEach((d) => d());
    this.renderer.destroy();
  }
}
