import { cn } from "@/lib/cn";
import { type Tone, toneBg, toneText } from "./tone";

export type CalendarEvent = {
  label: string;
  tone: Tone;
};

export type CalendarDay = {
  /** Day number as printed in the cell. */
  day: number;
  /** Leading/trailing days from the neighbouring months. */
  muted?: boolean;
  /** Renders the filled violet marker. */
  today?: boolean;
  events?: CalendarEvent[];
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The month grid on board `21 · Vaccinations`. Expects whole weeks. */
export function CalendarMonth({ days }: { days: CalendarDay[] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7">
          {weekdays.map((weekday) => (
            <span
              key={weekday}
              className="px-2 pb-2 text-xs font-semibold text-ink-3"
            >
              {weekday}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 border-t border-l border-border-soft">
          {days.map((entry, index) => (
            <div
              key={`${entry.day}-${index}`}
              className="flex min-h-[78px] flex-col gap-1.5 border-r border-b border-border-soft p-2"
            >
              <span
                className={cn(
                  "flex size-[22px] items-center justify-center rounded-full text-xs-plus font-medium",
                  entry.today && "bg-violet font-semibold text-white",
                  !entry.today && entry.muted && "text-ink-3",
                  !entry.today && !entry.muted && "text-ink-2",
                )}
              >
                {entry.day}
              </span>

              {entry.events?.map((event) => (
                <span
                  key={event.label}
                  className={cn(
                    "truncate rounded-[5px] px-1.5 py-1 text-3xs font-semibold",
                    toneBg[event.tone],
                    event.tone === "violet"
                      ? "text-violet-deep"
                      : toneText[event.tone],
                  )}
                >
                  {event.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
