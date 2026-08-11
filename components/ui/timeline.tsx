import type { LucideIcon } from "lucide-react";

import { IconChip } from "./icon-chip";
import type { Tone } from "./tone";

export type TimelineEvent = {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  time: string;
  description: string;
};

/** The `Recent Activity` / history list on the detail boards. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {events.map((event) => (
        <li key={event.title + event.time} className="flex gap-3">
          <IconChip icon={event.icon} tone={event.tone} size={32} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm-plus font-semibold text-ink">
                {event.title}
              </span>
              <span className="text-xs text-ink-3">{event.time}</span>
            </div>
            <p className="text-sm leading-[1.45] text-ink-2">
              {event.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
