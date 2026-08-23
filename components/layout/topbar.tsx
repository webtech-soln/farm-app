import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleQuestionMark,
  MapPinned,
  Search,
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
      <label className="flex h-9 flex-1 items-center gap-2 rounded-nav border border-border-hair bg-bg px-[11px] lg:max-w-[340px]">
        <Search className="size-4 shrink-0 text-ink-3" />
        <input
          type="search"
          placeholder="Search flocks, houses, orders…"
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
        />
        <kbd className="hidden rounded-[5px] border border-border-hair bg-card px-1.5 py-0.5 text-2xs font-medium text-ink-3 sm:block">
          ⌘K
        </kbd>
      </label>

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
