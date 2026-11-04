"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { developerJoinHref, mainNav, routes } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";
import { LocaleSwitch } from "./LocaleSwitch";

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  isActive: (href: string) => boolean;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({ open, onClose, returnFocusRef, isActive }: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Close on navigation.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) returnFocusRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("a11y.mainNav")}
      inert={!open}
      className={`fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-bg transition-[opacity,transform] duration-[var(--duration-standard)] ease-[var(--ease-jelly)] xl:hidden motion-reduce:transition-none ${
        open ? "visible opacity-100" : "invisible pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      {/* Soft jelly glow — decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-[image:var(--gradient-blue-jelly)] opacity-20 blur-3xl" />

      <div className="container-jl flex h-18 shrink-0 items-center justify-between">
        <Wordmark className="h-6 w-auto" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("a11y.closeMenu")}
          className="-mr-2 flex size-12 items-center justify-center rounded-full text-fg hover:bg-white/5"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav aria-label={t("a11y.mainNav")} className="container-jl relative flex-1 overflow-y-auto py-6">
        <ul className="flex flex-col">
          {[...mainNav, { key: "contact" as const, href: routes.contact }].map(({ key, href }) => {
            const active = isActive(href);
            return (
              <li key={key} className="border-b border-line">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 items-center justify-between font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl ${
                    active ? "text-fg" : "text-fg/80 hover:text-fg"
                  }`}
                >
                  {t(`nav.${key}`)}
                  {active && <span aria-hidden="true" className="size-2 rounded-full bg-cyan shadow-[0_0_12px_var(--color-cyan)]" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-8">
          <LocaleSwitch size="lg" />
        </div>
      </nav>

      <div className="container-jl relative grid shrink-0 gap-3 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:grid-cols-2">
        <ButtonLink href={routes.jellyList} className="w-full">
          {t("cta.getDrop")}
        </ButtonLink>
        <ButtonLink href={developerJoinHref} variant="secondary" className="w-full">
          {t("cta.joinCrew")}
        </ButtonLink>
      </div>
    </div>
  );
}
