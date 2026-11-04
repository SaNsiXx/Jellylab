import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "group/btn relative inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-[var(--radius-button)] px-7 py-3 " +
  // labels are written in capitals in the copy, so a little tracking keeps them open (Jelly Match uses sentence case)
  "font-display text-[0.9375rem] font-semibold tracking-[0.06em] whitespace-nowrap " +
  "transition-[transform,translate,box-shadow,background-color,border-color,color] duration-[var(--duration-micro)] ease-[var(--ease-jelly)] " +
  "active:scale-[0.98] focus-visible:outline-offset-4";

const variants: Record<ButtonVariant, string> = {
  // Primary CTA: solid lime pill, dark label (17:1), light fill wipes up on hover — the Jelly Match CTA. See .btn-primary.
  primary: "btn-primary",
  // Secondary: glass pill with a hairline; violet wipes up on hover/focus. See .btn-secondary.
  secondary: "btn-secondary",
  ghost: "text-fg px-0 min-h-11 tracking-[0.12em] hover:text-lime",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`btn-arrow size-4 shrink-0 transition-transform duration-[var(--duration-micro)] group-hover/btn:translate-x-0.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; arrow?: boolean };

export function ButtonLink({ variant = "primary", arrow = false, className = "", children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      <span>{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
