import { getTranslations } from "next-intl/server";
import { Section, Eyebrow } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { NeonHeadline } from "@/components/ui/NeonHeadline";
import { BrandIcon, CampaignArt, type IconName } from "@/components/ui/BrandArt";
import { crewHref, developerJoinHref, routes } from "@/lib/site";
import { showDevPlaceholders } from "@/lib/legal/entity";

type Item = { title: string; body: string };

/* 3 — Market problem + three proof principles */
export async function ProblemSection() {
  const t = await getTranslations("problem");
  const points = t.raw("points") as Item[];
  return (
    <Section labelledBy="problem-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <h2 id="problem-title" className="h2"><NeonHeadline text={t("title")} /></h2>
        </Reveal>
        <Reveal className="lg:col-span-4 lg:self-end" delay={120}>
          <p className="lead">{t("body")}</p>
        </Reveal>
      </div>
      <ol className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3 lg:mt-24">
        {points.map((p, i) => (
          <li key={p.title} className="bg-bg p-7 sm:p-9">
            <Reveal delay={i * 80}>
              <p className="font-mono text-xs tracking-[0.2em] text-cyan">0{i + 1}</p>
              <h3 className="h3 mt-8">{p.title}</h3>
              <p className="mt-3 text-muted">{p.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* 4 — Solutions preview */
export async function SolutionsPreview() {
  const t = await getTranslations();
  const cards = t.raw("solutions.cards") as Item[];
  const tech = t.raw("solutions.techLine") as string[];
  const icons: IconName[] = ["staff-augmentation", "dedicated-teams", "specialists"];
  return (
    <Section labelledBy="solutions-title">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <Eyebrow accent="blue">{t("solutions.eyebrow")}</Eyebrow>
          <h2 id="solutions-title" className="h2 mt-5 max-w-3xl"><NeonHeadline text={t("solutions.title")} /></h2>
        </Reveal>
        <ButtonLink href={routes.solutions} variant="secondary" arrow className="self-start lg:self-auto">
          {t("cta.exploreSolutions")}
        </ButtonLink>
      </div>
      <ul className="mt-14 grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => {
          return (
            <li key={c.title}>
              <Reveal delay={i * 80} className="h-full">
                <article className="card flex h-full flex-col p-7 sm:p-8">
                  <span className="flex size-14 items-center justify-center rounded-2xl border border-line bg-white/[0.03]">
                    <BrandIcon name={icons[i] ?? "specialists"} size={40} />
                  </span>
                  <h3 className="h3 mt-10">{c.title}</h3>
                  <p className="mt-3 text-muted">{c.body}</p>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
      <ul className="mt-10 flex flex-wrap gap-2">
        {tech.map((s) => (
          <li key={s} className="rounded-full border border-line px-4 py-2 font-mono text-xs tracking-wider text-muted">
            {s}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* 6 — Four-step process */
export async function ProcessSteps() {
  const t = await getTranslations();
  const steps = t.raw("process.steps") as Item[];
  return (
    <Section labelledBy="process-title" className="border-t border-line">
      <Reveal>
        <Eyebrow accent="blue">{t("process.eyebrow")}</Eyebrow>
        <h2 id="process-title" className="h2 mt-5 max-w-3xl"><NeonHeadline text={t("process.title")} /></h2>
      </Reveal>
      <ol className="relative mt-16 grid gap-10 md:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
        {/* connecting technical line */}
        <span aria-hidden="true" className="absolute top-[0.55rem] right-0 left-0 hidden h-px bg-[linear-gradient(90deg,var(--color-cyan),var(--color-blue),var(--color-violet),transparent)] opacity-60 lg:block" />
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <Reveal delay={i * 90}>
              <span aria-hidden="true" className="relative block size-[1.1rem] rounded-full border border-cyan bg-bg">
                <span className="absolute inset-1 rounded-full bg-cyan" />
              </span>
              <p className="mt-8 font-mono text-sm tracking-[0.2em] text-muted">0{i + 1}</p>
              <h3 className="h3 mt-3">{s.title}</h3>
              <p className="mt-3 text-muted">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <div className="mt-14">
        <ButtonLink href={crewHref()} variant="secondary" arrow>
          {t("cta.tellUs")}
        </ButtonLink>
      </div>
    </Section>
  );
}

/* 7 — Jelly Drop / The Jelly Signal lead magnet */
export async function JellyDropBlock() {
  const t = await getTranslations();
  const list = t.raw("drop.list") as string[];
  return (
    <Section labelledBy="drop-title">
      <div className="card overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-[image:var(--gradient-heat-jelly)] opacity-[0.13] blur-3xl" />
        <div className="relative grid gap-12 p-7 sm:p-12 lg:grid-cols-12 lg:gap-16 lg:p-16">
          <div className="lg:col-span-7">
            <Eyebrow accent="heat">{t("drop.eyebrow")}</Eyebrow>
            <h2 id="drop-title" className="h2 mt-5"><NeonHeadline text={t("drop.title")} /></h2>
            <p className="lead mt-6">{t("drop.body")}</p>
            <p className="mt-8 font-display font-semibold">{t("drop.listTitle")}</p>
            <ul className="mt-4 grid gap-3">
              {list.map((li) => (
                <li key={li} className="flex gap-3 text-fg/90">
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-orange" />
                  {li}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <ButtonLink href={routes.jellyList} arrow>
                {t("cta.joinList")}
              </ButtonLink>
            </div>
            <p className="mt-5 max-w-lg text-sm text-muted">{t("drop.microcopy")}</p>
          </div>
          {/* Campaign card (SVG from scripts/build-brand-svgs.mjs); PNG export: public/campaign/01_Get_The_Jelly_Drop_1200.png */}
          <div className="relative lg:col-span-5">
            <CampaignArt name="jelly-drop" className="mx-auto max-w-md border border-line" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* 8 — Jelly Crew developer block */
export async function JellyCrewBlock() {
  const t = await getTranslations();
  return (
    <Section labelledBy="crew-title" className="border-t border-line">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-6">
          <Eyebrow accent="green">{t("crew.eyebrow")}</Eyebrow>
          <h2 id="crew-title" className="h2 mt-5"><NeonHeadline text={t("crew.title")} /></h2>
        </Reveal>
        <Reveal className="lg:col-span-5 lg:col-start-8 lg:pt-14" delay={120}>
          <p className="lead">{t("crew.body")}</p>
          <p className="mt-8 border-l-2 border-green pl-5 font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">{t("crew.kicker")}</p>
          <div className="mt-10">
            <ButtonLink href={developerJoinHref} variant="secondary" arrow>
              {t("cta.joinCrew")}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* 9 — Why Jelly values */
export async function ValuesGrid() {
  const t = await getTranslations("values");
  const items = t.raw("items") as Item[];
  return (
    <Section labelledBy="values-title" className="border-t border-line">
      <Reveal>
        <h2 id="values-title" className="h2 max-w-3xl"><NeonHeadline text={t("title")} /></h2>
      </Reveal>
      <ul className="mt-14 grid gap-5 sm:grid-cols-2">
        {items.map((v, i) => (
          <li key={v.title}>
            <Reveal delay={i * 70} className="h-full">
              <article className="card h-full p-7 sm:p-9">
                <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{v.title}</h3>
                <p className="mt-4 text-muted">{v.body}</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* 10 — About / manifest preview */
export async function ManifestPreview() {
  const t = await getTranslations();
  const paras = t.raw("about.paragraphs") as string[];
  return (
    <Section labelledBy="about-title" className="overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-40 size-[30rem] -translate-y-1/2 rounded-full bg-[image:var(--gradient-blue-jelly)] opacity-[0.12] blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 id="about-title" className="h2"><NeonHeadline text={t("about.title")} /></h2>
        </Reveal>
        <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
          {paras.map((p) => (
            <p key={p} className="mb-5 text-lg text-muted">{p}</p>
          ))}
          <p className="mt-8 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("about.signoff")}</p>
          <div className="mt-10">
            <ButtonLink href={routes.about} variant="secondary" arrow>
              {t("cta.meetJelly")}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* 11 — Proof. No invented proof: markets only + explicit placeholders (dev/preview only). */
export async function ProofSection() {
  const t = await getTranslations("proof");
  const markets = t.raw("markets") as string[];
  return (
    <Section labelledBy="proof-title" className="border-t border-line">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 id="proof-title" className="h2 mt-5"><NeonHeadline text={t("title")} /></h2>
        </div>
        <ul className="flex flex-wrap gap-2 lg:max-w-xl lg:justify-end">
          {markets.map((m) => (
            <li key={m} className="rounded-full border border-line px-5 py-2.5 font-display text-sm font-medium">
              {m}
            </li>
          ))}
        </ul>
      </div>
      {showDevPlaceholders && (
        <>
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-[var(--radius-card)] border border-dashed border-orange/50 p-7">
                <p className="font-mono text-xs text-orange">CASE STUDY 0{n}</p>
                <p className="h3 mt-6 text-fg/80">{t("placeholderTitle")}</p>
                <p className="mt-3 text-sm text-muted">{t("placeholderBody")}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-xs text-orange/80">{t("placeholderNote")}</p>
        </>
      )}
    </Section>
  );
}

/* 12 — FAQ (native disclosure: keyboard + SR support for free) */
export async function FAQSection() {
  const t = await getTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <Section labelledBy="faq-title" className="border-t border-line">
      <div className="grid gap-10 lg:grid-cols-12">
        <h2 id="faq-title" className="h2 lg:col-span-4"><NeonHeadline text={t("title")} /></h2>
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {items.map((i) => (
            <details key={i.q} className="group">
              <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 font-display text-lg font-medium tracking-tight sm:text-xl [&::-webkit-details-marker]:hidden">
                {i.q}
                <span aria-hidden="true" className="relative size-5 shrink-0 text-muted transition-transform duration-[var(--duration-standard)] group-open:rotate-45">
                  <span className="absolute top-1/2 left-0 h-px w-5 bg-current" />
                  <span className="absolute top-0 left-1/2 h-5 w-px bg-current" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-muted">{i.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Section>
  );
}

/* 13 — Final CTA */
export async function FinalCTA() {
  const t = await getTranslations();
  return (
    <section aria-labelledby="final-title" className="relative isolate overflow-hidden py-28 lg:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[26rem] w-[44rem] -translate-x-[70%] -translate-y-1/2 rounded-full bg-[image:var(--gradient-blue-jelly)] opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[22rem] w-[36rem] -translate-x-[10%] -translate-y-[40%] rounded-full bg-[image:var(--gradient-heat-jelly)] opacity-[0.16] blur-3xl" />
      </div>
      <div className="container-jl text-center">
        <Reveal>
          <h2 id="final-title" className="h2 mx-auto max-w-4xl"><NeonHeadline text={t("final.title")} /></h2>
          <p className="lead mx-auto mt-6">{t("final.body")}</p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={routes.jellyList} arrow>
              {t("cta.getDrop")}
            </ButtonLink>
            <ButtonLink href={routes.contact} variant="secondary">
              {t("cta.talkHuman")}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

