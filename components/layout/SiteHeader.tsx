"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { mainNav, routes } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileMenu } from "./MobileMenu";

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 12));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-standard)] ease-[var(--ease-jelly)] border-b ${
        scrolled ? "border-line bg-bg/72 backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent"
      }`}
    >
      <span
        aria-hidden="true"
        className={`header-neon-line absolute inset-x-0 -bottom-px h-px transition-opacity duration-[var(--duration-standard)] ${scrolled ? "opacity-70" : "opacity-0"}`}
      />
      <div className="container-jl flex h-18 items-center gap-6 lg:h-20">
        <Link href={routes.home} aria-label={t("a11y.home")} className="-m-2 shrink-0 p-2">
          <Wordmark className="h-6 w-auto sm:h-7" />
        </Link>

        <nav aria-label={t("a11y.mainNav")} className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {mainNav.map(({ key, href }) => {
              const active = isActive(href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-11 items-center rounded-full px-3.5 text-[0.9375rem] transition-colors duration-[var(--duration-micro)] ${
                      active ? "text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {t(`nav.${key}`)}
                    {active && (
                      <span aria-hidden="true" className="header-neon-line absolute inset-x-3.5 -bottom-0.5 h-px" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 xl:ml-2">
          <div className="hidden xl:block">
            <LocaleSwitch />
          </div>
          <div className={isActive(routes.jellyList) ? "hidden" : "hidden md:block"}>
            <ButtonLink href={routes.jellyList} className="min-h-11 px-5">
              {t("cta.getDrop")}
            </ButtonLink>
          </div>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t("a11y.openMenu")}
            onClick={() => setOpen(true)}
            className="-mr-2 flex size-12 items-center justify-center rounded-full text-fg hover:bg-white/5 xl:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 8h16M4 16h11" />
            </svg>
          </button>
        </div>
      </div>
    </header>
    {/* Sibling, not child: the header's backdrop-filter would trap position:fixed. */}
    <MobileMenu open={open} onClose={() => setOpen(false)} returnFocusRef={toggleRef} isActive={isActive} />
    </>
  );
}
