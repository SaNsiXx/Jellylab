import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { routes } from "@/lib/site";
import { JellyAccent } from "@/components/ui/BrandArt";
import { NeonHeadline } from "@/components/ui/NeonHeadline";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <section className="relative isolate container-jl flex min-h-[85svh] flex-col justify-center overflow-hidden pt-32 pb-20">
      <div aria-hidden="true" className="absolute top-1/3 right-0 -z-10 h-72 w-[28rem] rotate-12 rounded-[48%_52%_44%_56%/55%_48%_52%_45%] bg-[image:var(--gradient-heat-jelly)] opacity-20 blur-3xl" />
      {/* The escaped Jelly. */}
      <JellyAccent priority energy="heat" shape="drop" className="absolute top-32 right-[4%] -z-10 w-40 rotate-[18deg] opacity-80 sm:w-56 lg:right-[12%] lg:w-72" />
      <p className="eyebrow">404 · WHO THE F*CK IS JELLY?</p>
      <h1 className="h1 mt-6 max-w-4xl"><NeonHeadline text={t("notFound.title")} /></h1>
      <p className="lead mt-6">{t("notFound.body")}</p>
      <div className="mt-10">
        <ButtonLink href={routes.home} arrow>{t("cta.backHome")}</ButtonLink>
      </div>
    </section>
  );
}
