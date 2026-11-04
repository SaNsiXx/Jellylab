import { fragment, vertex } from "./jellyShader";
import { CAM_Z, GOO, TAN_HALF } from "./jellyScene";

/** One frame of the simulation: blobs = xyz centre + radius (vec4 per blob), kinds = 0 lime / 1 violet. */
export type JellyFrame = { blobs: Float32Array; kinds: Float32Array; time: number; wobble: number; /** cluster scale */ size: number };

export interface JellyRenderer {
  /** How many swarm drifters this renderer can afford. */
  readonly swarm: number;
  resize(w: number, h: number): void;
  draw(frame: JellyFrame): void;
  /** Milliseconds the last frame really cost, when the main-thread frame time doesn't show it (worker). */
  cost(): number | null;
  destroy(): void;
}

/** Ray-marched SDF jellies on the GPU (see jellyShader.ts). Throws on CPU-emulated WebGL. */
export class GlRenderer implements JellyRenderer {
  readonly swarm: number;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private onLost = (e: Event) => e.preventDefault();

  constructor(
    private canvas: HTMLCanvasElement,
    cfg: { n: number; lite: number; swarm: number },
  ) {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL unavailable");
    // CPU-emulated WebGL (no GPU driver / acceleration off: SwiftShader, Windows "Microsoft Basic Render Driver",
    // Mesa llvmpipe) can't ray-march in real time — the caller switches to the CPU renderer
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    // (window.__jmForceWebGL lets automated visual checks bypass this)
    const force = (window as Window & { __jmForceWebGL?: boolean }).__jmForceWebGL;
    if (!force && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      throw new Error(`software renderer: ${renderer}`);
    }
    this.gl = gl;

    // Some GPUs/drivers (e.g. Direct3D via ANGLE on Windows) reject or choke on the full shader — retry lighter.
    const configs = [
      // (marching starts at the blobs' bounding spheres, so few steps are spent in empty space)
      { steps: cfg.swarm < 12 ? 44 : 64, loop: cfg.swarm ? cfg.n : cfg.lite, swarm: cfg.swarm },
      { steps: 40, loop: cfg.lite, swarm: 0 },
      { steps: 28, loop: cfg.lite, swarm: 0 },
    ];
    let prog: WebGLProgram | null = null;
    let swarm = 0;
    const errors: string[] = [];
    for (const c of configs) {
      prog = this.build(vertex, fragment(cfg.n, c.steps, c.loop), errors);
      if (prog) {
        swarm = c.swarm;
        break;
      }
    }
    if (!prog) throw new Error(`shader failed on ${renderer}: ${errors.join(" | ")}`);
    this.swarm = swarm;
    gl.useProgram(prog);
    this.prog = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    for (const u of ["uRes", "uTime", "uCamZ", "uTanHalf", "uBlob", "uKind", "uWobble", "uGoo", "uScale"]) this.loc[u] = gl.getUniformLocation(prog, u);
    gl.uniform1f(this.loc.uCamZ!, CAM_Z);
    gl.uniform1f(this.loc.uTanHalf!, TAN_HALF);
    gl.uniform1f(this.loc.uGoo!, GOO);
    canvas.addEventListener("webglcontextlost", this.onLost);
  }

  private build(vs: string, fs: string, errors: string[]) {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      errors.push(gl.getShaderInfoLog(sh) || "compile failed");
      gl.deleteShader(sh);
      return null;
    };
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = v && compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p;
    errors.push(gl.getProgramInfoLog(p) || "link failed");
    gl.deleteProgram(p);
    return null;
  }

  resize(w: number, h: number) {
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform2f(this.loc.uRes!, w, h);
  }

  draw({ blobs, kinds, time, wobble, size }: JellyFrame) {
    const gl = this.gl;
    // desktop hero = 1; smaller jellies scale their goo/ripples/glow with them (as the CPU renderer does)
    gl.uniform1f(this.loc.uScale!, Math.min(1, Math.max(0.25, size)));
    gl.uniform1f(this.loc.uTime!, time);
    gl.uniform4fv(this.loc.uBlob!, blobs);
    gl.uniform1fv(this.loc.uKind!, kinds);
    gl.uniform1f(this.loc.uWobble!, wobble);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  cost() {
    return null;
  }

  destroy() {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.gl.deleteProgram(this.prog);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/**
 * 2.5D jellies for machines without GPU acceleration: the worker (jellyCpu.worker.ts) shades a height field built
 * from the same blobs on an OffscreenCanvas, so the main thread (scrolling, GSAP) never waits for it.
 */
export class CpuRenderer implements JellyRenderer {
  readonly swarm = 12;
  private worker: Worker;
  private busy = false;
  private ms: number | null = null;

  constructor(canvas: HTMLCanvasElement, onError: () => void) {
    if (typeof Worker === "undefined" || !("transferControlToOffscreen" in canvas)) throw new Error("OffscreenCanvas unavailable");
    const offscreen = canvas.transferControlToOffscreen();
    this.worker = new Worker(new URL("./jellyCpu.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<{ ms: number }>) => {
      this.busy = false;
      this.ms = e.data.ms;
    };
    this.worker.onerror = (e) => {
      console.warn("[Jelly Labs] CPU jellies failed:", e.message);
      onError();
    };
    this.worker.postMessage({ type: "init", canvas: offscreen, camZ: CAM_Z, tanHalf: TAN_HALF, goo: GOO }, [offscreen]);
  }

  resize(w: number, h: number) {
    this.worker.postMessage({ type: "resize", w, h });
  }

  draw({ blobs, kinds, time, wobble, size }: JellyFrame) {
    // the simulation keeps its own pace; while the worker is busy, frames are simply skipped
    if (this.busy) return;
    this.busy = true;
    this.worker.postMessage({ type: "frame", blobs: blobs.slice(), kinds: kinds.slice(), time, wobble, size });
  }

  cost() {
    return this.ms;
  }

  destroy() {
    this.worker.terminate();
  }
}
