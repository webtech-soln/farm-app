import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { resetDatabase } from "@/lib/db/reset";
import {
  customers,
  deliveries,
  farmSettings,
  flocks,
  houses,
  inventoryItems,
  orders,
  products,
  users,
  type UserRole,
} from "@/lib/db/schema";

export const TEST_PASSWORD = "test-password-1A";

/**
 * The smallest dataset the action tests need: one account per role, and one
 * row of everything an action reaches for. Deliberately not the demo seed —
 * a test that depends on the seed's shape breaks every time the seed changes.
 */
export async function seedFixtures() {
  await resetDatabase();

  const passwordHash = await hashPassword(TEST_PASSWORD);
  const roles: UserRole[] = [
    "owner",
    "manager",
    "supervisor",
    "attendant",
    "vet",
    "sales",
    "driver",
  ];

  const people = await db
    .insert(users)
    .values(
      roles.map((role) => ({
        name: `${role} person`,
        email: `${role}@test.local`,
        role,
        passwordHash,
        isActive: true,
      })),
    )
    .returning({ id: users.id, role: users.role });

  const userIdByRole = Object.fromEntries(
    people.map((person) => [person.role, person.id]),
  ) as Record<UserRole, number>;

  await db.insert(farmSettings).values({ id: 1, farmName: "Test Farm" });

  const [house] = await db
    .insert(houses)
    .values({ code: "house-01", name: "House 01", capacity: 5000, status: "healthy" })
    .returning({ id: houses.id });

  const [flock] = await db
    .insert(flocks)
    .values({
      code: "JF-TEST-001",
      houseId: house.id,
      type: "broiler",
      breed: "Ross 308",
      initialCount: 1000,
      currentCount: 1000,
      startedOn: "2026-01-01",
      status: "healthy",
    })
    .returning({ id: flocks.id });

  const [item] = await db
    .insert(inventoryItems)
    .values({
      sku: "FD-TEST",
      name: "Test Feed",
      category: "feed",
      quantity: 900,
      unit: "kg",
      unitCostCents: 100,
      minStock: 100,
      isActive: true,
    })
    .returning({ id: inventoryItems.id });

  const [customer] = await db
    .insert(customers)
    .values({ name: "Test Customer", type: "retailer", status: "active" })
    .returning({ id: customers.id });

  const [product] = await db
    .insert(products)
    .values({
      name: "Test Eggs",
      category: "Eggs",
      priceCents: 1000,
      unit: "crate",
      availableQty: 500,
      status: "in_stock",
      isActive: true,
    })
    .returning({ id: products.id });

  const [secondDriver] = await db
    .insert(users)
    .values({
      name: "other driver",
      email: "other-driver@test.local",
      role: "driver",
      passwordHash,
      isActive: true,
    })
    .returning({ id: users.id });

  const [order] = await db
    .insert(orders)
    .values({
      reference: "ORD-9001",
      customerId: customer.id,
      status: "confirmed",
      paymentStatus: "unpaid",
      subtotalCents: 48_600,
      totalCents: 48_600,
      deliveryFeeCents: 0,
    })
    .returning({ id: orders.id });

  // Two runs on the board: one belonging to the seeded driver, one to someone
  // else — so a test can tell "may update a delivery" from "may update *this*
  // delivery".
  const [ownRun, otherRun] = await db
    .insert(deliveries)
    .values([
      {
        orderId: order.id,
        driverId: userIdByRole.driver,
        destination: "Own drop",
        scheduledOn: "2026-01-02",
        status: "scheduled" as const,
      },
      {
        orderId: order.id,
        driverId: secondDriver.id,
        destination: "Someone else's drop",
        scheduledOn: "2026-01-02",
        status: "scheduled" as const,
      },
    ])
    .returning({ id: deliveries.id });

  return {
    userIdByRole,
    otherDriverId: secondDriver.id,
    ownDeliveryId: ownRun.id,
    otherDeliveryId: otherRun.id,
    houseId: house.id,
    flockId: flock.id,
    itemId: item.id,
    customerId: customer.id,
    productId: product.id,
    orderId: order.id,
  };
}

export type Fixtures = Awaited<ReturnType<typeof seedFixtures>>;
