"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

/**
 * The Previous/Next pair in every table footer. The page lives in the URL so
 * the server renders the right slice and the browser's back button works.
 */
export function Pager({
  page,
  hasNext,
  hasPrevious,
}: {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const go = (next: number) => {
    const search = new URLSearchParams(params.toString());
    if (next <= 1) search.delete("page");
    else search.set("page", String(next));
    const query = search.toString();
    startTransition(() =>
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  };

  const style =
    "flex h-8 items-center gap-1.5 rounded-nav px-2.5 text-sm-plus font-medium transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={!hasPrevious || pending}
        className={cn(style, "text-ink-2 hover:bg-border-soft disabled:opacity-40 disabled:hover:bg-transparent")}
      >
        Previous
      </button>
      <span className="text-sm text-ink-3">Page {page}</span>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={!hasNext || pending}
        className={cn(style, "text-ink-2 hover:bg-border-soft disabled:opacity-40 disabled:hover:bg-transparent")}
      >
        Next
      </button>
    </>
  );
}
