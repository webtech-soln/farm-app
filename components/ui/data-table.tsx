import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type Column<T> = {
  header: string;
  /** Cell renderer. Return any node; wrap multi-line cells in a flex column. */
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Fixed pixel width; omit to let the column flex. */
  width?: number;
  /** Hide below the given breakpoint to keep narrow viewports readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

const hideClasses = {
  sm: "max-sm:hidden",
  md: "max-md:hidden",
  lg: "max-lg:hidden",
  xl: "max-xl:hidden",
} as const;

/**
 * The table pattern shared by every register board: tinted header strip with
 * hairline rules, rows separated by the soft border.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
}) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div className="min-w-[720px]">
        <div className="flex border-y border-border-hair bg-bg px-[18px]">
          {columns.map((column) => (
            <div
              key={column.header}
              style={column.width ? { width: column.width } : undefined}
              className={cn(
                "px-1.5 py-[9px]",
                column.width ? "shrink-0" : "min-w-0 flex-1",
                column.align === "right" && "flex justify-end",
                column.hideBelow && hideClasses[column.hideBelow],
              )}
            >
              <span className="text-xs font-semibold tracking-[0.3px] text-ink-2">
                {column.header}
              </span>
            </div>
          ))}
        </div>

        {rows.map((row, index) => (
          <div
            key={rowKey(row, index)}
            className="flex items-center border-b border-border-soft px-[18px] last:border-b-0 hover:bg-bg"
          >
            {columns.map((column) => (
              <div
                key={column.header}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "px-1.5 py-2.5",
                  column.width ? "shrink-0" : "min-w-0 flex-1",
                  column.align === "right" && "flex justify-end text-right",
                  column.hideBelow && hideClasses[column.hideBelow],
                )}
              >
                {column.cell(row)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Primary text inside a table cell. */
export function CellPrimary({ children }: { children: ReactNode }) {
  return (
    <span className="block truncate text-sm-plus font-semibold text-ink">
      {children}
    </span>
  );
}

/** Secondary line under a primary cell value. */
export function CellSecondary({ children }: { children: ReactNode }) {
  return <span className="block truncate text-xs text-ink-3">{children}</span>;
}

/** Regular single-line cell value. */
export function CellText({
  children,
  strong,
}: {
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <span
      className={cn(
        "block truncate text-sm-plus",
        strong ? "font-semibold text-ink" : "text-ink-2",
      )}
    >
      {children}
    </span>
  );
}

/** Two-line cell: bold identifier over a muted descriptor. */
export function CellStack({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <CellPrimary>{primary}</CellPrimary>
      <CellSecondary>{secondary}</CellSecondary>
    </div>
  );
}

/** Footer strip below a table: row count on the left, pager on the right. */
export function TableFooter({
  children,
  summary,
}: {
  children?: ReactNode;
  summary: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-[18px] py-3">
      <span className="flex-1 text-sm text-ink-3">{summary}</span>
      {children}
    </div>
  );
}
