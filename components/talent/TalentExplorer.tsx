"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { TalentProfile } from "@/lib/adapters/talent/types";
import { crewHref } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { TalentCard } from "./TalentCard";

type FilterKey = "role" | "stack" | "seniority" | "availability" | "language";
const KEYS: FilterKey[] = ["role", "stack", "seniority", "availability", "language"];

const SENIORITY_ORDER = ["mid", "senior", "lead", "architect"];
const AVAILABILITY_ORDER = ["immediate", "2_weeks", "1_month", "future"];
const ENGLISH_ORDER = ["B2", "C1", "C2"];

/** Client-side filtering over whatever the talent adapter returned (mock today, CMS later). Filters live in the URL. */
export function TalentExplorer({ profiles }: { profiles: TalentProfile[] }) {
  const t = useTranslations("talentPage");
  const tt = useTranslations("talent");
  const tc = useTranslations("cta");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const active = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])) as Record<FilterKey, string>;

  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs)];
    return {
      role: uniq(profiles.map((p) => p.role)).sort().map((v) => ({ value: v, label: v })),
      stack: uniq(profiles.flatMap((p) => [...p.coreStack, ...p.secondaryStack])).sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v })),
      seniority: SENIORITY_ORDER.filter((s) => profiles.some((p) => p.seniority === s)).map((v) => ({ value: v, label: tt(`seniority.${v}` as "seniority.mid") })),
      availability: AVAILABILITY_ORDER.filter((s) => profiles.some((p) => p.availability === s)).map((v) => ({ value: v, label: tt(`availability.${v}` as "availability.immediate") })),
      language: ENGLISH_ORDER.filter((s) => profiles.some((p) => p.englishLevel === s)).map((v) => ({ value: v, label: `${v}+` })),
    };
  }, [profiles, tt]);

  const results = useMemo(
    () =>
      profiles.filter((p) => {
        if (active.role && p.role !== active.role) return false;
        if (active.stack && ![...p.coreStack, ...p.secondaryStack].includes(active.stack)) return false;
        if (active.seniority && p.seniority !== active.seniority) return false;
        if (active.availability && AVAILABILITY_ORDER.indexOf(p.availability) > AVAILABILITY_ORDER.indexOf(active.availability)) return false;
        if (active.language && ENGLISH_ORDER.indexOf(p.englishLevel) < ENGLISH_ORDER.indexOf(active.language)) return false;
        return true;
      }),
    [profiles, active.role, active.stack, active.seniority, active.availability, active.language],
  );

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const anyActive = KEYS.some((k) => active[k]);

  return (
    <div>
      <form role="search" aria-label={t("filtersTitle")} onSubmit={(e) => e.preventDefault()} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
        {KEYS.map((k) => (
          <div key={k}>
            <label htmlFor={`f-${k}`} className="block text-xs font-medium tracking-wider text-muted uppercase">
              {t(`filters.${k}`)}
            </label>
            <div className="relative mt-2">
              <select
                id={`f-${k}`}
                value={active[k]}
                onChange={(e) => setFilter(k, e.target.value)}
                className="block min-h-12 w-full appearance-none rounded-2xl border border-line bg-bg/60 px-4 pr-10 text-base outline-none focus-visible:border-cyan focus-visible:shadow-[0_0_0_3px_rgb(19_200_255/0.25)]"
              >
                <option value="">{t("any")}</option>
                {options[k].map((o) => (
                  <option key={o.value} value={o.value} className="bg-surface">
                    {o.label}
                  </option>
                ))}
              </select>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </div>
          </div>
        ))}
      </form>

      <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="font-mono text-sm tracking-wider text-muted">
          {t("results", { count: results.length })}
        </p>
        {anyActive && (
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-fg">
            {t("reset")}
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.id}>
              <TalentCard profile={p} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-4 p-8 text-center sm:p-12">
          <h2 className="h3 text-2xl">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{t("emptyBody")}</p>
          <div className="mt-8">
            <ButtonLink href={crewHref()} arrow>
              {tc("createRequest")}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
