import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "group/btn relative inline-flex min-h-12 items-center justify-center gap-3 rounded-[var(--radius-button)] px-7 py-3 " +
  "font-display text-[0.8125rem] font-semibold tracking-[0.16em] whitespace-nowrap " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--duration-micro)] ease-[var(--ease-jelly)] " +
  "active:scale-[0.98] focus-visible:outline-offset-4";

const variants: Record<ButtonVariant, string> = {
  // Primary CTA: acid jelly gradient, dark text (≈14:1 contrast). Colour lives here, not on every component.
  primary:
    "text-bg bg-[image:var(--gradient-green-jelly)] shadow-[0_0_0_1px_rgba(215,255,84,0.35),0_10px_40px_-12px_rgba(141,255,69,0.55)] " +
    "hover:shadow-[0_0_0_1px_rgba(215,255,84,0.6),0_14px_50px_-10px_rgba(141,255,69,0.75)] hover:-translate-y-px",
  secondary:
    "text-fg border border-white/20 bg-white/[0.03] backdrop-blur-sm hover:border-white/45 hover:bg-white/[0.07]",
  ghost: "text-fg px-0 min-h-11 tracking-[0.12em] hover:text-cyan",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-4 shrink-0 transition-transform duration-[var(--duration-micro)] group-hover/btn:translate-x-0.5 ${className}`}
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
