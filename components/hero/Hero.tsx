import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { crewHref, developerJoinHref, routes } from "@/lib/site";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { JellyStage } from "./JellyStage";

/** Technical line motif from the brand reference — circuit traces ending in signal dots. */
function TechLines() {
  const lines = [
    { d: "M0 520 H360 C390 520 400 548 430 548 H880 C930 548 960 470 1010 420 H1060", c: "var(--color-cyan)" },
    { d: "M0 590 H980 C1010 590 1030 610 1060 640 C1080 660 1110 668 1150 668", c: "var(--color-green)" },
    { d: "M0 630 H760 C800 630 820 676 860 700 H1110", c: "var(--color-red)" },
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMinYMid slice" className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full opacity-80 lg:block">
      <g fill="none" strokeWidth="1.25">
        {lines.map((l) => (
          <path key={l.d} d={l.d} stroke={l.c} pathLength={1} className="tech-line" opacity="0.7" />
        ))}
      </g>
      <g className="tech-pulse">
        <circle cx="1060" cy="420" r="5" fill="var(--color-cyan)" />
        <circle cx="1150" cy="668" r="5" fill="var(--color-green)" />
        <circle cx="1110" cy="700" r="5" fill="var(--color-red)" />
      </g>
      {/* Signal pulses travelling along the traces (hidden under reduced motion). */}
      {lines.map((l, i) => (
        <circle key={`pulse-${i}`} r="3" fill={l.c} className="tech-pulse" style={{ color: l.c }}>
          <animateMotion dur={`${5 + i * 1.3}s`} begin={`${2.4 + i * 0.8}s`} repeatCount="indefinite" path={l.d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
      ))}
      {/* Lab crosshair markers */}
      <g stroke="white" strokeOpacity="0.28" strokeWidth="1">
        {[[96, 180], [1344, 180], [96, 760], [1344, 760]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x! - 7} ${y} H${x! + 7} M${x} ${y! - 7} V${y! + 7}`} />
        ))}
      </g>
      {/* faint grid */}
      <g stroke="white" strokeOpacity="0.07">
        <path d="M0 180 H1440 M0 760 H1440 M96 0 V900 M1344 0 V900" />
      </g>
    </svg>
  );
}

export async function Hero() {
  const t = await getTranslations();
  const [line1, ...rest] = t("hero.title").split(/(?<=\.)\s/);

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28 pb-14 lg:justify-center lg:pb-24">
      <TechLines />
      <JellyStage />
      {/* Readability scrim: guarantees contrast for the copy regardless of where the Jellies drift. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(to_top,var(--color-bg)_30%,transparent_75%)] lg:bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-bg)_88%,transparent)_26%,color-mix(in_oklab,var(--color-bg)_45%,transparent)_50%,transparent_70%)]"
      />

      <div className="container-jl relative">
        <div className="max-w-[46rem] lg:max-w-[62rem]">
          <p className="eyebrow flex items-center gap-3 text-fg/80">
            <span aria-hidden="true" className="header-neon-line h-px w-10" />
            {t("hero.eyebrow")}
          </p>
          {/* Brief: H1 desktop 72–104px. Long localised titles step down so they stay on two lines. */}
          <h1 id="hero-title" className={`h1 mt-6 ${t("hero.title").length > 30 ? "md:text-[clamp(4.5rem,6.4vw,5.75rem)]" : "md:text-[clamp(4.5rem,7.4vw,6.5rem)]"}`}>
            <span className="block">{line1}</span>
            {rest.length > 0 && <span className="neon-text block">{rest.join(" ")}</span>}
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
              className="group inline-flex min-h-11 items-center gap-2 text-muted underline decoration-white/25 underline-offset-[6px] transition-colors hover:text-fg hover:decoration-green"
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
