"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { bottomNavItems, isActive } from "@/lib/nav";

/** Phone-only tab bar from board `29 · Mobile`, with the record FAB centred. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [left, right] = [bottomNavItems.slice(0, 2), bottomNavItems.slice(2)];

  return (
    <nav className="sticky bottom-0 z-20 flex h-[62px] shrink-0 items-center border-t border-border-hair bg-card md:hidden">
      {left.map((item) => (
        <BottomNavLink key={item.href} item={item} pathname={pathname} />
      ))}

      <div className="flex flex-1 justify-center">
        <Link
          href="/quick-entry"
          aria-label="Record"
          className="flex size-11 items-center justify-center rounded-full bg-violet shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
        >
          <Plus className="size-5 text-white" />
        </Link>
      </div>

      {right.map((item) => (
        <BottomNavLink key={item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}

function BottomNavLink({
  item,
  pathname,
}: {
  item: (typeof bottomNavItems)[number];
  pathname: string;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-1 ${
        active ? "text-violet" : "text-ink-3"
      }`}
    >
      <Icon className="size-[18px]" />
      <span className="text-2xs font-medium">{item.label}</span>
    </Link>
  );
}
