import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { type Tone, toneBg, toneText } from "./tone";

/** The 30px tinted square that fronts KPI cards and list rows. */
export function IconChip({
  icon: Icon,
  tone = "violet",
  size = 30,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-nav",
        toneBg[tone],
        className,
      )}
    >
      <Icon className={cn("size-4", toneText[tone])} />
    </span>
  );
}
