import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { TalentProfile } from "@/lib/adapters/talent/types";
import { crewHref } from "@/lib/site";
import { TrackedLink } from "@/components/ui/TrackedLink";

const availabilityTone: Record<TalentProfile["availability"], string> = {
  immediate: "live-dot bg-green shadow-[0_0_10px_var(--color-green)]",
  "2_weeks": "bg-emerald shadow-[0_0_8px_var(--color-emerald)]",
  "1_month": "bg-cyan shadow-[0_0_8px_var(--color-cyan)]",
  future: "bg-muted",
};

// Hook-based (not async) so it renders in both Server Components (homepage) and the client-side talent explorer.
export function TalentCard({ profile, headingLevel = "h3" }: { profile: TalentProfile; headingLevel?: "h2" | "h3" }) {
  const t = useTranslations("talent");
  const tc = useTranslations("cta");
  const locale = useLocale() as "en" | "pl";
  const format = useFormatter();
  const H = headingLevel;
  const verified = new Date(profile.availabilityVerifiedAt);

  return (
    <article className="card group flex h-full flex-col p-6 transition-colors duration-[var(--duration-standard)] hover:border-white/25 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-xs tracking-[0.12em] whitespace-nowrap text-muted">{profile.id}</p>
        {profile.isSample && (
          <span className="rounded-full border border-dashed border-orange/60 px-2.5 py-0.5 font-mono text-[0.6875rem] text-orange">
            {t("sampleBadge")}
          </span>
        )}
      </div>

      <H className="h3 mt-5">{profile.publicTitle[locale]}</H>

      <dl className="mt-6 mb-7 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <dt className="text-muted">{t("labels.seniority")}</dt>
          <dd className="mt-0.5 font-medium">{t(`seniority.${profile.seniority}`)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t("labels.availability")}</dt>
          <dd className="mt-0.5 flex items-center gap-2 font-medium">
            <span aria-hidden="true" className={`size-2 rounded-full ${availabilityTone[profile.availability]}`} />
            {t(`availability.${profile.availability}`)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t("labels.english")}</dt>
          <dd className="mt-0.5 font-medium tabular">{profile.englishLevel}</dd>
        </div>
        <div>
          <dt className="text-muted">{t("labels.location")}</dt>
          <dd className="mt-0.5 font-medium">
            {profile.location[locale]} · {profile.workModel.map((m) => t(`workModel.${m}`)).join(" / ")}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">{t("labels.coreStack")}</dt>
          <dd className="mt-2">
            <ul className="flex flex-wrap gap-1.5">
              {profile.coreStack.map((s) => (
                <li key={s} className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-xs">
                  {s}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-xs text-muted">
          {t("labels.lastVerified")}:{" "}
          <time dateTime={profile.availabilityVerifiedAt} className="tabular text-fg/80">
            {format.dateTime(verified, { day: "numeric", month: "short", year: "numeric" })}
          </time>
        </p>
        <TrackedLink
          href={crewHref(profile.id)}
          prefetch={false}
          event="talent_profile_request"
          eventProps={{ profile_id: profile.id }}
          variant="secondary"
          className="min-h-11 px-5 text-[0.75rem]"
          aria-label={t("requestProfileFor", { id: profile.id })}
        >
          {tc("requestProfile")}
        </TrackedLink>
      </div>
    </article>
  );
}
