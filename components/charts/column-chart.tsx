export type ColumnDatum = {
  label: string;
  value: number;
  /** Caption drawn above the bar; falls back to the raw value. */
  display?: string;
  color?: string;
  /** Tint applied to the caption when the reading is out of band. */
  labelClassName?: string;
};

/**
 * Single-series columns with a caption above each bar — the shape used by
 * "Temperature by House" and the other per-entity readouts.
 */
export function ColumnChart({
  data,
  ticks,
  max,
  height = 180,
  defaultColor = "#7C3AED",
}: {
  data: ColumnDatum[];
  ticks: string[];
  max: number;
  height?: number;
  defaultColor?: string;
}) {
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
          {data.map((datum) => (
            <div
              key={datum.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={
                  datum.labelClassName ?? "text-xs font-semibold text-ink-2"
                }
              >
                {datum.display ?? datum.value}
              </span>
              <div
                style={{
                  height: `${Math.max(0, Math.min(100, (datum.value / max) * 100))}%`,
                  backgroundColor: datum.color ?? defaultColor,
                }}
                className="w-full max-w-[34px] rounded-t-[6px]"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {data.map((datum) => (
            <span
              key={datum.label}
              className="flex-1 text-center text-xs text-ink-3"
            >
              {datum.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
