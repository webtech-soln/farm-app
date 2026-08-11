import type { LucideIcon } from "lucide-react";

import { Card } from "./card";
import { IconChip } from "./icon-chip";
import { type Tone, toneText } from "./tone";

/** Board `Component / KPI Card`. */
export function KpiCard({
  label,
  icon,
  iconTone = "violet",
  value,
  delta,
  deltaIcon: DeltaIcon,
  deltaTone = "success",
  note,
}: {
  label: string;
  icon: LucideIcon;
  iconTone?: Tone;
  value: string;
  delta?: string;
  deltaIcon?: LucideIcon;
  deltaTone?: Tone;
  note?: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm-plus font-medium text-ink-2">
          {label}
        </span>
        <IconChip icon={icon} tone={iconTone} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-2xl font-semibold tracking-[-0.6px] text-ink">
          {value}
        </span>
        {delta || note ? (
          <div className="flex items-center gap-[5px]">
            {DeltaIcon ? (
              <DeltaIcon className={`size-[13px] ${toneText[deltaTone]}`} />
            ) : null}
            {delta ? (
              <span className={`text-sm font-semibold ${toneText[deltaTone]}`}>
                {delta}
              </span>
            ) : null}
            {note ? <span className="text-sm text-ink-3">{note}</span> : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/** Responsive wrapper: 4-up desktop, 2-up tablet, 1-up phone. */
export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
