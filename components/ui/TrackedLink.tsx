"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { track, type AnalyticsEvent } from "@/lib/analytics/track";
import { buttonClass, Arrow, type ButtonVariant } from "./Button";

type Props = ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string>;
  variant?: ButtonVariant;
  arrow?: boolean;
  /** Render as plain link (no button styling). */
  plain?: boolean;
};

/** Link that fires a consent-aware analytics event on click. */
export function TrackedLink({ event, eventProps, variant = "primary", arrow, plain, className = "", children, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      className={plain ? className : buttonClass(variant, className)}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    >
      {plain ? children : <span>{children}</span>}
      {arrow && <Arrow />}
    </Link>
  );
}
