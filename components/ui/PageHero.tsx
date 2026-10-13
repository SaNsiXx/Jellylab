import type { ReactNode } from "react";
import { Eyebrow } from "./Section";

type Accent = "blue" | "green" | "heat";

const glow: Record<Accent, string> = {
  blue: "bg-[image:var(--gradient-blue-jelly)]",
  green: "bg-[image:var(--gradient-green-jelly)]",
  heat: "bg-[image:var(--gradient-heat-jelly)]",
};

/** Sub-page header: one H1, optional eyebrow + intro, a single jelly glow in the page's accent. */
export function PageHero({ eyebrow, title, intro, accent = "blue", children }: { eyebrow?: string; title: string; intro?: string; accent?: Accent; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-16 lg:pt-48 lg:pb-24">
      <div aria-hidden="true" className={`absolute -top-24 -right-24 -z-10 h-80 w-[34rem] rotate-12 rounded-[48%_52%_44%_56%/55%_48%_52%_45%] opacity-25 blur-3xl ${glow[accent]}`} />
      <svg aria-hidden="true" className="absolute top-28 right-[8%] -z-10 hidden size-4 text-white/30 lg:block" viewBox="0 0 16 16" stroke="currentColor">
        <path d="M0 8h16M8 0v16" />
      </svg>
      <div className="container-jl">
        {eyebrow && <Eyebrow accent={accent} className="mb-6">{eyebrow}</Eyebrow>}
        <h1 className="h2 max-w-5xl lg:text-[clamp(3rem,5.6vw,5rem)]">{title}</h1>
        {intro && <p className="lead mt-6">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
