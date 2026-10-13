import type { ReactNode } from "react";
import { CampaignArt, type CampaignName } from "@/components/ui/BrandArt";

/** Centered confirmation / status screen used across the double opt-in flow. One H1. */
export function StatusScreen({ title, body, hint, variant = "ok", art, children }: { title: string; body: string; hint?: string; variant?: "ok" | "mail" | "error"; art?: CampaignName; children?: ReactNode }) {
  const dot = variant === "error" ? "bg-red shadow-[0_0_18px_var(--color-red)]" : variant === "mail" ? "bg-cyan shadow-[0_0_18px_var(--color-cyan)]" : "bg-green shadow-[0_0_18px_var(--color-green)]";
  return (
    <section className="relative isolate container-jl grid min-h-[80svh] items-center gap-12 pt-32 pb-20 lg:grid-cols-12">
      <div className="flex flex-col items-start lg:col-span-7">
      <div aria-hidden="true" className="absolute top-1/3 right-0 -z-10 h-72 w-[30rem] rotate-12 rounded-[48%_52%_44%_56%/55%_48%_52%_45%] bg-[image:var(--gradient-heat-jelly)] opacity-20 blur-3xl" />
      <span aria-hidden="true" className={`live-dot size-3 rounded-full ${dot}`} />
      <h1 className="h2 mt-8 max-w-3xl">{title}</h1>
      <p className="lead mt-6">{body}</p>
      {hint && <p className="mt-4 max-w-xl text-sm text-muted">{hint}</p>}
      {children && <div className="mt-10">{children}</div>}
      </div>
      {art && (
        <div className="lg:col-span-4 lg:col-start-9">
          <CampaignArt name={art} priority className="mx-auto max-w-sm border border-line" />
        </div>
      )}
    </section>
  );
}
