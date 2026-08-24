import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { can, capabilitiesFor } from "@/lib/auth/permissions";
import {
  ROUTE_CAPABILITY,
  UNRESTRICTED_ROUTES,
  landingFor,
  visibleRoutes,
  type GuardedRoute,
} from "@/lib/auth/route-capability";
import { navItems } from "@/lib/nav";
import type { UserRole } from "@/lib/db/schema";

const ROLES: UserRole[] = [
  "owner",
  "manager",
  "supervisor",
  "attendant",
  "vet",
  "sales",
  "driver",
];

/**
 * The agreed matrix, written out rather than derived — a test that computes the
 * expectation from the same table it is checking proves nothing.
 */
const EXPECTED: Record<UserRole, GuardedRoute[]> = {
  owner: Object.keys(ROUTE_CAPABILITY) as GuardedRoute[],

  manager: (Object.keys(ROUTE_CAPABILITY) as GuardedRoute[]).filter(
    (route) => route !== "/settings",
  ),

  supervisor: [
    "/", "/houses", "/flocks",
    "/records/daily", "/records/mortality", "/records/weight", "/feed", "/eggs",
    "/health", "/vaccinations", "/medicines",
    "/inventory", "/suppliers",
    "/employees", "/reports", "/tasks",
  ],

  attendant: [
    "/", "/houses", "/flocks",
    "/records/daily", "/records/mortality", "/records/weight", "/feed", "/eggs",
    "/tasks",
  ],

  vet: [
    "/", "/houses", "/flocks",
    "/records/daily", "/records/mortality", "/records/weight", "/feed", "/eggs",
    "/health", "/vaccinations", "/medicines",
    "/tasks",
  ],

  sales: ["/sales", "/products", "/customers", "/orders", "/deliveries", "/tasks"],

  driver: ["/deliveries", "/tasks"],
};

describe("who can open what", () => {
  it.each(ROLES)("%s sees exactly the boards agreed for it", (role) => {
    expect(visibleRoutes(role).sort()).toEqual([...EXPECTED[role]].sort());
  });

  it("keeps finance to the owner and the manager", () => {
    for (const route of ["/revenue", "/expenses", "/finance"] as GuardedRoute[]) {
      expect(visibleRoutes("owner")).toContain(route);
      expect(visibleRoutes("manager")).toContain(route);
      for (const role of ["supervisor", "attendant", "vet", "sales", "driver"] as UserRole[]) {
        expect(visibleRoutes(role)).not.toContain(route);
      }
    }
  });

  it("shows the team to those who run it, and nobody else", () => {
    // The board carries names, duty status and attendance — no pay — so a
    // supervisor may see the people they supervise.
    for (const role of ["owner", "manager", "supervisor"] as UserRole[]) {
      expect(visibleRoutes(role)).toContain("/employees");
    }
    for (const role of ["attendant", "vet", "sales", "driver"] as UserRole[]) {
      expect(visibleRoutes(role)).not.toContain("/employees");
    }
  });

  it("keeps settings to the owner alone", () => {
    for (const role of ROLES) {
      expect(visibleRoutes(role).includes("/settings")).toBe(role === "owner");
    }
  });

  it("leaves every role something to do", () => {
    for (const role of ROLES) expect(visibleRoutes(role).length).toBeGreaterThan(0);
  });
});

describe("landing board", () => {
  it.each<[UserRole, string]>([
    ["owner", "/"],
    ["manager", "/"],
    ["supervisor", "/"],
    ["attendant", "/"],
    ["vet", "/"],
    ["sales", "/sales"],
    ["driver", "/deliveries"],
  ])("sends %s to %s", (role, expected) => {
    expect(landingFor(role)).toBe(expected);
  });

  it("only ever lands a role somewhere it may actually go", () => {
    for (const role of ROLES) {
      expect(can(role, ROUTE_CAPABILITY[landingFor(role)])).toBe(true);
    }
  });
});

describe("the navigation cannot offer what a page would refuse", () => {
  it.each(ROLES)("every nav item shown to %s opens for it", (role) => {
    const capabilities = capabilitiesFor(role);
    const offered = navItems.filter((item) => {
      const required = ROUTE_CAPABILITY[item.href as GuardedRoute];
      return required === undefined || capabilities.includes(required);
    });

    for (const item of offered) {
      const required = ROUTE_CAPABILITY[item.href as GuardedRoute];
      if (required) expect(can(role, required)).toBe(true);
    }
  });

  it("maps every nav destination to a decision", () => {
    for (const item of navItems) {
      const known =
        item.href in ROUTE_CAPABILITY ||
        (UNRESTRICTED_ROUTES as readonly string[]).includes(item.href);
      expect(known, `${item.href} is in the sidebar but has no access rule`).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------------- */

/** Every `page.tsx` under the app group, as the route it serves. */
function boardRoutes(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      // Route groups like `(app)` do not appear in the URL.
      const segment = entry.startsWith("(") ? "" : `/${entry}`;
      found.push(...boardRoutes(path, prefix + segment));
    } else if (entry === "page.tsx") {
      found.push(prefix === "" ? "/" : prefix);
    }
  }
  return found;
}

describe("no board ships without an access rule", () => {
  const routes = boardRoutes("app");

  it("found the boards", () => {
    expect(routes.length).toBeGreaterThan(20);
  });

  it.each(boardRoutes("app"))("%s is covered", (route) => {
    // A dynamic child inherits its parent's rule: /houses/[houseId] is
    // whatever /houses is.
    const parent = route.replace(/\/\[[^\]]+\]$/, "");
    const covered =
      route in ROUTE_CAPABILITY ||
      parent in ROUTE_CAPABILITY ||
      (UNRESTRICTED_ROUTES as readonly string[]).includes(route) ||
      route === "/login";

    expect(covered, `${route} has no entry in ROUTE_CAPABILITY`).toBe(true);
  });

  it.each(boardRoutes("app").filter((r) => r !== "/login"))(
    "%s actually calls the guard",
    (route) => {
      const dir = route === "/" ? "app/(app)" : `app/(app)${route}`;
      const source = readFileSync(join(dir, "page.tsx"), "utf8");
      const exempt = (UNRESTRICTED_ROUTES as readonly string[]).includes(route);

      // Declaring a rule is not enforcing it — the page has to call it.
      expect(
        exempt || source.includes("requirePageAccess"),
        `${route} does not call requirePageAccess`,
      ).toBe(true);
    },
  );
});
