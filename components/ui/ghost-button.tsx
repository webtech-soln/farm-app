import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The small bordered ghost button used in card headers and table footers. */
export function GhostButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className="flex shrink-0 items-center gap-1.5 rounded-[7px] border border-border-hair bg-card px-[11px] py-[7px] text-sm-plus font-medium text-ink hover:bg-border-soft"
    >
      {Icon ? <Icon className="size-3.5 text-ink-2" /> : null}
      {children}
    </button>
  );
}
