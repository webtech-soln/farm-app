"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Egg } from "lucide-react";

import { isActive, navGroups } from "@/lib/nav";

/**
 * Board `00 · Component / Sidebar`. 248px at desktop, an icon-only rail at
 * tablet width (board 30), hidden entirely on phones where the bottom bar
 * takes over (board 29).
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col border-r border-border-hair bg-card md:flex md:w-[68px] xl:w-[248px]">
      <div className="flex items-center gap-2.5 border-b border-transparent px-4 py-[18px] max-xl:justify-center max-xl:px-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-violet">
          <Egg className="size-[17px] text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-px max-xl:hidden">
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-ink">
            Jayda Farms
          </span>
          <span className="text-xs text-ink-3">Ogun Estate</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-1 max-xl:items-center max-xl:px-2 scrollbar-thin">
        {navGroups.map((group, index) => (
          <ul key={index} className="flex w-full flex-col gap-0.5">
            {group.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-nav px-2.5 py-2 transition-colors max-xl:justify-center max-xl:px-0 ${
                      active
                        ? "bg-violet-light"
                        : "hover:bg-border-soft"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${active ? "text-violet" : "text-ink-2"}`}
                    />
                    <span
                      className={`flex-1 text-base max-xl:hidden ${
                        active
                          ? "font-semibold text-violet-deep"
                          : "font-medium text-ink-2"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="flex min-w-[18px] items-center justify-center rounded-full bg-violet px-1.5 py-px text-3xs font-semibold text-white max-xl:hidden">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border-hair px-4 py-3.5 max-xl:justify-center max-xl:px-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-light">
          <span className="text-sm font-semibold text-violet-deep">SA</span>
        </div>
        <div className="flex flex-1 flex-col gap-px max-xl:hidden">
          <span className="text-sm-plus font-semibold text-ink">
            Samuel Adeyemi
          </span>
          <span className="text-xs text-ink-3">Farm Owner</span>
        </div>
        <ChevronsUpDown className="size-[15px] shrink-0 text-ink-3 max-xl:hidden" />
      </div>
    </aside>
  );
}
