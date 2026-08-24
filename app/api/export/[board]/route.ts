import { NextResponse, type NextRequest } from "next/server";

import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { getCustomers } from "@/lib/data/customers";
import { getDeliveries } from "@/lib/data/deliveries";
import { getCollections } from "@/lib/data/eggs";
import { getEmployees } from "@/lib/data/employees";
import { getExpenses } from "@/lib/data/expenses";
import { getFeedInventory } from "@/lib/data/feed";
import { getFlocks, getWeightRecords } from "@/lib/data/flocks";
import { getHealthEvents } from "@/lib/data/health";
import { getHouses } from "@/lib/data/houses";
import { getInventoryItems } from "@/lib/data/inventory";
import { getMedicines } from "@/lib/data/medicines";
import { getMortalityRecords } from "@/lib/data/mortality";
import { getOrders } from "@/lib/data/orders";
import { getProductPerformance } from "@/lib/data/products";
import { getRevenueEntries } from "@/lib/data/revenue";
import { getSuppliers } from "@/lib/data/suppliers";
import { getVaccinations } from "@/lib/data/vaccinations";
import { todayIso } from "@/lib/date";

type Row = Record<string, unknown>;

/**
 * Every board's `Export` button. The same query the board renders is run again
 * with the same filters — whatever is on screen is what lands in the file —
 * and the display-ready row objects are written straight out as CSV.
 */
const BOARDS: Record<string, (search: URLSearchParams) => Promise<Row[]>> = {
  flocks: (s) =>
    getFlocks({
      search: s.get("q") ?? undefined,
      house: s.get("house") ?? undefined,
      breed: s.get("breed") ?? undefined,
      type: s.get("type") ?? undefined,
      status: s.get("status") ?? undefined,
    }),
  houses: () => getHouses(),
  mortality: (s) =>
    getMortalityRecords(
      {
        search: s.get("q") ?? undefined,
        house: s.get("house") ?? undefined,
        flock: s.get("flock") ?? undefined,
        cause: s.get("cause") ?? undefined,
        status: s.get("status") ?? undefined,
      },
      1000,
    ),
  weight: () => getWeightRecords(1000),
  eggs: (s) =>
    getCollections(
      {
        search: s.get("q") ?? undefined,
        house: s.get("house") ?? undefined,
        session: s.get("session") ?? undefined,
      },
      1000,
    ),
  feed: (s) =>
    getFeedInventory({
      search: s.get("q") ?? undefined,
      supplier: s.get("supplier") ?? undefined,
    }),
  health: (s) =>
    getHealthEvents(
      {
        search: s.get("q") ?? undefined,
        flock: s.get("flock") ?? undefined,
        house: s.get("house") ?? undefined,
        status: s.get("status") ?? undefined,
      },
      1000,
    ),
  vaccinations: (s) =>
    getVaccinations(
      {
        search: s.get("q") ?? undefined,
        flock: s.get("flock") ?? undefined,
        house: s.get("house") ?? undefined,
        status: s.get("status") ?? undefined,
      },
      1000,
    ),
  medicines: (s) =>
    getMedicines({
      search: s.get("q") ?? undefined,
      supplier: s.get("supplier") ?? undefined,
    }),
  inventory: (s) =>
    getInventoryItems({
      search: s.get("q") ?? undefined,
      category: (s.get("category") as never) ?? undefined,
      supplier: s.get("supplier") ?? undefined,
      status: (s.get("status") as never) ?? undefined,
    }),
  suppliers: (s) =>
    getSuppliers({
      search: s.get("q") ?? undefined,
      category: s.get("category") ?? undefined,
      status: s.get("status") ?? undefined,
    }),
  products: () => getProductPerformance(),
  customers: (s) =>
    getCustomers({
      search: s.get("q") ?? undefined,
      type: s.get("type") ?? undefined,
      status: s.get("status") ?? undefined,
    }),
  orders: (s) =>
    getOrders(
      {
        search: s.get("q") ?? undefined,
        status: s.get("status") ?? undefined,
        paymentStatus: s.get("payment") ?? undefined,
        customer: s.get("customer") ?? undefined,
      },
      1000,
    ),
  deliveries: (s) =>
    getDeliveries(
      {
        search: s.get("q") ?? undefined,
        status: s.get("status") ?? undefined,
        driver: s.get("driver") ?? undefined,
        date: s.get("date") ?? undefined,
      },
      1000,
    ),
  revenue: (s) =>
    getRevenueEntries(
      {
        search: s.get("q") ?? undefined,
        customer: s.get("customer") ?? undefined,
        status: s.get("status") ?? undefined,
      },
      1000,
    ),
  expenses: (s) =>
    getExpenses(
      {
        search: s.get("q") ?? undefined,
        category: s.get("category") ?? undefined,
        supplier: s.get("supplier") ?? undefined,
        status: s.get("status") ?? undefined,
      },
      1000,
    ),
  employees: (s) =>
    getEmployees({
      search: s.get("q") ?? undefined,
      role: s.get("role") ?? undefined,
      dutyStatus: s.get("duty") ?? undefined,
    }),
};

/** Presentation-only fields that would be noise in a spreadsheet. */
const SKIP = /(Tone|Dot|Icon|Alert|Key|href|initials)$/i;

function toCsv(rows: Row[]) {
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]).filter(
    (key) => !SKIP.test(key) && key !== "id" && key !== "dbId",
  );

  const cell = (value: unknown) => {
    if (value === null || value === undefined) return "";
    let text = String(value);

    /*
     * A spreadsheet reads a leading =, +, - or @ as the start of a formula, so
     * a supplier called "=cmd|..." would run on the machine of whoever opens
     * the file. Quoting does not help — Excel strips the quotes first — but a
     * leading apostrophe makes the cell literal text.
     */
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
  ].join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ board: string }> },
) {
  // Route handlers sit outside the page tree, so the session is checked here
  // too rather than relying on the proxy's cookie sniff. An export is the same
  // data the board shows, so it answers to the same capability the board does
  // — going through `can` rather than settling for "signed in" keeps the file
  // and the screen in step if those reading rights are ever narrowed.
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!can(user.role, "farm:read")) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const { board } = await params;
  // `BOARDS[board]` alone would find `toString` and the rest of the prototype,
  // which are truthy and would sail past the guard below as if they were
  // loaders.
  const load = Object.hasOwn(BOARDS, board) ? BOARDS[board] : undefined;
  if (!load) {
    return NextResponse.json({ error: "Unknown board." }, { status: 404 });
  }

  const rows = await load(request.nextUrl.searchParams);

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${board}-${todayIso()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
