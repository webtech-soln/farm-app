import type { LucideIcon } from "lucide-react";

import { Card } from "./card";
import { IconChip } from "./icon-chip";
import { type Tone, toneText } from "./tone";

export type Metric = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tints the value, as the boards do for health and mortality readings. */
  valueTone?: Tone;
};

/**
 * The single-card summary strip used on the Farm Overview, House and Flock
 * detail boards.
 */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <Card className="flex flex-wrap gap-x-8 gap-y-5 p-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex items-center gap-2.5">
          <IconChip icon={metric.icon} size={34} />
          <div className="flex flex-col">
            <span className="text-xs-plus text-ink-2">{metric.label}</span>
            <span
              className={`text-[18px] font-semibold ${
                metric.valueTone ? toneText[metric.valueTone] : "text-ink"
              }`}
            >
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
