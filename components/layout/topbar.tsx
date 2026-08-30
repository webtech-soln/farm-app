import Link from "next/link";

import { SidebarTrigger } from "./sidebar";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleQuestionMark,
  MapPinned,
} from "lucide-react";

/** Board `Component / Topbar`: 64px tall, white, hairline bottom border. */
export function Topbar({
  initials,
  estate,
  unread,
}: {
  initials: string;
  estate: string;
  unread: number;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3.5 border-b border-border-hair bg-card px-4 md:px-6">
      <SidebarTrigger />
      <div className="flex-1 max-lg:hidden" />

      <button
        type="button"
        className="flex h-9 items-center gap-2 rounded-nav border border-border-hair px-[11px] max-md:hidden"
      >
        <MapPinned className="size-4 text-ink-2" />
        <span className="text-sm-plus font-medium text-ink">{estate}</span>
        <ChevronDown className="size-4 text-ink-3" />
      </button>

      <button
        type="button"
        aria-label="Help"
        className="flex size-9 items-center justify-center rounded-nav hover:bg-border-soft max-lg:hidden"
      >
        <CircleQuestionMark className="size-[18px] text-ink-2" />
      </button>
      <button
        type="button"
        aria-label="Calendar"
        className="flex size-9 items-center justify-center rounded-nav hover:bg-border-soft max-lg:hidden"
      >
        <CalendarDays className="size-[18px] text-ink-2" />
      </button>
      <Link
        href="/notifications"
        aria-label={
          unread ? `Notifications, ${unread} unread` : "Notifications"
        }
        className="relative flex size-9 items-center justify-center rounded-nav hover:bg-border-soft"
      >
        <Bell className="size-[18px] text-ink-2" />
        {unread > 0 ? (
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#DC2626]" />
        ) : null}
      </Link>

      <span className="h-6 w-px bg-border-hair max-md:hidden" />

      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet">
        <span className="text-sm font-semibold text-white">{initials}</span>
      </div>
    </header>
  );
}
