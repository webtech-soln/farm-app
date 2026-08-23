"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

/**
 * Downloads the board's rows as CSV. The current filters ride along in the
 * query string, so the file matches what is on screen.
 */
export function ExportButton({
  board,
  label = "Export",
}: {
  /** Key in the export route's board registry. */
  board: string;
  label?: string;
}) {
  const params = useSearchParams();
  const search = params.toString();

  return (
    <a
      href={`/api/export/${board}${search ? `?${search}` : ""}`}
      download
      className="inline-flex h-[38px] shrink-0 items-center gap-[7px] rounded-nav border border-border-hair bg-card px-3.5 text-base font-semibold text-ink transition-colors hover:bg-border-soft"
    >
      <Download className="size-[15px]" />
      {label}
    </a>
  );
}
