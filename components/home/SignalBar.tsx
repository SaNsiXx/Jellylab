"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Moving capability bar. Pausable (WCAG 2.2.2), static under reduced motion. */
export function SignalBar() {
  const t = useTranslations();
  const items = t.raw("signal.items") as string[];
  const [paused, setPaused] = useState(false);

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-display text-sm font-semibold tracking-[0.22em] text-fg/85 sm:px-8 sm:text-base">{item}</span>
          <span aria-hidden="true" className={`size-1.5 rounded-full ${["bg-cyan", "bg-green", "bg-orange"][i % 3]}`} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee relative border-y border-line bg-surface/60" data-paused={paused}>
      <div className="flex overflow-hidden py-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
        <div className="marquee-track flex w-max motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
          {row(false)}
          <div className="motion-reduce:hidden">{row(true)}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? t("a11y.playTicker") : t("a11y.pauseTicker")}
        className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg/80 text-muted backdrop-blur hover:text-fg motion-reduce:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
          {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
        </svg>
      </button>
    </div>
  );
}
