"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

/** Previous / next / today for the vaccination calendar, driven by `?month=`. */
export function MonthNav({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const go = (value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("month", value);
    else next.delete("month");
    const search = next.toString();
    startTransition(() =>
      router.push(search ? `${pathname}?${search}` : pathname, { scroll: false }),
    );
  };

  const shift = (delta: number) => {
    const [year, index] = month.split("-").map(Number);
    const date = new Date(year, index - 1 + delta, 1);
    go(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const style =
    "flex h-8 items-center gap-1.5 rounded-nav px-2.5 text-sm-plus font-medium text-ink-2 hover:bg-border-soft disabled:opacity-50";

  return (
    <div className={cn("flex items-center gap-1", pending && "opacity-70")}>
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className={style}
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <button type="button" onClick={() => go(null)} className={style}>
        <Calendar className="size-3.5" />
        Today
      </button>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className={style}
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
