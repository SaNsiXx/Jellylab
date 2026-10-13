import { getTranslations } from "next-intl/server";
import { routes } from "@/lib/site";
import { ButtonLink } from "./Button";

/** Reusable Jelly List / Jelly Signal call-to-action band. */
export async function NewsletterCTA({ title, body, cta }: { title: string; body: string; cta?: string }) {
  const t = await getTranslations("cta");
  return (
    <section aria-label={title} className="container-jl py-16 lg:py-24">
      <div className="card relative overflow-hidden p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-[image:var(--gradient-heat-jelly)] opacity-15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</p>
          <p className="mt-3 text-muted">{body}</p>
        </div>
        <div className="relative mt-8 shrink-0 lg:mt-0">
          <ButtonLink href={routes.jellyList} arrow>
            {cta ?? t("joinList")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
