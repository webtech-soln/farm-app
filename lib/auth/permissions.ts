import type { UserRole } from "@/lib/db/schema";

/**
 * Capabilities are coarse on purpose: they map to the sidebar sections a role
 * is expected to work in, which is how the "Roles & permissions" settings
 * board describes them.
 */
export type Capability =
  | "farm:read"
  | "farm:write"
  | "records:write"
  | "health:write"
  | "inventory:write"
  | "sales:write"
  | "finance:write"
  | "people:write"
  | "tasks:write"
  | "settings:write";

const ALL: Capability[] = [
  "farm:read",
  "farm:write",
  "records:write",
  "health:write",
  "inventory:write",
  "sales:write",
  "finance:write",
  "people:write",
  "tasks:write",
  "settings:write",
];

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  owner: ALL,
  manager: ALL.filter((capability) => capability !== "settings:write"),
  supervisor: [
    "farm:read",
    "farm:write",
    "records:write",
    "health:write",
    "inventory:write",
    "tasks:write",
  ],
  attendant: ["farm:read", "records:write", "tasks:write"],
  vet: ["farm:read", "records:write", "health:write", "tasks:write"],
  sales: ["farm:read", "sales:write", "tasks:write"],
  driver: ["farm:read", "tasks:write"],
};

export function capabilitiesFor(role: UserRole): Capability[] {
  return ROLE_CAPABILITIES[role] ?? ["farm:read"];
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
