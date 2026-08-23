"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export type RangeOption = { value: string; label: string };

/**
 * The chart range switchers ("Last 14 days", "Last 8 months"). The choice goes
 * into the URL so the server re-runs the query for the new window.
 */
export function RangeSelect({
  name,
  options,
  defaultValue,
  className,
}: {
  name: string;
  options: RangeOption[];
  /** The option that means "no parameter in the URL". */
  defaultValue: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const value = params.get(name) ?? defaultValue;

  return (
    <span
      className={cn(
        "relative flex h-8 items-center gap-1.5 rounded-nav px-2.5 text-sm-plus font-medium text-ink-2 hover:bg-border-soft",
        pending && "opacity-70",
        className,
      )}
    >
      <select
        value={value}
        aria-label="Range"
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === defaultValue) next.delete(name);
          else next.set(name, event.target.value);
          const search = next.toString();
          startTransition(() =>
            router.push(search ? `${pathname}?${search}` : pathname, {
              scroll: false,
            }),
          );
        }}
        className="cursor-pointer appearance-none bg-transparent pr-4 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 size-3.5 text-ink-3" />
    </span>
  );
}
