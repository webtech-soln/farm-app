"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

/** The switch used on the Notifications and Settings boards. */
export function Toggle({
  defaultOn = false,
  label,
}: {
  defaultOn?: boolean;
  /** Accessible name; the visible label lives beside the switch. */
  label: string;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={cn(
        "flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors",
        on ? "bg-violet" : "bg-border-hair",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-white transition-transform",
          on && "translate-x-4",
        )}
      />
    </button>
  );
}
