import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-violet text-white hover:bg-violet-deep",
  secondary:
    "border border-border-hair bg-card text-ink hover:bg-border-soft",
  ghost: "text-ink-2 hover:bg-border-soft",
};

type ButtonBaseProps = {
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  variant?: Variant;
  className?: string;
  children?: ReactNode;
};

function classesFor(variant: Variant, className?: string) {
  return cn(
    "inline-flex h-[38px] shrink-0 items-center gap-[7px] rounded-nav px-3.5 text-base font-semibold transition-colors",
    variants[variant],
    className,
  );
}

function Inner({
  icon: Icon,
  trailingIcon: TrailingIcon,
  children,
}: Pick<ButtonBaseProps, "icon" | "trailingIcon" | "children">) {
  return (
    <>
      {Icon ? <Icon className="size-[15px]" /> : null}
      {children}
      {TrailingIcon ? <TrailingIcon className="size-[15px]" /> : null}
    </>
  );
}

/** Board `Component / Button`. */
export function Button({
  icon,
  trailingIcon,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonBaseProps & ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={classesFor(variant, className)}
      {...props}
    >
      <Inner icon={icon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({
  icon,
  trailingIcon,
  variant = "primary",
  className,
  children,
  href,
}: ButtonBaseProps & { href: string }) {
  return (
    <Link href={href} className={classesFor(variant, className)}>
      <Inner icon={icon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </Link>
  );
}
