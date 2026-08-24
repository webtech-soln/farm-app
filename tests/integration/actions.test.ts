import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { recordStockMovement } from "@/lib/actions/inventory";
import { recordPayment } from "@/lib/actions/sales";
import { saveMortalityRecord, saveDailyRecord } from "@/lib/actions/records";
import { saveHouse } from "@/lib/actions/houses";
import { saveUser } from "@/lib/actions/people";
import { db } from "@/lib/db";
import { inventoryItems, inventoryMovements, payments } from "@/lib/db/schema";
import { todayIso } from "@/lib/date";

import { seedFixtures, type Fixtures } from "../setup/fixtures";
import { form, IDLE, signInAs, signOutOfTest } from "../setup/session";

const ready = process.env.FARM_TEST_DB_READY !== "false";
const suite = ready ? describe : describe.skip;

let fx: Fixtures;

suite("Server Actions against a real database", () => {
  beforeAll(() => {
    if (!ready) console.warn("[tests] skipping integration suite — no database");
  });

  beforeEach(async () => {
    fx = await seedFixtures();
    signOutOfTest();
  });

  /* ---------------------------------------------------------------------- */
  describe("the capability gate", () => {
    it("refuses a role that lacks the capability, before it validates anything", async () => {
      await signInAs("driver", fx);
      const result = await recordStockMovement(IDLE, form({}));

      expect(result.status).toBe("error");
      expect(result.message).toContain("cannot perform this action");
      // The gate must answer first: no field errors means validation never ran.
      expect(result.fieldErrors).toBeUndefined();
    });

    it("lets a permitted role through to validation", async () => {
      await signInAs("supervisor", fx);
      const result = await recordStockMovement(IDLE, form({}));

      expect(result.status).toBe("error");
      expect(result.message).not.toContain("cannot perform this action");
      expect(result.fieldErrors?.itemId).toBeDefined();
    });

    it.each([
      ["attendant", "people:write"],
      ["vet", "people:write"],
      ["sales", "people:write"],
      ["driver", "people:write"],
      ["supervisor", "people:write"],
    ])("refuses %s the %s action", async (role) => {
      await signInAs(role as never, fx);
      const result = await saveUser(
        IDLE,
        form({ name: "Escalated", email: "esc@test.local", role: "owner", password: "Password12" }),
      );
      expect(result.message).toContain("cannot perform this action");
    });

    it("writes nothing when the gate refuses", async () => {
      await signInAs("driver", fx);
      await saveUser(
        IDLE,
        form({ name: "Escalated", email: "esc@test.local", role: "owner", password: "Password12" }),
      );
      const rows = await db.query.users.findMany();
      expect(rows.some((row) => row.email === "esc@test.local")).toBe(false);
    });
  });

  /* ---------------------------------------------------------------------- */
  describe("stock movement", () => {
    const stockOut = (quantity: number) =>
      recordStockMovement(
        IDLE,
        form({ itemId: fx.itemId, type: "stock_out", quantity, occurredOn: todayIso() }),
      );

    it("issues stock and lowers the balance", async () => {
      await signInAs("supervisor", fx);
      const result = await stockOut(100);

      expect(result.status).toBe("success");
      const [item] = await db
        .select({ quantity: inventoryItems.quantity })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, fx.itemId));
      expect(item.quantity).toBe(800);
    });

    it("refuses to issue more than is on hand", async () => {
      await signInAs("supervisor", fx);
      const result = await stockOut(901);

      expect(result.status).toBe("error");
      expect(result.fieldErrors?.quantity?.[0]).toContain("More than the quantity in stock");
    });

    it("does not let concurrent issues oversell the same 900 kg", async () => {
      await signInAs("supervisor", fx);

      // The original defect: eight overlapping requests each read 900, each
      // passed the check, and five of them were accepted — 2,500 kg issued
      // against a balance that only fell by 500.
      const results = await Promise.all(Array.from({ length: 8 }, () => stockOut(500)));
      const accepted = results.filter((r) => r.status === "success").length;

      expect(accepted).toBe(1);

      const [item] = await db
        .select({ quantity: inventoryItems.quantity })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, fx.itemId));
      const ledger = await db
        .select({ quantity: inventoryMovements.quantity })
        .from(inventoryMovements);

      expect(item.quantity).toBe(400);
      // The ledger and the balance have to tell the same story.
      const issued = ledger.reduce((total, row) => total + row.quantity, 0);
      expect(issued).toBe(900 - item.quantity);
    });

    it("adds stock on a receipt", async () => {
      await signInAs("supervisor", fx);
      const result = await recordStockMovement(
        IDLE,
        form({ itemId: fx.itemId, type: "stock_in", quantity: 250, occurredOn: todayIso() }),
      );
      expect(result.status).toBe("success");
      const [item] = await db
        .select({ quantity: inventoryItems.quantity })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, fx.itemId));
      expect(item.quantity).toBe(1150);
    });
  });

  /* ---------------------------------------------------------------------- */
  describe("payments", () => {
    const pay = (amount: string) =>
      recordPayment(IDLE, form({ orderId: fx.orderId, amountCents: amount, receivedOn: todayIso() }));

    it("accepts a payment within the outstanding balance", async () => {
      await signInAs("sales", fx);
      expect((await pay("100.00")).status).toBe("success");
    });

    it("refuses a payment beyond the order total", async () => {
      await signInAs("sales", fx);
      const result = await pay("5000.00");

      expect(result.status).toBe("error");
      expect(result.fieldErrors?.amountCents?.[0]).toContain("More than the");

      const rows = await db.select().from(payments);
      expect(rows).toHaveLength(0);
    });

    it("refuses anything further once the order is settled", async () => {
      await signInAs("sales", fx);
      expect((await pay("486.00")).status).toBe("success");

      const result = await pay("0.01");
      expect(result.status).toBe("error");
      expect(result.message).toContain("already paid in full");
    });

    it("counts part-payments towards the balance", async () => {
      await signInAs("sales", fx);
      await pay("200.00");
      await pay("200.00");
      // 400 of 486 taken; 86 remains, so 87 is one pesewa too many.
      expect((await pay("87.00")).status).toBe("error");
      expect((await pay("86.00")).status).toBe("success");
    });
  });

  /* ---------------------------------------------------------------------- */
  describe("mortality", () => {
    it("refuses more deaths than the flock holds", async () => {
      await signInAs("vet", fx);
      const result = await saveMortalityRecord(
        IDLE,
        form({ flockId: fx.flockId, occurredOn: todayIso(), deaths: 1001, cause: "Heat stress" }),
      );

      expect(result.status).toBe("error");
      expect(result.fieldErrors?.deaths?.[0]).toContain("birds in this flock");
    });

    it("accepts a loss the flock can absorb", async () => {
      await signInAs("vet", fx);
      const result = await saveMortalityRecord(
        IDLE,
        form({ flockId: fx.flockId, occurredOn: todayIso(), deaths: 12, cause: "Heat stress" }),
      );
      expect(result.status).toBe("success");
    });
  });

  /* ---------------------------------------------------------------------- */
  describe("database constraints reach the form", () => {
    it("names the duplicate rather than saying something went wrong", async () => {
      await signInAs("owner", fx);
      const result = await saveHouse(
        IDLE,
        form({ code: "house-01", name: "Duplicate", capacity: 100, status: "healthy" }),
      );

      // The defect this guards: drizzle wraps the pg error, so the generic
      // handler swallowed every constraint violation in the app.
      expect(result.status).toBe("error");
      expect(result.message).toBe("A house with that code already exists.");
      expect(result.fieldErrors?.code).toBeDefined();
    });
  });

  /* ---------------------------------------------------------------------- */
  describe("daily records", () => {
    it("derives the closing birds and refuses impossible losses", async () => {
      await signInAs("attendant", fx);
      const base = {
        houseId: fx.houseId,
        flockId: fx.flockId,
        recordDate: todayIso(),
        startingBirds: 1000,
        culls: 0,
        transfersOut: 0,
        status: "submitted",
      };

      expect((await saveDailyRecord(IDLE, form({ ...base, deaths: 1001 }))).status).toBe("error");
      expect((await saveDailyRecord(IDLE, form({ ...base, deaths: 10 }))).status).toBe("success");
    });
  });
});
