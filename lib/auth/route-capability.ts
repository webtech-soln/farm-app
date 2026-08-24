import { can, type Capability } from "./permissions";
import type { UserRole } from "@/lib/db/schema";

/**
 * Which capability each board answers to.
 *
 * One table rather than a rule per page, so "what can this role see?" has a
 * single answer that a test can walk. `tests/integration/route-access.test.ts`
 * asserts every entry here against every role, and fails if a route is added
 * without a decision being made about it.
 */
export const ROUTE_CAPABILITY = {
  "/": "farm:read",
  "/houses": "farm:read",
  "/flocks": "farm:read",

  "/records/daily": "records:read",
  "/records/mortality": "records:read",
  "/records/weight": "records:read",
  "/feed": "records:read",
  "/eggs": "records:read",

  "/health": "health:read",
  "/vaccinations": "health:read",
  "/medicines": "health:read",

  "/inventory": "inventory:read",
  "/suppliers": "inventory:read",

  "/sales": "sales:read",
  "/products": "sales:read",
  "/customers": "sales:read",
  "/orders": "sales:read",
  "/deliveries": "deliveries:read",

  "/revenue": "finance:read",
  "/expenses": "finance:read",
  "/finance": "finance:read",

  "/employees": "people:read",
  "/reports": "reports:read",
  "/tasks": "tasks:read",
  "/settings": "settings:read",
} as const satisfies Record<string, Capability>;

export type GuardedRoute = keyof typeof ROUTE_CAPABILITY;

/**
 * Boards every signed-in person may open, whatever their role.
 *
 * An explicit list rather than an absence, so `tests/unit/route-access.test.ts`
 * can insist that every page in the app is either here or in the table above —
 * a new board cannot ship without somebody deciding who it is for.
 */
export const UNRESTRICTED_ROUTES = ["/notifications"] as const;

/**
 * Where a role goes when it signs in, or when it lands somewhere it may not
 * be. Ordered by how central the board is to that role's day.
 */
const LANDING_ORDER: GuardedRoute[] = [
  "/",
  // Sales before deliveries: a sales officer can read both, and the run sheet
  // is the driver's board, not theirs.
  "/sales",
  "/deliveries",
  "/records/daily",
  "/tasks",
];

export function landingFor(role: UserRole): GuardedRoute {
  const landing = LANDING_ORDER.find((route) =>
    can(role, ROUTE_CAPABILITY[route]),
  );
  // Every role holds `tasks:read`, so the fallback is unreachable in practice.
  return landing ?? "/tasks";
}

/** The boards a role may open, in sidebar order. */
export function visibleRoutes(role: UserRole): GuardedRoute[] {
  return (Object.keys(ROUTE_CAPABILITY) as GuardedRoute[]).filter((route) =>
    can(role, ROUTE_CAPABILITY[route]),
  );
}
