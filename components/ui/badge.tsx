import { cn } from "@/lib/cn";
import { type Tone, toneBg, toneSolid, toneText } from "./tone";

/** Board `Component / Badge`: pill, tinted, optional leading dot. */
export function Badge({
  children,
  tone = "success",
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] rounded-full px-2.5 py-[3px] text-xs-plus font-medium",
        toneBg[tone],
        toneText[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", toneSolid[tone])} />
      ) : null}
      {children}
    </span>
  );
}
