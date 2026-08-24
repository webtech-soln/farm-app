import "server-only";

import { redirect } from "next/navigation";

import { can } from "./permissions";
import type { Capability } from "./permissions";
import { landingFor } from "./route-capability";
import { requireUser, type SessionUser } from "./session";

export {
  ROUTE_CAPABILITY,
  landingFor,
  visibleRoutes,
  type GuardedRoute,
} from "./route-capability";

/**
 * The gate every board goes through.
 *
 * A refused read is a redirect rather than an error: the person has not done
 * anything wrong, they have followed a link — a stale bookmark, a shared URL,
 * a nav item from a previous role — to somewhere their job does not reach.
 * Sending them to their own landing board is more useful than a wall.
 */
export async function requirePageAccess(
  capability: Capability,
): Promise<SessionUser> {
  const user = await requireUser();

  if (!can(user.role, capability)) {
    redirect(landingFor(user.role));
  }

  return user;
}
