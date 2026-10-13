import type { ReactNode } from "react";

type Accent = "blue" | "green" | "heat" | "none";

const dot: Record<Accent, string> = {
  blue: "bg-cyan shadow-[0_0_12px_var(--color-cyan)]",
  green: "bg-green shadow-[0_0_12px_var(--color-green)]",
  heat: "bg-orange shadow-[0_0_12px_var(--color-orange)]",
  none: "bg-muted",
};

export function Eyebrow({ children, accent = "none", className = "" }: { children: ReactNode; accent?: Accent; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot[accent]}`} />
      {children}
    </p>
  );
}

export function Section({
  id,
  labelledBy,
  children,
  className = "",
}: {
  id?: string;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`section-y relative ${className}`}>
      <div className="container-jl">{children}</div>
    </section>
  );
}
