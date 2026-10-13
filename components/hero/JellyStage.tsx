"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { JellyFallback } from "./JellyFallback";
import type { Quality } from "./JellyCanvas";

// three.js is only fetched when WebGL is actually going to run.
const JellyCanvas = dynamic(() => import("./JellyCanvas"), { ssr: false });

class WebGLBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[hero] WebGL disabled:", error);
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Mode = "svg" | "webgl";

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  return cores <= 4 || memory <= 4 ? "low" : "high";
}

/**
 * Decides between the CSS/SVG Jellies (SSR default; mobile; reduced motion; no WebGL)
 * and the WebGL scene, which is loaded only after the page is idle so it never competes with LCP.
 */
export function JellyStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<Mode>("svg");
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [quality, setQuality] = useState<Quality>("high");

  const fallback = useCallback(() => {
    setMode("svg");
    setReady(false);
  }, []);

  // Choose mode after idle.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const hasIdle = typeof window.requestIdleCallback === "function";
    let idle = 0;

    const evaluate = () => {
      const eligible = !reduce.matches && wide.matches && !nav.connection?.saveData && supportsWebGL();
      if (!eligible) return fallback();
      const start = () => {
        setQuality(detectQuality());
        setMode("webgl");
      };
      idle = hasIdle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    };
    evaluate();
    reduce.addEventListener("change", evaluate);
    wide.addEventListener("change", evaluate);
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      reduce.removeEventListener("change", evaluate);
      wide.removeEventListener("change", evaluate);
    };
  }, [fallback]);

  // Scroll progress (drives the outward move) + pointer + visibility.
  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.parentElement;
    if (!root || !hero) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.75)));
        progressRef.current = p;
        root.style.setProperty("--p", p.toFixed(3));
      });
    };
    const onPointer = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      pointerRef.current = inside ? { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) } : null;
    };
    const onLeave = () => (pointerRef.current = null);
    const io = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { threshold: 0 });
    io.observe(hero);
    const onVis = () => setVisible(document.visibilityState === "visible" && hero.getBoundingClientRect().bottom > 0);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <JellyFallback hidden={mode === "webgl" && ready} />
      {mode === "webgl" && (
        <WebGLBoundary onError={fallback}>
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <JellyCanvas
              progressRef={progressRef}
              pointerRef={pointerRef}
              active={visible}
              initialQuality={quality}
              onReady={() => setReady(true)}
              onFallback={fallback}
            />
          </div>
        </WebGLBoundary>
      )}
    </div>
  );
}
