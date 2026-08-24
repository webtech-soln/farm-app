import type { UserRole } from "@/lib/db/schema";

/**
 * What a role may see, and what it may change.
 *
 * Reads and writes are separate capabilities on purpose. Gating only writes —
 * which is where this started — leaves every board legible to everyone, so a
 * driver can read payroll and margins even though they cannot touch them. The
 * `:read` half is what scopes the app to a person's actual sector; the
 * `:write` half is unchanged from the original model.
 *
 * Deliveries are their own sector rather than part of Sales, because the
 * driver's whole job lives there and nothing else in Sales concerns them.
 */
export type Capability =
  // Reads — one per section of the sidebar.
  | "farm:read"
  | "records:read"
  | "health:read"
  | "inventory:read"
  | "sales:read"
  | "deliveries:read"
  | "finance:read"
  | "people:read"
  | "reports:read"
  | "settings:read"
  | "tasks:read"
  // Writes.
  | "farm:write"
  | "records:write"
  | "health:write"
  | "inventory:write"
  | "sales:write"
  /**
   * Updating the state of a delivery run — not raising or re-routing one.
   * Split from `sales:write` so a driver can close off their own drops
   * without also being able to touch orders, products or customers.
   */
  | "deliveries:write"
  | "finance:write"
  | "people:write"
  | "tasks:write"
  | "settings:write"
  /** Everyone's own account: notification preferences, own password. */
  | "profile:write";

const ALL: Capability[] = [
  "farm:read",
  "records:read",
  "health:read",
  "inventory:read",
  "sales:read",
  "deliveries:read",
  "finance:read",
  "people:read",
  "reports:read",
  "settings:read",
  "tasks:read",
  "farm:write",
  "records:write",
  "health:write",
  "inventory:write",
  "sales:write",
  "deliveries:write",
  "finance:write",
  "people:write",
  "tasks:write",
  "settings:write",
  "profile:write",
];

/** Held by every role: their own tasks, their own account. */
const BASELINE: Capability[] = ["tasks:read", "tasks:write", "profile:write"];

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  owner: ALL,

  // Runs the farm day to day, but does not administer the system itself.
  manager: ALL.filter(
    (capability) =>
      capability !== "settings:write" && capability !== "settings:read",
  ),

  // Everything operational; nothing commercial or personal.
  supervisor: [
    ...BASELINE,
    "farm:read",
    "farm:write",
    "records:read",
    "records:write",
    "health:read",
    "health:write",
    "inventory:read",
    "inventory:write",
    // The team they supervise: names, duty status, assigned houses and
    // attendance. The board holds no pay, so there is nothing here a
    // supervisor should not see about the people they run the day with.
    "people:read",
    // Can request reports, so must be able to see where they land.
    "reports:read",
  ],

  attendant: [...BASELINE, "farm:read", "records:read", "records:write"],

  vet: [
    ...BASELINE,
    "farm:read",
    "records:read",
    "records:write",
    "health:read",
    "health:write",
  ],

  // The commercial side, and the deliveries they raise — but not margins,
  // payroll or the flock records behind the product.
  sales: [
    ...BASELINE,
    "sales:read",
    "sales:write",
    "deliveries:read",
    "deliveries:write",
  ],

  // The narrowest role in the app: their own run sheet, which they may close
  // off, and their own tasks. Scheduling a delivery is still Sales' job.
  driver: [...BASELINE, "deliveries:read", "deliveries:write"],
};

export function capabilitiesFor(role: UserRole): Capability[] {
  return ROLE_CAPABILITIES[role] ?? BASELINE;
}

export function can(role: UserRole, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Farm Owner",
  manager: "Farm Manager",
  supervisor: "Farm Supervisor",
  attendant: "Poultry Attendant",
  vet: "Veterinarian",
  sales: "Sales Officer",
  driver: "Driver",
};
