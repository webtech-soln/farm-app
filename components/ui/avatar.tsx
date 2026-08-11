import { cn } from "@/lib/cn";

/** The initials bubble used for customers, drivers and employees. */
export function Avatar({
  initials,
  size = 30,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        fontSize: size <= 24 ? 9 : size <= 30 ? 11 : size <= 40 ? 12 : 15,
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-violet-light font-semibold text-violet-deep",
        className,
      )}
    >
      {initials}
    </span>
  );
}
