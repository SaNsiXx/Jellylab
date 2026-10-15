"use client";

import { useEffect } from "react";

const BUTTONS = ".btn-neon, .btn-neon-ghost";
const MAX_PULL = 6; // px

/**
 * One delegated pointer listener for the whole page (no per-element handlers):
 *  - magnetic neon buttons: --mx/--my (fine pointers only, not under reduced motion)
 *  - card spotlight: --sx/--sy (follows the cursor inside .card)
 * Only CSS variables change; styling lives in globals.css (.btn-neon translate, .card background).
 */
export function MicroInteractions() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches) return;

    let raf = 0;
    let last: PointerEvent | null = null;
    let activeBtn: HTMLElement | null = null;

    const release = () => {
      if (activeBtn) {
        activeBtn.style.setProperty("--mx", "0px");
        activeBtn.style.setProperty("--my", "0px");
        activeBtn = null;
      }
    };

    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      const card = target?.closest<HTMLElement>(".card");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - r.left}px`);
        card.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }

      const btn = reduce.matches ? null : target?.closest<HTMLElement>(BUTTONS);
      if (btn !== activeBtn) release();
      if (btn) {
        const r = btn.getBoundingClientRect();
        const dx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * MAX_PULL;
        const dy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * MAX_PULL * 0.6;
        btn.style.setProperty("--mx", `${Math.max(-MAX_PULL, Math.min(MAX_PULL, dx)).toFixed(1)}px`);
        btn.style.setProperty("--my", `${Math.max(-MAX_PULL, Math.min(MAX_PULL, dy)).toFixed(1)}px`);
        activeBtn = btn;
      }
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => release();

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      release();
    };
  }, []);
  return null;
}
