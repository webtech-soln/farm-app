export type DonutSlice = {
  name: string;
  value: number;
  color: string;
  /** Overrides the computed percentage in the legend. */
  display?: string;
};

/**
 * Donut built from a conic gradient with a punched-out centre — matches the
 * `innerRadius` ellipses on the finance and expense boards.
 */
export function Donut({
  slices,
  size = 160,
  thickness = 26,
  caption,
  captionLabel,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  caption?: string;
  captionLabel?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

  // Built with a loop rather than a closure over a running total, which the
  // React compiler rejects as a reassignment during render.
  const stops: string[] = [];
  let cursor = 0;
  for (const slice of slices) {
    const start = (cursor / total) * 360;
    cursor += slice.value;
    stops.push(`${slice.color} ${start}deg ${(cursor / total) * 360}deg`);
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${stops.join(", ")})`,
      }}
      className="relative shrink-0 rounded-full"
    >
      <div
        style={{ inset: thickness }}
        className="absolute flex flex-col items-center justify-center rounded-full bg-card"
      >
        {caption ? (
          <span className="text-lg font-semibold tracking-[-0.4px] text-ink">
            {caption}
          </span>
        ) : null}
        {captionLabel ? (
          <span className="text-2xs text-ink-3">{captionLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Legend rows with value readouts, as drawn beside the donuts. */
export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
      {slices.map((slice) => (
        <li key={slice.name} className="flex items-center gap-2">
          <span
            style={{ backgroundColor: slice.color }}
            className="size-[9px] shrink-0 rounded-[3px]"
          />
          <span className="min-w-0 flex-1 truncate text-sm-plus text-ink-2">
            {slice.name}
          </span>
          <span className="text-sm-plus font-semibold text-ink">
            {slice.display ?? `${Math.round((slice.value / total) * 100)}%`}
          </span>
        </li>
      ))}
    </ul>
  );
}
