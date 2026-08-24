import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The shape every failure screen takes, so a broken board, a missing record
 * and a crashed root all read as the same product rather than three different
 * accidents. Deliberately plain: the person reading this is already having a
 * bad time, and wants to know what happened and what to press.
 */
export function FailureState({
  icon: Icon,
  title,
  description,
  reference,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Shown only when there is something support could actually look up. */
  reference?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-error-bg">
        <Icon className="size-6 text-error" />
      </span>

      <div className="flex max-w-[46ch] flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-[-0.3px] text-ink">
          {title}
        </h1>
        <p className="text-base leading-[1.55] text-ink-2">{description}</p>
      </div>

      {children ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
          {children}
        </div>
      ) : null}

      {reference ? (
        <p className="mt-2 font-mono text-xs text-ink-3">
          Reference: {reference}
        </p>
      ) : null}
    </div>
  );
}
