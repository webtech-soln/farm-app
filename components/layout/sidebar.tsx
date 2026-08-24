"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Egg, LogOut, Menu, X } from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";
import { isActive, navGroupsFor } from "@/lib/nav";

export type SidebarUser = {
  initials: string;
  name: string;
  /** The person's job title, falling back to their role label. */
  role: string;
};

type SidebarProps = {
  user: SidebarUser;
  farmName: string;
  estate: string;
  /**
   * The paths this role may open, from the same table the page gate reads, so
   * the sidebar can never offer a board that would redirect on click.
   */
  allowed: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* Drawer state                                                               */
/* -------------------------------------------------------------------------- */

const DrawerContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

/**
 * Shares the drawer's open state between the topbar's menu button and the
 * sliding panel, which sit in different branches of the layout.
 */
export function SidebarDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

/** The hamburger in the topbar; only shown where the rail is not full width. */
export function SidebarTrigger() {
  const { setOpen } = useContext(DrawerContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
      className="flex size-9 shrink-0 items-center justify-center rounded-nav hover:bg-border-soft xl:hidden"
    >
      <Menu className="size-[18px] text-ink-2" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Board `00 · Component / Sidebar`. 248px at desktop, an icon-only rail at
 * tablet width (board 30), hidden entirely on phones where the bottom bar
 * takes over (board 29) — on both of those the full nav is a tap away in the
 * drawer.
 */
export function Sidebar(props: SidebarProps) {
  return (
    // Pinned to the viewport rather than growing with the page. The nav inside
    // already scrolls on its own, but `flex-1` needs a bounded height to push
    // against — without one the rail stretches to the full page and the last
    // few sections, along with the sign-out button, sit below the fold on a
    // laptop with no way to reach them but scrolling the whole board.
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border-hair bg-card md:flex md:w-[68px] xl:w-[248px]">
      <SidebarContent {...props} />
    </aside>
  );
}

/** The same nav, slid in over the page from the left. */
export function SidebarDrawer(props: SidebarProps) {
  const { open, setOpen } = useContext(DrawerContext);
  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 xl:hidden",
        // Kept mounted so the panel can animate both ways; it only takes
        // pointer events while open.
        open ? "visible" : "invisible",
      )}
      aria-hidden={open ? undefined : true}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close navigation"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[248px] max-w-[82vw] flex-col border-r border-border-hair bg-card shadow-[0_16px_48px_rgba(24,24,27,0.18)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={close}
          tabIndex={open ? 0 : -1}
          aria-label="Close navigation"
          className="absolute top-[18px] right-3 flex size-8 items-center justify-center rounded-nav text-ink-3 hover:bg-border-soft hover:text-ink"
        >
          <X className="size-4" />
        </button>
        <SidebarContent
          {...props}
          expanded
          tabbable={open}
          onNavigate={close}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared contents                                                            */
/* -------------------------------------------------------------------------- */

function SidebarContent({
  user,
  farmName,
  estate,
  allowed,
  expanded = false,
  tabbable = true,
  onNavigate,
}: SidebarProps & {
  /** The drawer is always full width, so it never collapses to the rail. */
  expanded?: boolean;
  tabbable?: boolean;
  /** Closes the drawer when a link inside it is followed. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  // The rail hides labels between md and xl; the drawer never does.
  const collapse = expanded ? "" : "max-xl:hidden";
  const centre = expanded ? "" : "max-xl:justify-center max-xl:px-0";
  const tabIndex = tabbable ? undefined : -1;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-transparent px-4 py-[18px]",
          centre,
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-violet">
          <Egg className="size-[17px] text-white" strokeWidth={2} />
        </div>
        <div className={cn("flex flex-col gap-px", collapse)}>
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-ink">
            {farmName}
          </span>
          <span className="text-xs text-ink-3">{estate}</span>
        </div>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-1 scrollbar-thin",
          expanded ? "" : "max-xl:items-center max-xl:px-2",
        )}
      >
        {navGroupsFor(allowed).map((group, index) => (
          <ul key={index} className="flex w-full flex-col gap-0.5">
            {group.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    tabIndex={tabIndex}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-nav px-2.5 py-2 transition-colors",
                      centre,
                      active ? "bg-violet-light" : "hover:bg-border-soft",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-violet" : "text-ink-2",
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-base",
                        collapse,
                        active
                          ? "font-semibold text-violet-deep"
                          : "font-medium text-ink-2",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "flex min-w-[18px] items-center justify-center rounded-full bg-violet px-1.5 py-px text-3xs font-semibold text-white",
                          collapse,
                        )}
                      >
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

      <div
        className={cn(
          "flex items-center gap-2.5 border-t border-border-hair px-4 py-3.5",
          centre,
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-light">
          <span className="text-sm font-semibold text-violet-deep">
            {user.initials}
          </span>
        </div>
        <div className={cn("flex flex-1 flex-col gap-px", collapse)}>
          <span className="text-sm-plus font-semibold text-ink">
            {user.name}
          </span>
          <span className="text-xs text-ink-3">{user.role}</span>
        </div>
        <form action={signOut} className={collapse}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
            tabIndex={tabIndex}
            className="flex size-7 items-center justify-center rounded-nav hover:bg-border-soft"
          >
            <LogOut className="size-[15px] shrink-0 text-ink-3" />
          </button>
        </form>
      </div>
    </>
  );
}
