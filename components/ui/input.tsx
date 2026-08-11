import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

/** Board `Component / Input`: label, 40px field with optional icon/unit, hint. */
export function Input({
  label,
  icon: Icon,
  unit,
  hint,
  className,
  ...props
}: {
  label?: string;
  icon?: LucideIcon;
  unit?: string;
  hint?: string;
} & ComponentProps<"input">) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-sm font-medium text-ink-2">{label}</span>
      ) : null}
      <span className="flex h-10 items-center gap-2 rounded-nav border border-border-hair bg-card px-3">
        {Icon ? <Icon className="size-[15px] shrink-0 text-ink-3" /> : null}
        <input
          className="min-w-0 flex-1 bg-transparent text-base-plus font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3"
          {...props}
        />
        {unit ? <span className="text-sm text-ink-3">{unit}</span> : null}
      </span>
      {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}

/** Same shell as `Input` but wrapping a native select. */
export function Select({
  label,
  className,
  children,
  ...props
}: { label?: string } & ComponentProps<"select">) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-sm font-medium text-ink-2">{label}</span>
      ) : null}
      <select
        className="h-10 rounded-nav border border-border-hair bg-card px-3 text-base-plus font-medium text-ink outline-none"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
