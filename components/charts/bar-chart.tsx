import { cn } from "@/lib/cn";

export type Series = {
  name: string;
  /** Any CSS colour; the boards use violet #7C3AED and #C4B5FD. */
  color: string;
  values: number[];
  /** Per-bar overrides, e.g. amber for out-of-band temperature readings. */
  colors?: string[];
};

/**
 * The bar chart shape used across the boards: a right-aligned tick column
 * beside a plot of grouped bars with labels underneath. Heights are computed
 * from `max`, so no chart library is involved.
 */
export function BarChart({
  labels,
  series,
  ticks,
  max,
  min = 0,
  height = 180,
  barWidth = 16,
}: {
  labels: string[];
  series: Series[];
  /** Tick captions, top to bottom. */
  ticks: string[];
  /** Value that maps to the full plot height. */
  max: number;
  /** Baseline value; non-zero for the zoomed trends (e.g. bird count). */
  min?: number;
  height?: number;
  barWidth?: number;
}) {
  const span = max - min || 1;

  return (
    <div className="flex gap-3">
      <div
        style={{ height }}
        className="flex flex-col items-end justify-between"
      >
        {ticks.map((tick, index) => (
          <span key={index} className="text-2xs text-ink-3">
            {tick}
          </span>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div style={{ height }} className="flex items-end gap-2">
          {labels.map((label, index) => (
            <div
              key={label}
              className="flex h-full min-w-0 flex-1 items-end justify-center gap-[3px]"
            >
              {series.map((entry) => (
                <div
                  key={entry.name}
                  title={`${entry.name}: ${entry.values[index]}`}
                  style={{
                    maxWidth: barWidth,
                    height: `${Math.max(
                      0,
                      Math.min(100, ((entry.values[index] - min) / span) * 100),
                    )}%`,
                    backgroundColor: entry.colors?.[index] ?? entry.color,
                  }}
                  className="min-w-0 flex-1 rounded-t-[4px]"
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {labels.map((label) => (
            <span
              key={label}
              className="min-w-0 flex-1 text-center text-2xs text-ink-3"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Swatch row that sits above every chart on the boards. */
export function ChartLegend({
  series,
  className,
}: {
  series: Pick<Series, "name" | "color">[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {series.map((entry) => (
        <span key={entry.name} className="flex items-center gap-1.5">
          <span
            style={{ backgroundColor: entry.color }}
            className="size-[9px] rounded-[3px]"
          />
          <span className="text-xs-plus font-medium text-ink-2">
            {entry.name}
          </span>
        </span>
      ))}
    </div>
  );
}

export const chartColors = {
  primary: "#7C3AED",
  soft: "#C4B5FD",
  success: "#15803D",
  error: "#B91C1C",
  info: "#1D4ED8",
  warning: "#B45309",
  neutral: "#A1A1AA",
};
