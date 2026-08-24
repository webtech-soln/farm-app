import { describe, expect, it } from "vitest";

import { capabilitiesFor, can } from "@/lib/auth/permissions";
import { safeNext } from "@/lib/auth/safe-next";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/db/schema";

describe("permissions", () => {
  it("gives the owner everything and the driver almost nothing", () => {
    expect(capabilitiesFor("owner")).toContain("settings:write");
    expect(capabilitiesFor("driver")).toEqual(["farm:read", "tasks:write"]);
  });

  it("withholds settings from the manager, who has everything else", () => {
    expect(can("manager", "finance:write")).toBe(true);
    expect(can("manager", "people:write")).toBe(true);
    expect(can("manager", "settings:write")).toBe(false);
  });

  it.each<[UserRole, string[], string[]]>([
    ["supervisor", ["farm:write", "records:write", "inventory:write"], ["sales:write", "finance:write"]],
    ["attendant", ["records:write", "tasks:write"], ["farm:write", "health:write"]],
    ["vet", ["health:write", "records:write"], ["inventory:write", "sales:write"]],
    ["sales", ["sales:write"], ["records:write", "finance:write"]],
  ])("%s can do its own job and no more", (role, allowed, denied) => {
    for (const capability of allowed) expect(can(role, capability as never)).toBe(true);
    for (const capability of denied) expect(can(role, capability as never)).toBe(false);
  });

  it("gives every role read access", () => {
    const roles: UserRole[] = ["owner", "manager", "supervisor", "attendant", "vet", "sales", "driver"];
    for (const role of roles) expect(can(role, "farm:read")).toBe(true);
  });
});

describe("safeNext", () => {
  it("keeps a same-origin path", () => {
    expect(safeNext("/houses")).toBe("/houses");
    expect(safeNext("/orders?status=paid")).toBe("/orders?status=paid");
  });

  it.each([
    "https://evil.test",
    "//evil.test",
    "///evil.test",
    "/\\evil.test",
    "/\t/evil.test",
    "/\n/evil.test",
    "javascript:alert(1)",
    "http://evil.test/houses",
  ])("refuses %j", (candidate) => {
    expect(safeNext(candidate)).toBe("/");
  });

  it("falls back for empty input, and honours a custom fallback", () => {
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
    expect(safeNext(null, "")).toBe("");
  });

  it("never returns something a browser would read as protocol-relative", () => {
    for (const candidate of ["/\\evil.test", "//evil.test", "/\t//evil.test"]) {
      const result = safeNext(candidate);
      expect(new URL(result, "http://farm.local").origin).toBe("http://farm.local");
    }
  });
});

describe("password hashing", () => {
  it("round-trips a password and rejects the wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("correct horse battery", stored)).resolves.toBe(true);
    await expect(verifyPassword("Correct horse battery", stored)).resolves.toBe(false);
  });

  it("salts, so the same password hashes differently each time", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
  });

  it("returns false rather than throwing on a corrupt or missing hash", async () => {
    for (const stored of [null, undefined, "", "not-a-hash", "scrypt$bad$parts", "bcrypt$1$2$3$4$5"]) {
      await expect(verifyPassword("anything", stored)).resolves.toBe(false);
    }
  });
});
