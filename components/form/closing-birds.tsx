"use client";

import { useEffect, useState } from "react";

/**
 * The derived closing balance on the Daily Records board. The column is
 * computed server-side on save; this mirrors the arithmetic live so the person
 * filling the form sees the number they are committing to.
 */
export function ClosingBirds({ initial }: { initial: number }) {
  const [closing, setClosing] = useState(initial);

  useEffect(() => {
    const form = document
      .querySelector("[data-daily-record-fields]")
      ?.closest("form");
    if (!(form instanceof HTMLFormElement)) return;

    const read = (name: string) => {
      const field = form.elements.namedItem(name);
      const value =
        field instanceof HTMLInputElement ? Number(field.value) : Number.NaN;
      return Number.isFinite(value) ? value : 0;
    };

    const recompute = () =>
      setClosing(
        read("startingBirds") -
          read("deaths") -
          read("culls") -
          read("transfersOut"),
      );

    recompute();
    form.addEventListener("input", recompute);
    return () => form.removeEventListener("input", recompute);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-nav bg-violet-50 px-3 py-2.5">
      <span className="flex-1 text-sm-plus font-medium text-violet-deep">
        Closing birds
      </span>
      <span
        className={`text-lg font-semibold ${closing < 0 ? "text-error" : "text-violet-deep"}`}
      >
        {closing.toLocaleString("en-US")}
      </span>
    </div>
  );
}
