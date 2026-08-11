import { cn } from "@/lib/cn";

/** The occupancy / utilisation bar used on the House and Inventory boards. */
export function ProgressRail({
  value,
  color = "#7C3AED",
  className,
  height = 8,
}: {
  /** 0–100. */
  value: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      style={{ height }}
      className={cn(
        "w-full overflow-hidden rounded-full bg-border-soft",
        className,
      )}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: color,
        }}
        className="h-full rounded-full"
      />
    </div>
  );
}
