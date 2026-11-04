"use client";

import { useEffect, useRef, useState } from "react";
import { FORMS, type Form, type JellyField } from "./jellyField";

/**
 * Live jellies — the same engine as Jelly Match (jellyField.ts), so the parent brand and the product share one material.
 * The canvas is fixed behind the whole page and follows the reader, changing shape in every section tagged `data-jelly`
 * (formations in jellyField.ts). Reduced motion → one settled frame in the hero.
 * No GPU (WebGL missing or CPU-emulated) → the same jellies drawn on the CPU in a worker (2.5D shading).
 * If that's unavailable or too slow too → a seamless recorded video.
 * The engine is a separate chunk, loaded once the page is idle so it never competes with LCP.
 */
export function JellyStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cpuCanvas = useRef<HTMLCanvasElement>(null); // a canvas can hold only one kind of context
  const [mode, setMode] = useState<"gpu" | "cpu" | "video">("gpu");

  useEffect(() => {
    const hero = rootRef.current!.parentElement!;
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const following = !reduced;
    let field: JellyField | null = null;
    let dead = false;

    // Following: the canvases live in <body>, fixed behind the whole page; z-index -1 and later in the DOM than the
    // backdrop puts them above the background and under all content; lvh, so the mobile toolbar doesn't resize them.
    const own: HTMLCanvasElement[] = [];
    const bodyCanvas = () => {
      const c = document.createElement("canvas");
      c.setAttribute("aria-hidden", "true");
      c.className = "pointer-events-none fixed inset-x-0 top-0 z-[-1] h-lvh w-full";
      document.body.appendChild(c);
      own.push(c);
      return c;
    };
    const dropOwn = () => own.forEach((c) => c.remove());
    const glCanvas = following ? bodyCanvas() : canvas.current;
    const cpuCanvasEl = following ? bodyCanvas() : cpuCanvas.current;
    const toVideo = () => {
      dropOwn();
      if (!dead) setMode("video");
      document.documentElement.dataset.noGpu = "";
    };

    const boot = () =>
      import("./jellyField")
        .then(({ JellyField }) => {
          if (dead || !glCanvas || !cpuCanvasEl) return;
          const options = {
            reduced,
            coarse,
            follow: following,
            onSlow: () => {
              console.info("[Jelly Labs] hero jellies too slow on this device — recorded version shown");
              toVideo();
            },
          };
          try {
            field = new JellyField(glCanvas, options);
          } catch (err) {
            console.info("[Jelly Labs] GPU jellies unavailable, drawing them on the CPU —", err instanceof Error ? err.message : err);
            field = new JellyField(cpuCanvasEl, { ...options, cpu: true });
            setMode("cpu"); // the failed WebGL canvas must go: a lost context paints white in some browsers
            if (following) glCanvas.remove();
            document.documentElement.dataset.noGpu = ""; // lighter page effects (globals.css)
          }
          if (following) measure();
          field.start();
        })
        .catch((err: unknown) => {
          console.info("[Jelly Labs] hero jellies: recorded version shown —", err instanceof Error ? err.message : err);
          toVideo();
        });
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle ? window.requestIdleCallback(boot, { timeout: 2500 }) : window.setTimeout(boot, 1200);

    // follow mode: where each tagged section starts (document px), re-measured whenever the layout settles
    let stops: { top: number; form: Form }[] = [];
    // scroll position from the scroll event and page height from the measure: the frame reads no layout
    let curY = window.scrollY;
    let docH = document.documentElement.scrollHeight;
    const onScroll = () => (curY = window.scrollY);
    const measure = () => {
      docH = document.documentElement.scrollHeight;
      // the hero jelly fits the free band between the header and the copy
      const header = document.querySelector("header");
      if (copy) field?.setBand((header?.offsetHeight ?? 72) + 8, hero.offsetTop + copy.offsetTop - 20);
      stops = Array.from(document.querySelectorAll<HTMLElement>("[data-jelly]"))
        .map((s) => ({ top: s.getBoundingClientRect().top + window.scrollY, form: s.dataset.jelly as Form }))
        .filter((s) => FORMS.includes(s.form));
      field?.setRoute(stops.map((s) => s.form));
    };
    let lastY = window.scrollY;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = curY;
      field?.setVelocity(y - lastY);
      lastY = y;
      const probe = y + window.innerHeight * 0.5;
      let i = 0;
      while (i + 1 < stops.length && stops[i + 1]!.top <= probe) i++;
      const top = stops[i]?.top ?? 0;
      const end = stops[i + 1]?.top ?? docH;
      field?.setStation(i + Math.min(1, Math.max(0, (probe - top) / Math.max(1, end - top))));
    };
    if (following) raf = requestAnimationFrame(tick);

    // the jelly leans towards the CTAs while they're hovered or focused (keyboard too)
    const ctas = reduced ? [] : Array.from(copy?.querySelectorAll("a") ?? []);
    const lean = (e: Event) => field?.attract(e.currentTarget as Element);
    const letGo = () => field?.attract(null);
    for (const a of ctas) {
      a.addEventListener("pointerenter", lean);
      a.addEventListener("focus", lean);
      a.addEventListener("pointerleave", letGo);
      a.addEventListener("blur", letGo);
    }
    const ro = new ResizeObserver(() => measure());
    if (following) {
      ro.observe(document.body);
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      dead = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(raf);
      for (const a of ctas) {
        a.removeEventListener("pointerenter", lean);
        a.removeEventListener("focus", lean);
        a.removeEventListener("pointerleave", letGo);
        a.removeEventListener("blur", letGo);
      }
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      dropOwn();
      field?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {/* live jellies in the hero — only used without follow (reduced motion); following, they live in <body> */}
      <canvas ref={canvas} className={`absolute inset-0 h-full w-full ${mode === "gpu" ? "" : "hidden"}`} />
      <canvas ref={cpuCanvas} className={`absolute inset-0 h-full w-full ${mode === "video" ? "hidden" : ""}`} />
      {mode === "video" && (
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_10%,#000_72%,transparent)]">
          <JellyVideo />
        </div>
      )}
    </div>
  );
}

/** Recorded jellies (WebM with alpha; MP4 on the page colour for Safari). Landscape or portrait cut. */
function JellyVideo() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // picked once on mount (it's only rendered after the client decided on the fallback) so just one file downloads
  const v = window.matchMedia("(min-aspect-ratio: 1/1)").matches ? "wide" : "tall";
  return (
    <video
      className={`h-full w-full object-cover ${v === "wide" ? "object-right" : "object-top"}`}
      poster={`/assets/hero-jellies-${v}.webp`}
      autoPlay={!reduced}
      loop
      muted
      playsInline
      preload={reduced ? "none" : "auto"}
    >
      <source src={`/assets/hero-jellies-${v}.webm`} type="video/webm" />
      <source src={`/assets/hero-jellies-${v}.mp4`} type="video/mp4" />
    </video>
  );
}
