"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The `Filter Bar` card that sits above every register table: search field, a
 * row of dropdowns, and a trailing reset.
 */
export function FilterBar({
  placeholder = "Search…",
  selects = [],
  className,
}: {
  placeholder?: string;
  /** Dropdown labels; the label doubles as the neutral first option. */
  selects?: string[];
  className?: string;
}) {
  const [query, setQuery] = useState("");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-card border border-border-hair bg-card p-3 shadow-[0_1px_3px_rgba(24,24,27,0.05)]",
        className,
      )}
    >
      <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-nav border border-border-hair bg-bg px-3 lg:max-w-[300px] lg:flex-none">
        <Search className="size-4 shrink-0 text-ink-3" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm-plus text-ink outline-none placeholder:text-ink-3"
        />
      </label>

      {selects.map((label) => (
        <button
          key={label}
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-nav border border-border-hair bg-card px-3 text-sm-plus font-medium text-ink-2 hover:bg-border-soft"
        >
          {label}
          <ChevronDown className="size-3.5 text-ink-3" />
        </button>
      ))}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setQuery("")}
        className="flex h-9 items-center gap-1.5 px-2 text-sm-plus font-medium text-ink-2 hover:text-ink"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </button>
    </div>
  );
}
