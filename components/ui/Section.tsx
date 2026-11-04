import type { ReactNode } from "react";
import type { Form } from "@/components/hero/jellyField";

type Accent = "blue" | "green" | "heat" | "none";

const dot: Record<Accent, string> = {
  blue: "bg-violet-hi shadow-[0_0_12px_var(--color-violet-hi)]",
  green: "bg-lime shadow-[0_0_12px_var(--color-lime)]",
  heat: "bg-blend shadow-[0_0_12px_var(--color-blend)]",
  none: "bg-muted",
};

export function Eyebrow({ children, accent = "none", className = "" }: { children: ReactNode; accent?: Accent; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className={`live-dot size-1.5 rounded-full ${dot[accent]}`} />
      {children}
    </p>
  );
}

export function Section({
  id,
  labelledBy,
  jelly,
  children,
  className = "",
}: {
  id?: string;
  labelledBy?: string;
  /** Shape the page-following jelly takes while this section is on screen (home page only; see jellyField.ts). */
  jelly?: Form;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} data-jelly={jelly} aria-labelledby={labelledBy} className={`section-y relative ${className}`}>
      <div className="container-jl">{children}</div>
    </section>
  );
}
