import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { crewHref, developerJoinHref, routes } from "@/lib/site";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { JellyStage } from "./JellyStage";
import { NeonHeadline } from "@/components/ui/NeonHeadline";

export async function Hero() {
  const t = await getTranslations();

  return (
    <section id="top" data-jelly="cluster" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28 pb-14 lg:justify-center lg:pb-24">
      <JellyStage />
      {/* Readability scrim: guarantees contrast for the copy regardless of where the Jellies drift. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(to_top,var(--color-bg)_30%,transparent_75%)] lg:bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-bg)_88%,transparent)_26%,color-mix(in_oklab,var(--color-bg)_45%,transparent)_50%,transparent_70%)]"
      />

      <div className="container-jl relative">
        <div data-hero-copy="" className="max-w-[46rem] lg:max-w-[62rem]">
          <p className="eyebrow flex items-center gap-3 text-fg/80">
            <span aria-hidden="true" className="h-px w-10 bg-[image:var(--grad-match)]" />
            {t("hero.eyebrow")}
          </p>
          {/* Brief: H1 desktop 72–104px. Long localised titles step down so they stay on two lines. */}
          <h1 id="hero-title" className={`h1 mt-6 ${t("hero.title").length > 30 ? "md:text-[clamp(4.5rem,6.4vw,5.75rem)]" : "md:text-[clamp(4.5rem,7.4vw,6.5rem)]"}`}>
            <NeonHeadline text={t("hero.title")} stacked />
          </h1>
          <p className="lead mt-6 max-w-[36rem] text-fg/85">{t("hero.body")}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink href={routes.jellyList} event="hero_get_jelly_drop_click" arrow>
              {t("cta.getDrop")}
            </TrackedLink>
            <TrackedLink href={crewHref()} event="hero_build_crew_click" variant="secondary">
              {t("cta.buildCrew")}
            </TrackedLink>
          </div>

          <p className="mt-8">
            <Link
              href={developerJoinHref}
              className="group inline-flex min-h-11 items-center gap-2 text-muted underline decoration-white/25 underline-offset-[6px] transition-colors hover:text-fg hover:decoration-lime"
            >
              {t("hero.devLink")}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </p>
          <p className="mt-10 font-mono text-xs tracking-[0.2em] text-muted uppercase">{t("hero.microcopy")}</p>
        </div>
      </div>
    </section>
  );
}
