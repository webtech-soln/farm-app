"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

/**
 * The underlined tab strip on the detail boards. Every board renders its
 * sections on one page, so a tab jumps to its section rather than swapping the
 * content out from under the person reading it.
 */
export function Tabs({
  tabs,
  className,
}: {
  tabs: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-border-hair scrollbar-thin",
        className,
      )}
    >
      {tabs.map((tab, index) => (
        <Link
          key={tab}
          href={`#${slug(tab)}`}
          className={cn(
            "shrink-0 border-b-2 px-3 pb-2.5 text-base font-medium transition-colors",
            index === 0
              ? "border-violet text-violet-deep"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {tab}
        </Link>
      ))}
    </div>
  );
}

export function slug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Pill-style segmented control. With a `name` it filters through the URL like
 * the filter bar; without one it is a plain label strip.
 */
export function SegmentedControl({
  options,
  className,
  counts,
  name,
  defaultOption,
}: {
  options: string[];
  className?: string;
  counts?: Record<string, number>;
  /** Query-string key to write the choice to. */
  name?: string;
  /** The option meaning "no filter" (usually "All"). */
  defaultOption?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const fallback = defaultOption ?? options[0];
  const active = name ? (params.get(name) ?? fallback) : fallback;

  const select = (option: string) => {
    if (!name) return;
    const next = new URLSearchParams(params.toString());
    if (option === fallback) next.delete(name);
    else next.set(name, option);
    next.delete("page");
    const search = next.toString();
    startTransition(() =>
      router.push(search ? `${pathname}?${search}` : pathname, { scroll: false }),
    );
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5", pending && "opacity-70", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => select(option)}
          aria-pressed={option === active}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm-plus font-medium transition-colors",
            option === active
              ? "border-violet bg-violet text-white"
              : "border-border-hair bg-card text-ink-2 hover:bg-border-soft",
            !name && "cursor-default",
          )}
        >
          {option}
          {counts?.[option] !== undefined ? (
            <span
              className={cn(
                "rounded-full px-1.5 text-xs font-semibold",
                option === active
                  ? "bg-white/20 text-white"
                  : "bg-border-soft text-ink-2",
              )}
            >
              {counts[option]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
