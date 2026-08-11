import type { LucideIcon } from "lucide-react";

import { Card } from "./card";

/** Board `31 · States & Feedback` → Empty State. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-violet-50">
        <Icon className="size-7 text-violet" />
      </span>
      <h2 className="text-[16.5px] font-semibold text-ink">{title}</h2>
      <p className="max-w-[300px] text-base leading-[1.55] text-ink-2">
        {description}
      </p>
      {children ? (
        <div className="flex items-center gap-2.5">{children}</div>
      ) : null}
    </Card>
  );
}
