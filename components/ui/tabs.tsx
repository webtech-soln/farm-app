"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The underlined tab strip used on the detail boards (House, Flock) and the
 * category tabs on Notifications.
 */
export function Tabs({
  tabs,
  className,
}: {
  tabs: string[];
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]);

  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-border-hair scrollbar-thin",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActive(tab)}
          className={cn(
            "shrink-0 border-b-2 px-3 pb-2.5 text-base font-medium transition-colors",
            tab === active
              ? "border-violet text-violet-deep"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** Pill-style segmented control (chart range switchers, status filters). */
export function SegmentedControl({
  options,
  className,
  counts,
}: {
  options: string[];
  className?: string;
  counts?: Record<string, number>;
}) {
  const [active, setActive] = useState(options[0]);

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setActive(option)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm-plus font-medium transition-colors",
            option === active
              ? "border-violet bg-violet text-white"
              : "border-border-hair bg-card text-ink-2 hover:bg-border-soft",
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
