import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The `Page Header` frame every board opens with: optional breadcrumb, title
 * and subtitle on the left, actions trailing.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Trail segments, last one rendered as the current page. */
  breadcrumb?: string[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-[5px]">
        {breadcrumb?.length ? (
          <nav className="flex items-center gap-1.5">
            {breadcrumb.map((segment, index) => {
              const last = index === breadcrumb.length - 1;
              return (
                <span key={segment} className="flex items-center gap-1.5">
                  <span
                    className={
                      last
                        ? "text-sm font-medium text-ink-2"
                        : "text-sm text-ink-3"
                    }
                  >
                    {segment}
                  </span>
                  {last ? null : (
                    <ChevronRight className="size-3.5 text-ink-3" />
                  )}
                </span>
              );
            })}
          </nav>
        ) : null}
        <h1 className="text-xl font-semibold tracking-[-0.5px] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-base-plus text-ink-2">{subtitle}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      ) : null}
    </div>
  );
}
