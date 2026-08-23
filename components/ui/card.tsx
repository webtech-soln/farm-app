import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** The white panel every board is built from: radius 12, hairline, 1px lift. */
export function Card({
  className,
  children,
  id,
}: {
  className?: string;
  children: ReactNode;
  /** Anchor target, used by the settings board's section links. */
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-card border border-border-hair bg-card shadow-[0_1px_3px_rgba(24,24,27,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The `Card Head` frame: 14.5px title over a 12px subtitle, actions trailing.
 * Used unpadded inside padded cards and with `inset` above tables.
 */
export function PanelHead({
  title,
  subtitle,
  children,
  inset,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Adds the 18/14 padding tables need since the card itself has none. */
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-2.5",
        inset && "px-[18px] py-3.5",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <h2 className="text-md font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="text-sm text-ink-2">{subtitle}</p> : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      ) : null}
    </div>
  );
}
