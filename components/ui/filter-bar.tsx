"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, RotateCcw, Search } from "lucide-react";

import { cn } from "@/lib/cn";

export type FilterSelect = {
  /** Query-string key the choice is written to. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

/**
 * The `Filter Bar` card above every register table. Every control writes to the
 * URL, so the filtered query runs on the server and the result is shareable and
 * survives a refresh.
 */
export function FilterBar({
  placeholder = "Search…",
  filters = [],
  className,
  /** Query-string key for the search box. */
  searchKey = "q",
  /** Boards that filter without a search field (the task board). */
  showSearch = true,
}: {
  placeholder?: string;
  filters?: FilterSelect[];
  className?: string;
  searchKey?: string;
  showSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = params.get(searchKey) ?? "";
  const [query, setQuery] = useState(current);
  const [synced, setSynced] = useState(current);

  // Adjust during render (rather than in an effect) when the URL changes from
  // elsewhere — Reset, the back button, a link with a query already on it.
  if (current !== synced) {
    setSynced(current);
    setQuery(current);
  }

  const push = (next: URLSearchParams) => {
    // Any filter change invalidates the page the user was on.
    next.delete("page");
    const search = next.toString();
    startTransition(() =>
      router.push(search ? `${pathname}?${search}` : pathname, { scroll: false }),
    );
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  // Debounced so a query only runs once the person stops typing.
  useEffect(() => {
    if (query === current) return;
    const timer = setTimeout(() => setParam(searchKey, query.trim()), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active =
    Boolean(current) || filters.some((filter) => params.get(filter.name));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-card border border-border-hair bg-card p-3 shadow-[0_1px_3px_rgba(24,24,27,0.05)]",
        pending && "opacity-70",
        className,
      )}
    >
      {showSearch ? (
      <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-nav border border-border-hair bg-bg px-3 lg:max-w-[300px] lg:flex-none">
        <Search className="size-4 shrink-0 text-ink-3" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm-plus text-ink outline-none placeholder:text-ink-3"
        />
      </label>
      ) : null}

      {filters.map((filter) => {
        const value = params.get(filter.name) ?? "";
        return (
          <span
            key={filter.name}
            className={cn(
              "relative flex h-9 items-center gap-1.5 rounded-nav border bg-card pl-3 pr-2 text-sm-plus font-medium hover:bg-border-soft",
              value
                ? "border-violet text-violet-deep"
                : "border-border-hair text-ink-2",
            )}
          >
            <select
              value={value}
              aria-label={filter.label}
              onChange={(event) => setParam(filter.name, event.target.value)}
              className="cursor-pointer appearance-none bg-transparent pr-4 outline-none"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-ink-3" />
          </span>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => {
          setQuery("");
          push(new URLSearchParams());
        }}
        disabled={!active}
        className="flex h-9 items-center gap-1.5 px-2 text-sm-plus font-medium text-ink-2 hover:text-ink disabled:opacity-40"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </button>
    </div>
  );
}
