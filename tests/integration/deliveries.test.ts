import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { saveDelivery, setDeliveryStatus } from "@/lib/actions/sales";
import { db } from "@/lib/db";
import { deliveries, orders } from "@/lib/db/schema";

import { seedFixtures, type Fixtures } from "../setup/fixtures";
import { form, IDLE, signInAs, signOutOfTest } from "../setup/session";

const ready = process.env.FARM_TEST_DB_READY !== "false";
const suite = ready ? describe : describe.skip;

let fx: Fixtures;

const statusOf = async (id: number) => {
  const [row] = await db
    .select({ status: deliveries.status })
    .from(deliveries)
    .where(eq(deliveries.id, id));
  return row.status;
};

suite("the delivery run sheet", () => {
  beforeEach(async () => {
    fx = await seedFixtures();
    signOutOfTest();
  });

  describe("a driver closing off their own work", () => {
    it("may mark their own drop delivered", async () => {
      await signInAs("driver", fx);
      const result = await setDeliveryStatus(
        IDLE,
        form({ id: fx.ownDeliveryId, status: "delivered" }),
      );

      expect(result.status).toBe("success");
      expect(await statusOf(fx.ownDeliveryId)).toBe("delivered");
    });

    it("moves the order along with the drop", async () => {
      await signInAs("driver", fx);
      await setDeliveryStatus(IDLE, form({ id: fx.ownDeliveryId, status: "delivered" }));

      const [order] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, fx.orderId));
      expect(order.status).toBe("delivered");
    });

    it("may record a failed attempt", async () => {
      await signInAs("driver", fx);
      const result = await setDeliveryStatus(
        IDLE,
        form({ id: fx.ownDeliveryId, status: "failed", notes: "Gate locked" }),
      );
      expect(result.status).toBe("success");
      expect(await statusOf(fx.ownDeliveryId)).toBe("failed");
    });
  });

  describe("a driver reaching past their own run sheet", () => {
    it("cannot touch another driver's drop", async () => {
      await signInAs("driver", fx);
      const result = await setDeliveryStatus(
        IDLE,
        form({ id: fx.otherDeliveryId, status: "delivered" }),
      );

      expect(result.status).toBe("error");
      expect(result.message).toContain("assigned to another driver");
      // And crucially, it did not change.
      expect(await statusOf(fx.otherDeliveryId)).toBe("scheduled");
    });

    it("cannot schedule a delivery at all", async () => {
      await signInAs("driver", fx);
      const result = await saveDelivery(
        IDLE,
        form({
          orderId: fx.orderId,
          destination: "Somewhere new",
          scheduledOn: "2026-02-01",
        }),
      );

      // Raising a run stays with Sales — `deliveries:write` is only about
      // updating the state of one that already exists.
      expect(result.message).toContain("cannot perform this action");
    });

    it("still cannot reach anything else in Sales", async () => {
      await signInAs("driver", fx);
      const { saveCustomer } = await import("@/lib/actions/sales");
      const result = await saveCustomer(
        IDLE,
        form({ name: "New Customer", type: "retailer" }),
      );
      expect(result.message).toContain("cannot perform this action");
    });
  });

  describe("sales and above", () => {
    it("may update any driver's drop", async () => {
      await signInAs("sales", fx);
      const result = await setDeliveryStatus(
        IDLE,
        form({ id: fx.otherDeliveryId, status: "in_transit" }),
      );

      expect(result.status).toBe("success");
      expect(await statusOf(fx.otherDeliveryId)).toBe("in_transit");
    });

    it("may still schedule one", async () => {
      await signInAs("sales", fx);
      const result = await saveDelivery(
        IDLE,
        form({
          orderId: fx.orderId,
          destination: "Somewhere new",
          scheduledOn: "2026-02-01",
        }),
      );
      expect(result.status).toBe("success");
    });
  });

  describe("roles with no business on the run sheet", () => {
    it.each(["attendant", "vet"] as const)("refuses %s", async (role) => {
      await signInAs(role, fx);
      const result = await setDeliveryStatus(
        IDLE,
        form({ id: fx.ownDeliveryId, status: "delivered" }),
      );

      expect(result.message).toContain("cannot perform this action");
      expect(await statusOf(fx.ownDeliveryId)).toBe("scheduled");
    });
  });
});

/* -------------------------------------------------------------------------- */

suite("the tasks board does not leak the sectors it cuts across", () => {
  beforeEach(async () => {
    fx = await seedFixtures();
    signOutOfTest();
  });

  it("shows a narrow role only its own work", async () => {
    const { getTaskBoard } = await import("@/lib/data/tasks");
    const { tasks } = await import("@/lib/db/schema");

    await db.insert(tasks).values([
      {
        title: "Chase payment",
        detail: "₵3,420 overdue",
        priority: "high",
        status: "pending",
        assigneeId: fx.userIdByRole.sales,
        createdById: fx.userIdByRole.owner,
      },
      {
        title: "Drop the crates",
        detail: "Bodija run",
        priority: "medium",
        status: "pending",
        assigneeId: fx.userIdByRole.driver,
        createdById: fx.userIdByRole.owner,
      },
    ]);

    const board = await getTaskBoard({ ownedBy: fx.userIdByRole.driver });
    const titles = board.flatMap((column) => column.tasks.map((t) => t.title));

    expect(titles).toContain("Drop the crates");
    // The finance figure in the other task's detail is what must not travel.
    expect(titles).not.toContain("Chase payment");
  });

  it("shows everything to whoever manages the people", async () => {
    const { getTaskBoard } = await import("@/lib/data/tasks");
    const { tasks } = await import("@/lib/db/schema");

    await db.insert(tasks).values({
      title: "Chase payment",
      detail: "₵3,420 overdue",
      priority: "high",
      status: "pending",
      assigneeId: fx.userIdByRole.sales,
      createdById: fx.userIdByRole.owner,
    });

    const board = await getTaskBoard({});
    const titles = board.flatMap((column) => column.tasks.map((t) => t.title));
    expect(titles).toContain("Chase payment");
  });

  it("counts only what the board shows", async () => {
    const { getTaskCounts } = await import("@/lib/data/tasks");
    const { tasks } = await import("@/lib/db/schema");

    await db.insert(tasks).values([
      { title: "Theirs", priority: "high", status: "pending", assigneeId: fx.userIdByRole.sales, createdById: fx.userIdByRole.owner },
      { title: "Mine", priority: "high", status: "pending", assigneeId: fx.userIdByRole.driver, createdById: fx.userIdByRole.owner },
    ]);

    expect((await getTaskCounts(fx.userIdByRole.driver)).open).toBe(1);
    expect((await getTaskCounts()).open).toBe(2);
  });
});
