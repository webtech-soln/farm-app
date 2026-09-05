/**
 * Seeds a working Jayda Farms dataset.
 *
 * Figures match the design boards, but every date is anchored to the day the
 * seed runs rather than a fixed calendar date — otherwise "today" panels such
 * as the dashboard and daily records would render empty.
 */
import { hashPassword } from "../auth/password";
import { CURRENCY_LABEL } from "../currency";

import { db, pool } from "./index";
import { toIsoDate } from "../date";
import { resetDatabase } from "./reset";
import {
  customers,
  dailyRecords,
  deliveries,
  eggCollections,
  expenses,
  farmSettings,
  flocks,
  healthEvents,
  houseReadings,
  houses,
  inventoryItems,
  inventoryMovements,
  mortalityRecords,
  notificationPreferences,
  notifications,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  reports,
  suppliers,
  tasks,
  users,
  vaccinations,
  weightRecords,
} from "./schema";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/** `YYYY-MM-DD`, `offset` days before today, in local time. */
function day(offset: number): string {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

/** A timestamp `offset` days ago at `HH:MM` local time. */
function at(offset: number, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(TODAY);
  date.setDate(date.getDate() - offset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** First day of the month `offset` months back, as `YYYY-MM-DD`. */
function monthStart(offset: number): string {
  const date = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1);
  return toIsoDate(date);
}

async function seed() {
  console.log("Clearing existing data…");
  await resetDatabase();

  /* ---------------------------------------------------------------- Users */

  const password = await hashPassword("farmpassword");

  const staff = await db
    .insert(users)
    .values([
      {
        name: "Johnson Adjei",
        email: "johnson@jaydafarms.com",
        passwordHash: password,
        role: "owner",
        jobTitle: "Farm Owner",
        phone: "+233244294382",
        assignedArea: "All houses",
        attendancePct: 100,
        dutyStatus: "on_duty",
        joinedOn: "2022-05-02",
      },
      {
        name: "Amina Okoro",
        email: "amina@jaydafarms.com",
        passwordHash: password,
        role: "supervisor",
        jobTitle: "Farm Supervisor",
        phone: "+234 802 331 7741",
        assignedArea: "House 01 · House 02",
        attendancePct: 98,
        dutyStatus: "on_duty",
        joinedOn: "2024-03-04",
      },
      {
        name: "Tunde Bello",
        email: "tunde@jaydafarms.com",
        passwordHash: password,
        role: "attendant",
        jobTitle: "Poultry Attendant",
        phone: "+234 803 118 2290",
        assignedArea: "House 03",
        attendancePct: 94,
        dutyStatus: "on_duty",
        joinedOn: "2024-08-12",
      },
      {
        name: "Dr. Chike Eze",
        email: "chike@jaydafarms.com",
        passwordHash: password,
        role: "vet",
        jobTitle: "Veterinarian",
        phone: "+234 807 550 6612",
        assignedArea: "All houses",
        dutyStatus: "visiting",
        isContractor: true,
      },
      {
        name: "Grace Amadi",
        email: "grace@jaydafarms.com",
        passwordHash: password,
        role: "attendant",
        jobTitle: "Poultry Attendant",
        phone: "+234 805 227 8834",
        assignedArea: "House 04 · House 05",
        attendancePct: 96,
        dutyStatus: "on_duty",
        joinedOn: "2025-01-20",
      },
      {
        name: "Musa Danjuma",
        email: "musa@jaydafarms.com",
        passwordHash: password,
        role: "driver",
        jobTitle: "Driver",
        phone: "+234 806 449 1130",
        assignedArea: "Logistics",
        attendancePct: 92,
        dutyStatus: "on_road",
        joinedOn: "2023-06-15",
      },
      {
        name: "Blessing Ojo",
        email: "blessing@jaydafarms.com",
        passwordHash: password,
        role: "sales",
        jobTitle: "Sales Officer",
        phone: "+234 809 662 0075",
        assignedArea: "Sales & CRM",
        attendancePct: 89,
        dutyStatus: "on_leave",
        joinedOn: "2025-02-03",
      },
      {
        name: "Ifeanyi Nwosu",
        email: "ifeanyi@jaydafarms.com",
        passwordHash: password,
        role: "driver",
        jobTitle: "Driver",
        phone: "+234 808 771 4410",
        assignedArea: "Logistics",
        attendancePct: 91,
        dutyStatus: "on_road",
        joinedOn: "2024-11-11",
      },
    ])
    .returning({ id: users.id, name: users.name });

  const byName = Object.fromEntries(
    staff.map((person) => [person.name, person.id]),
  ) as Record<string, number>;

  /**
   * Looked up by name, so a typo or a rename stops the seed here rather than
   * quietly handing `undefined` to every row that referenced the person. Most
   * of the columns these ids land in are nullable, so a missing name does not
   * fail — it writes NULL attribution across hundreds of records and only
   * surfaces at the one NOT NULL column, hundreds of lines later.
   */
  const person = (name: string) => {
    const id = byName[name];
    if (id === undefined) {
      throw new Error(
        `Seed refers to "${name}", who is not in the staff list. ` +
          `Known: ${Object.keys(byName).join(", ")}`,
      );
    }
    return id;
  };

  const JOHNSON = person("Johnson Adjei");
  const AMINA = person("Amina Okoro");
  const TUNDE = person("Tunde Bello");
  const CHIKE = person("Dr. Chike Eze");
  const GRACE = person("Grace Amadi");
  const MUSA = person("Musa Danjuma");
  const BLESSING = person("Blessing Ojo");
  const IFEANYI = person("Ifeanyi Nwosu");

  console.log(`Seeded ${staff.length} users.`);

  /* ------------------------------------------------------------- Settings */

  await db.insert(farmSettings).values({
    id: 1,
    farmName: "Jayda Farms",
    registeredName: "Jayda Agro Ventures Ltd",
    estateName: "Kumasi Estate",
    address: "Km 12 Kumasi - Accra Road",
    cityState: "Kumasi, Ashanti Region",
    country: "Ghana",
    timezone: "(GMT+1) West Africa",
    currency: CURRENCY_LABEL,
    weightUnit: "Kilograms (kg)",
    temperatureUnit: "Celsius (°C)",
    volumeUnit: "Litres (L)",
    dateFormat: "DD MMM YYYY",
  });

  /* --------------------------------------------------------------- Houses */

  const houseRows = await db
    .insert(houses)
    .values([
      { code: "house-01", name: "House 01", capacity: 5000, status: "healthy" },
      { code: "house-02", name: "House 02", capacity: 5000, status: "healthy" },
      // Houses two layer flocks (JF-2026-003 and JF-2026-007), hence the
      // larger capacity than its neighbours.
      { code: "house-03", name: "House 03", capacity: 7000, status: "warning" },
      { code: "house-04", name: "House 04", capacity: 4500, status: "healthy" },
      { code: "house-05", name: "House 05", capacity: 3500, status: "brooding" },
      { code: "house-06", name: "House 06", capacity: 3500, status: "healthy" },
    ])
    .returning({ id: houses.id, code: houses.code });

  const H = Object.fromEntries(
    houseRows.map((house) => [house.code, house.id]),
  ) as Record<string, number>;

  /* --------------------------------------------------------------- Flocks */

  const flockRows = await db
    .insert(flocks)
    .values([
      {
        code: "JF-2026-001",
        houseId: H["house-01"],
        type: "broiler",
        breed: "Cobb 500",
        initialCount: 4900,
        currentCount: 4820,
        startedOn: day(32),
        status: "healthy",
        sourceHatchery: "Amo Hatchery",
      },
      {
        code: "JF-2026-002",
        houseId: H["house-02"],
        type: "broiler",
        breed: "Ross 308",
        initialCount: 5000,
        currentCount: 4950,
        startedOn: day(29),
        status: "healthy",
        sourceHatchery: "Amo Hatchery",
      },
      {
        code: "JF-2026-003",
        houseId: H["house-03"],
        type: "layer",
        breed: "Isa Brown",
        initialCount: 4700,
        currentCount: 4600,
        startedOn: day(147),
        status: "warning",
        sourceHatchery: "CHI Farms",
      },
      {
        code: "JF-2026-004",
        houseId: H["house-04"],
        type: "layer",
        breed: "Lohmann",
        initialCount: 4240,
        currentCount: 4180,
        startedOn: day(238),
        status: "healthy",
        sourceHatchery: "CHI Farms",
      },
      {
        code: "JF-2026-005",
        houseId: H["house-05"],
        type: "broiler",
        breed: "Cobb 500",
        initialCount: 3320,
        currentCount: 3300,
        startedOn: day(11),
        status: "brooding",
        sourceHatchery: "Amo Hatchery",
      },
      {
        code: "JF-2026-006",
        houseId: H["house-06"],
        type: "broiler",
        breed: "Ross 308",
        initialCount: 3050,
        currentCount: 3000,
        startedOn: day(21),
        status: "healthy",
        sourceHatchery: "Amo Hatchery",
      },
      {
        code: "JF-2026-007",
        houseId: H["house-03"],
        type: "layer",
        breed: "Isa Brown",
        initialCount: 2100,
        currentCount: 2040,
        startedOn: day(189),
        status: "treatment",
        sourceHatchery: "CHI Farms",
      },
      {
        code: "JF-2025-014",
        houseId: H["house-02"],
        type: "broiler",
        breed: "Cobb 500",
        initialCount: 4800,
        currentCount: 0,
        startedOn: day(120),
        closedOn: day(40),
        status: "closed",
        sourceHatchery: "Amo Hatchery",
      },
    ])
    .returning({ id: flocks.id, code: flocks.code });

  const F = Object.fromEntries(
    flockRows.map((flock) => [flock.code, flock.id]),
  ) as Record<string, number>;

  console.log(`Seeded ${houseRows.length} houses and ${flockRows.length} flocks.`);

  /* ------------------------------------------------------- House readings */

  const readingHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const baseCurve = [25, 24, 24, 26, 28, 30, 32, 33, 31, 29, 27, 26];
  const tempOffset: Record<string, number> = {
    "house-01": 0,
    "house-02": 1,
    "house-03": 3,
    "house-04": -1,
    "house-05": 5,
    "house-06": 0,
  };

  await db.insert(houseReadings).values(
    houseRows.flatMap((house) =>
      Array.from({ length: 7 }, (_, offset) =>
        readingHours.map((hour, index) => ({
          houseId: house.id,
          recordedAt: at(offset, `${String(hour).padStart(2, "0")}:00`),
          temperatureC:
            baseCurve[index] + tempOffset[house.code] + (offset % 3 === 0 ? 0.5 : -0.5),
          humidityPct: 62 + ((index + offset) % 5) * 3,
        })),
      ).flat(),
    ),
  );

  /* --------------------------------------------------------- Daily records */

  const activeHouses = [
    { code: "house-01", flock: "JF-2026-001", birds: 4820, feed: 620, temp: [24, 33], humidity: 68, layer: false },
    { code: "house-02", flock: "JF-2026-002", birds: 4950, feed: 640, temp: [24, 30], humidity: 65, layer: false },
    { code: "house-03", flock: "JF-2026-003", birds: 4600, feed: 510, temp: [26, 34], humidity: 74, layer: true },
    { code: "house-04", flock: "JF-2026-004", birds: 4180, feed: 470, temp: [23, 29], humidity: 70, layer: true },
    { code: "house-05", flock: "JF-2026-005", birds: 3300, feed: 180, temp: [30, 34], humidity: 61, layer: false },
    { code: "house-06", flock: "JF-2026-006", birds: 3000, feed: 390, temp: [24, 30], humidity: 66, layer: false },
  ] as const;

  const dailyRows = activeHouses.flatMap((house) =>
    Array.from({ length: 14 }, (_, offset) => {
      const deaths = 2 + ((offset * 3 + house.birds) % 6);
      const culls = offset % 5 === 0 ? 1 : 0;
      const starting = house.birds + offset * 5;
      const feed = house.feed - (offset % 4) * 12;
      return {
        houseId: H[house.code],
        flockId: F[house.flock],
        recordDate: day(offset),
        startingBirds: starting,
        deaths,
        culls,
        transfersOut: 0,
        closingBirds: starting - deaths - culls,
        feedKg: feed,
        feedType: house.layer ? "Layer mash" : "Broiler finisher",
        feedBatch: house.layer ? "LM-0921" : "FB-1182",
        waterLitres: Math.round(feed * 1.6),
        tempMinC: house.temp[0],
        tempMaxC: house.temp[1] - (offset % 3),
        humidityPct: house.humidity,
        ventilation: `Level ${2 + (offset % 2)}`,
        eggsCollected: house.layer ? 9000 - offset * 60 : null,
        eggsBroken: house.layer ? 110 - offset : null,
        avgWeightKg: house.layer ? null : Number((1.45 - offset * 0.03).toFixed(2)),
        sampleSize: house.layer ? null : 50,
        uniformityPct: house.layer ? null : 88,
        notes:
          offset === 0 && house.code === "house-01"
            ? "Two mortalities linked to heat stress around 14:00. Ventilation raised to level 3 and extra water lines opened."
            : null,
        status: offset === 0 ? ("draft" as const) : ("submitted" as const),
        recordedById: house.layer ? GRACE : AMINA,
      };
    }),
  );

  await db.insert(dailyRecords).values(dailyRows);
  console.log(`Seeded ${dailyRows.length} daily records.`);

  /* ------------------------------------------------------------ Mortality */

  const mortalityHeadlines = [
    { offset: 0, time: "08:12", flock: "JF-2026-001", house: "house-01", deaths: 7, cause: "Heat stress", status: "reviewed" as const, by: AMINA },
    { offset: 0, time: "08:40", flock: "JF-2026-003", house: "house-03", deaths: 9, cause: "Suspected coccidiosis", status: "escalated" as const, by: TUNDE },
    { offset: 0, time: "09:05", flock: "JF-2026-006", house: "house-06", deaths: 3, cause: "Injury", status: "reviewed" as const, by: AMINA },
    { offset: 1, time: "17:20", flock: "JF-2026-007", house: "house-03", deaths: 11, cause: "Respiratory infection", status: "under_treatment" as const, by: CHIKE },
    { offset: 1, time: "08:15", flock: "JF-2026-002", house: "house-02", deaths: 5, cause: "Heat stress", status: "reviewed" as const, by: GRACE },
    { offset: 2, time: "16:45", flock: "JF-2026-004", house: "house-04", deaths: 4, cause: "Culling (low producer)", status: "reviewed" as const, by: GRACE },
  ];

  const causeCycle = ["Heat stress", "Disease", "Injury", "Culling", "Unknown"];

  const mortalityHistory = Array.from({ length: 14 }, (_, offset) =>
    activeHouses.map((house, index) => ({
      flockId: F[house.flock],
      houseId: H[house.code],
      occurredOn: day(offset + 3),
      occurredAt: `0${7 + (index % 3)}:${String(10 + index * 7).padStart(2, "0")}`,
      deaths: 2 + ((offset + index) % 5),
      cause: causeCycle[(offset + index) % causeCycle.length],
      status: "reviewed" as const,
      recordedById: house.layer ? GRACE : AMINA,
    })),
  ).flat();

  // The closed flock's losses stay on record after the birds are sold, which
  // is what its lifetime mortality percentage is derived from.
  const closedFlockMortality = Array.from({ length: 8 }, (_, week) => ({
    flockId: F["JF-2025-014"],
    houseId: H["house-02"],
    occurredOn: day(40 + week * 7),
    occurredAt: "08:00",
    deaths: [22, 18, 15, 14, 13, 12, 11, 10][week],
    cause: causeCycle[week % causeCycle.length],
    status: "reviewed" as const,
    recordedById: AMINA,
  }));

  await db.insert(mortalityRecords).values([
    ...closedFlockMortality,
    ...mortalityHeadlines.map((entry) => ({
      flockId: F[entry.flock],
      houseId: H[entry.house],
      occurredOn: day(entry.offset),
      occurredAt: entry.time,
      deaths: entry.deaths,
      cause: entry.cause,
      status: entry.status,
      recordedById: entry.by,
    })),
    ...mortalityHistory,
  ]);

  /* -------------------------------------------------------------- Weights */

  const weightSeries = [
    { ageDays: 7, actual: 0.18, standard: 0.18 },
    { ageDays: 11, actual: 0.43, standard: 0.4 },
    { ageDays: 14, actual: 0.55, standard: 0.53 },
    { ageDays: 18, actual: 0.78, standard: 0.75 },
    { ageDays: 21, actual: 0.98, standard: 0.95 },
    { ageDays: 25, actual: 1.14, standard: 1.13 },
    { ageDays: 28, actual: 1.3, standard: 1.28 },
    { ageDays: 32, actual: 1.45, standard: 1.39 },
  ];

  await db.insert(weightRecords).values([
    ...weightSeries.map((point) => ({
      flockId: F["JF-2026-001"],
      houseId: H["house-01"],
      recordedOn: day(32 - point.ageDays),
      ageDays: point.ageDays,
      avgWeightKg: point.actual,
      standardWeightKg: point.standard,
      sampleSize: 50,
      uniformityPct: 86 + (point.ageDays % 4),
      recordedById: AMINA,
    })),
    ...weightSeries.slice(0, 6).map((point) => ({
      flockId: F["JF-2026-002"],
      houseId: H["house-02"],
      recordedOn: day(29 - point.ageDays),
      ageDays: point.ageDays,
      avgWeightKg: Number((point.actual * 0.92).toFixed(2)),
      standardWeightKg: point.standard,
      sampleSize: 50,
      uniformityPct: 85,
      recordedById: AMINA,
    })),
    ...weightSeries.slice(0, 5).map((point) => ({
      flockId: F["JF-2026-006"],
      houseId: H["house-06"],
      recordedOn: day(21 - point.ageDays),
      ageDays: point.ageDays,
      avgWeightKg: Number((point.actual * 0.88).toFixed(2)),
      standardWeightKg: point.standard,
      sampleSize: 40,
      uniformityPct: 84,
      recordedById: GRACE,
    })),
  ]);

  /* ------------------------------------------------------ Egg collections */

  const eggSessions = [
    { session: "morning" as const, time: "07:00", share: 0.46 },
    { session: "midday" as const, time: "11:30", share: 0.33 },
    { session: "evening" as const, time: "16:00", share: 0.21 },
  ];

  const layerHouses = [
    { code: "house-03", flock: "JF-2026-003", base: 9080, by: TUNDE },
    { code: "house-04", flock: "JF-2026-004", base: 8580, by: GRACE },
  ];

  const eggRows = Array.from({ length: 14 }, (_, offset) =>
    layerHouses.flatMap((house) =>
      eggSessions.map(({ session, time, share }) => {
        const collected = Math.round((house.base - offset * 55) * share);
        const broken = Math.round(collected * 0.014);
        const gradeA = Math.round(collected * 0.72);
        const gradeB = Math.round(collected * 0.22);
        return {
          houseId: H[house.code],
          flockId: F[house.flock],
          collectedOn: day(offset),
          collectedAt: time,
          session,
          collected,
          broken,
          gradeA,
          gradeB,
          rejected: collected - gradeA - gradeB,
          sizeSmall: Math.round(collected * 0.1),
          sizeMedium: Math.round(collected * 0.24),
          sizeLarge: Math.round(collected * 0.4),
          sizeExtraLarge: Math.round(collected * 0.2),
          status:
            offset === 0 && session === "evening"
              ? ("pending_sync" as const)
              : ("synced" as const),
          recordedById: house.by,
        };
      }),
    ),
  ).flat();

  await db.insert(eggCollections).values(eggRows);
  console.log(`Seeded ${eggRows.length} egg collections.`);

  /* --------------------------------------------------------------- Health */

  await db.insert(healthEvents).values([
    {
      flockId: F["JF-2026-003"],
      houseId: H["house-03"],
      occurredOn: day(0),
      condition: "Suspected coccidiosis",
      cases: 9,
      treatment: "Awaiting diagnosis",
      status: "escalated",
      reportedById: TUNDE,
      notes: "9 birds lost in 24h. Vet review requested.",
    },
    {
      flockId: F["JF-2026-007"],
      houseId: H["house-03"],
      occurredOn: day(2),
      condition: "Respiratory infection",
      cases: 11,
      treatment: "Tylosin · day 3 of 5",
      status: "in_treatment",
      reportedById: CHIKE,
    },
    {
      flockId: F["JF-2026-001"],
      houseId: H["house-01"],
      occurredOn: day(4),
      condition: "Heat stress",
      cases: 6,
      treatment: "Electrolytes + ventilation",
      status: "resolved",
      resolvedOn: day(2),
      reportedById: AMINA,
    },
    {
      flockId: F["JF-2026-004"],
      houseId: H["house-04"],
      occurredOn: day(8),
      condition: "Injury (pecking)",
      cases: 4,
      treatment: "Isolation + antiseptic",
      status: "resolved",
      resolvedOn: day(5),
      reportedById: GRACE,
    },
    {
      flockId: F["JF-2026-006"],
      houseId: H["house-06"],
      occurredOn: day(12),
      condition: "Coccidiosis",
      cases: 14,
      treatment: "Amprolium · completed",
      status: "resolved",
      resolvedOn: day(6),
      reportedById: CHIKE,
    },
  ]);

  await db.insert(vaccinations).values([
    {
      flockId: F["JF-2026-002"],
      houseId: H["house-02"],
      vaccine: "Gumboro (booster)",
      route: "Drinking water",
      scheduledOn: day(-1),
      scheduledAt: "08:00",
      administeredById: CHIKE,
      doses: 4950,
      status: "scheduled",
    },
    {
      flockId: F["JF-2026-007"],
      houseId: H["house-03"],
      vaccine: "Fowl typhoid",
      route: "Subcutaneous",
      scheduledOn: day(4),
      doses: 2040,
      status: "overdue",
    },
    {
      flockId: F["JF-2026-003"],
      houseId: H["house-03"],
      vaccine: "Fowl pox",
      route: "Wing web",
      scheduledOn: day(-3),
      scheduledAt: "09:00",
      administeredById: CHIKE,
      doses: 4600,
      status: "scheduled",
    },
    {
      flockId: F["JF-2026-001"],
      houseId: H["house-01"],
      vaccine: "Newcastle (Lasota)",
      route: "Eye drop",
      scheduledOn: day(5),
      administeredAt: at(5, "08:20"),
      administeredById: CHIKE,
      doses: 4830,
      status: "completed",
    },
    {
      flockId: F["JF-2026-006"],
      houseId: H["house-06"],
      vaccine: "Gumboro (primary)",
      route: "Drinking water",
      scheduledOn: day(3),
      administeredAt: at(3, "07:50"),
      administeredById: GRACE,
      doses: 3010,
      status: "completed",
    },
    {
      flockId: null,
      houseId: null,
      vaccine: "Deworming",
      route: "Oral",
      scheduledOn: day(-5),
      scheduledAt: "07:00",
      administeredById: AMINA,
      doses: 24850,
      status: "scheduled",
    },
    {
      flockId: F["JF-2026-005"],
      houseId: H["house-05"],
      vaccine: "Newcastle (Lasota)",
      route: "Eye drop",
      scheduledOn: day(-9),
      scheduledAt: "08:00",
      doses: 3300,
      status: "scheduled",
    },
    {
      flockId: F["JF-2026-004"],
      houseId: H["house-04"],
      vaccine: "Infectious bronchitis",
      route: "Spray",
      scheduledOn: day(-12),
      scheduledAt: "08:30",
      doses: 4180,
      status: "scheduled",
    },
  ]);

  /* ------------------------------------------------------------ Suppliers */

  const supplierRows = await db
    .insert(suppliers)
    .values([
      { name: "Amo Feeds Ltd", location: "Abeokuta, Ogun", category: "Feed", contact: "+234 802 114 9920", status: "active", outstandingCents: 186_000 },
      { name: "Hybrid Nutrition", location: "Ibadan, Oyo", category: "Feed", contact: "+234 803 552 1187", status: "active", outstandingCents: 0 },
      { name: "VetPro Nigeria", location: "Lagos", category: "Medicine", contact: "+234 807 442 0031", status: "active", outstandingCents: 98_000 },
      { name: "Delta Minerals", location: "Warri, Delta", category: "Supplement", contact: "+234 806 771 2244", status: "active", outstandingCents: 0 },
      { name: "Ogun Packaging Co.", location: "Sagamu, Ogun", category: "Packaging", contact: "+234 805 330 8891", status: "overdue", outstandingCents: 148_000, overdueDays: 12 },
      { name: "AgriTech Equipment", location: "Lagos", category: "Equipment", contact: "+234 809 220 6612", status: "inactive", outstandingCents: 0 },
      { name: "Ogun Power", location: "Abeokuta, Ogun", category: "Utilities", contact: "+234 801 447 2210", status: "active", outstandingCents: 0 },
      { name: "AutoFix Ogun", location: "Abeokuta, Ogun", category: "Maintenance", contact: "+234 802 664 1180", status: "active", outstandingCents: 0 },
      { name: "Zoetis", location: "Lagos", category: "Medicine", contact: "+234 806 220 4471", status: "active", outstandingCents: 0 },
      { name: "AgriTech Ltd", location: "Lagos", category: "Disinfectant", contact: "+234 809 220 6613", status: "active", outstandingCents: 0 },
    ])
    .returning({ id: suppliers.id, name: suppliers.name });

  const S = Object.fromEntries(
    supplierRows.map((supplier) => [supplier.name, supplier.id]),
  ) as Record<string, number>;

  /* ------------------------------------------------------------ Inventory */

  const inventoryRows = await db
    .insert(inventoryItems)
    .values([
      { sku: "FD-1182", name: "Broiler Finisher Feed", category: "feed", subcategory: "Broiler", quantity: 1500, unit: "kg", unitCostCents: 62, minStock: 800, batch: "FB-1182", expiryDate: day(-64), supplierId: S["Amo Feeds Ltd"] },
      { sku: "FD-1104", name: "Broiler Starter Feed", category: "feed", subcategory: "Broiler", quantity: 1100, unit: "kg", unitCostCents: 68, minStock: 800, batch: "FB-1104", expiryDate: day(-80), supplierId: S["Amo Feeds Ltd"] },
      { sku: "FD-0921", name: "Layer Mash", category: "feed", subcategory: "Layer", quantity: 1300, unit: "kg", unitCostCents: 58, minStock: 1200, batch: "LM-0921", expiryDate: day(-70), supplierId: S["Hybrid Nutrition"] },
      { sku: "FD-0810", name: "Grower Mash", category: "feed", subcategory: "Grower", quantity: 900, unit: "kg", unitCostCents: 55, minStock: 1000, batch: "GM-0810", expiryDate: day(-87), supplierId: S["Hybrid Nutrition"] },
      { sku: "FD-0455", name: "Chick Crumbs", category: "feed", subcategory: "Starter", quantity: 420, unit: "kg", unitCostCents: 74, minStock: 300, batch: "CC-0455", expiryDate: day(-95), supplierId: S["Amo Feeds Ltd"] },
      { sku: "FD-0212", name: "Oyster Shell Grit", category: "feed", subcategory: "Supplement", quantity: 180, unit: "kg", unitCostCents: 31, minStock: 150, batch: "OS-0212", supplierId: S["Delta Minerals"] },

      { sku: "MD-0341", name: "Newcastle Vaccine (Lasota)", category: "medicine", subcategory: "Vaccine", quantity: 12, unit: "vials", unitCostCents: 1450, minStock: 10, batch: "NCD-2411", expiryDate: day(-19), supplierId: S["VetPro Nigeria"] },
      { sku: "MD-0288", name: "Coccidiostat Premix", category: "medicine", subcategory: "Antibiotic", quantity: 8, unit: "kg", unitCostCents: 3100, minStock: 12, batch: "CCP-0288", expiryDate: day(-10), supplierId: S["VetPro Nigeria"] },
      { sku: "MD-1180", name: "Tylosin Soluble Powder", category: "medicine", subcategory: "Antibiotic", quantity: 14, unit: "sachets", unitCostCents: 820, minStock: 8, batch: "TYL-1180", expiryDate: day(-207), supplierId: S["VetPro Nigeria"] },
      { sku: "MD-0921", name: "Gumboro Vaccine", category: "medicine", subcategory: "Vaccine", quantity: 6, unit: "vials", unitCostCents: 1680, minStock: 10, batch: "GMB-0921", expiryDate: day(-125), supplierId: S["Zoetis"] },
      { sku: "MD-0455", name: "Multivitamin Electrolyte", category: "medicine", subcategory: "Vitamin", quantity: 22, unit: "kg", unitCostCents: 540, minStock: 10, batch: "MVE-0455", expiryDate: day(-325), supplierId: S["Delta Minerals"] },
      { sku: "MD-0710", name: "Iodine Disinfectant", category: "medicine", subcategory: "Disinfectant", quantity: 9, unit: "litres", unitCostCents: 610, minStock: 6, batch: "IOD-0710", expiryDate: day(-527), supplierId: S["AgriTech Ltd"] },

      { sku: "PK-0022", name: "Egg Trays (30-cell)", category: "packaging", quantity: 4200, unit: "units", unitCostCents: 9, minStock: 1000, supplierId: S["Ogun Packaging Co."] },
      { sku: "EQ-0114", name: "Automatic Drinkers", category: "equipment", quantity: 36, unit: "units", unitCostCents: 2200, minStock: 10, supplierId: S["AgriTech Equipment"] },
      { sku: "CS-0507", name: "Wood Shavings (bale)", category: "consumable", quantity: 140, unit: "bales", unitCostCents: 180, minStock: 60, supplierId: S["Ogun Packaging Co."] },
    ])
    .returning({ id: inventoryItems.id, sku: inventoryItems.sku });

  const I = Object.fromEntries(
    inventoryRows.map((item) => [item.sku, item.id]),
  ) as Record<string, number>;

  // Eight weeks of stock movement so the Inventory chart has real history.
  const stockIn = [7725, 8550, 7125, 9750, 8250, 9000, 10500, 9225];
  const stockOut = [6975, 7425, 7725, 7575, 8100, 8325, 8625, 8850];

  await db.insert(inventoryMovements).values(
    stockIn.flatMap((inbound, week) => [
      {
        itemId: I["FD-1182"],
        type: "stock_in" as const,
        quantity: inbound,
        unitCostCents: 62,
        occurredOn: day((7 - week) * 7 + 3),
        reference: `GRN-${1100 + week}`,
        createdById: AMINA,
      },
      {
        itemId: I["FD-1182"],
        type: "stock_out" as const,
        quantity: stockOut[week],
        occurredOn: day((7 - week) * 7),
        reference: "Daily feed issue",
        createdById: AMINA,
      },
    ]),
  );

  console.log(`Seeded ${inventoryRows.length} inventory items.`);

  /* ------------------------------------------------------------- Products */

  const productRows = await db
    .insert(products)
    .values([
      { name: "Live Birds", category: "Poultry", icon: "package", priceCents: 640, costCents: 436, unit: "per bird", availableQty: 2480, availableUnit: "available", status: "in_stock", note: "+14% demand" },
      { name: "Table Eggs", category: "Eggs", icon: "egg", priceCents: 310, costCents: 195, unit: "per crate", availableQty: 612, availableUnit: "crates", status: "in_stock", note: "+6% demand" },
      { name: "Day-old Chicks", category: "Poultry", icon: "bird", priceCents: 120, costCents: 88, unit: "per chick", availableQty: 0, availableUnit: "available", status: "out_of_stock", note: "Restock 18 Aug" },
      { name: "Manure (bagged)", category: "By-product", icon: "sprout", priceCents: 280, costCents: 74, unit: "per bag", availableQty: 340, availableUnit: "bags", status: "in_stock", note: "Steady" },
      { name: "Spent Layers", category: "Poultry", icon: "layers", priceCents: 420, costCents: 287, unit: "per bird", availableQty: 180, availableUnit: "birds", status: "low_stock", note: "Cull batch due" },
      { name: "Processed Chicken", category: "Processed", icon: "beef", priceCents: 960, costCents: 695, unit: "per kg", availableQty: 420, availableUnit: "kg", status: "in_stock", note: "+22% demand" },
    ])
    .returning({ id: products.id, name: products.name });

  const P = Object.fromEntries(
    productRows.map((product) => [product.name, product.id]),
  ) as Record<string, number>;

  /* ------------------------------------------------------------ Customers */

  const customerRows = await db
    .insert(customers)
    .values([
      { name: "Mama Ngozi Foods", type: "wholesaler", location: "Abeokuta", phone: "+234 802 114 9920", status: "active" },
      { name: "Sunrise Supermarket", type: "retailer", location: "Lagos", phone: "+234 803 220 1147", status: "active" },
      { name: "Chop Life Restaurant", type: "restaurant", location: "Ibadan", phone: "+234 805 771 3320", status: "active" },
      { name: "Kola Poultry Traders", type: "wholesaler", location: "Sagamu", phone: "+234 807 118 9930", status: "overdue" },
      { name: "Blessed Mart", type: "retailer", location: "Ogun", phone: "+234 806 449 2280", status: "active" },
      { name: "Grace Adeyemi", type: "walk_in", location: "Ogun", phone: "+234 809 337 5510", status: "dormant" },
    ])
    .returning({ id: customers.id, name: customers.name });

  const C = Object.fromEntries(
    customerRows.map((customer) => [customer.name, customer.id]),
  ) as Record<string, number>;

  /* --------------------------------------------------------------- Orders */

  type SeedOrder = {
    reference: string;
    customer: string;
    offset: number;
    time: string;
    status: (typeof orders.$inferInsert)["status"];
    paymentStatus: (typeof orders.$inferInsert)["paymentStatus"];
    deliveryMethod: (typeof orders.$inferInsert)["deliveryMethod"];
    deliveryFeeCents: number;
    lines: Array<{ product: string; quantity: number }>;
    paid?: {
      amountCents: number;
      method: NonNullable<(typeof payments.$inferInsert)["method"]>;
    };
  };

  const seedOrders: SeedOrder[] = [
    {
      reference: "ORD-2841",
      customer: "Mama Ngozi Foods",
      offset: 0,
      time: "10:22",
      status: "delivered",
      paymentStatus: "paid",
      deliveryMethod: "own_fleet",
      deliveryFeeCents: 120,
      lines: [
        { product: "Table Eggs", quantity: 40 },
        { product: "Live Birds", quantity: 45 },
        { product: "Manure (bagged)", quantity: 26 },
      ],
      paid: { amountCents: 48_600, method: "bank_transfer" },
    },
    {
      reference: "ORD-2840",
      customer: "Sunrise Supermarket",
      offset: 0,
      time: "09:41",
      status: "in_transit",
      paymentStatus: "paid",
      deliveryMethod: "own_fleet",
      deliveryFeeCents: 0,
      lines: [{ product: "Table Eggs", quantity: 100 }],
      paid: { amountCents: 31_000, method: "bank_transfer" },
    },
    {
      reference: "ORD-2839",
      customer: "Chop Life Restaurant",
      offset: 1,
      time: "16:05",
      status: "preparing",
      paymentStatus: "partial",
      deliveryMethod: "pickup",
      deliveryFeeCents: 0,
      lines: [
        { product: "Processed Chicken", quantity: 60 },
        { product: "Live Birds", quantity: 25 },
      ],
      paid: { amountCents: 30_000, method: "part_cash" },
    },
    {
      reference: "ORD-2838",
      customer: "Kola Poultry Traders",
      offset: 1,
      time: "11:30",
      status: "pending",
      paymentStatus: "unpaid",
      deliveryMethod: "third_party",
      deliveryFeeCents: 0,
      lines: [
        { product: "Live Birds", quantity: 150 },
        { product: "Spent Layers", quantity: 68 },
      ],
    },
    {
      reference: "ORD-2837",
      customer: "Blessed Mart",
      offset: 2,
      time: "15:12",
      status: "delivered",
      paymentStatus: "paid",
      deliveryMethod: "own_fleet",
      deliveryFeeCents: 0,
      lines: [
        { product: "Table Eggs", quantity: 120 },
        { product: "Manure (bagged)", quantity: 55 },
      ],
      paid: { amountCents: 52_800, method: "bank_transfer" },
    },
    {
      reference: "ORD-2836",
      customer: "Grace Adeyemi",
      offset: 2,
      time: "08:55",
      status: "delivered",
      paymentStatus: "paid",
      deliveryMethod: "pickup",
      deliveryFeeCents: 0,
      lines: [{ product: "Live Birds", quantity: 15 }],
      paid: { amountCents: 9_600, method: "cash" },
    },
    {
      reference: "ORD-2835",
      customer: "Sunrise Supermarket",
      offset: 3,
      time: "14:20",
      status: "cancelled",
      paymentStatus: "refunded",
      deliveryMethod: "own_fleet",
      deliveryFeeCents: 0,
      lines: [{ product: "Table Eggs", quantity: 200 }],
    },
    {
      reference: "ORD-2834",
      customer: "Blessed Mart",
      offset: 3,
      time: "09:10",
      status: "delivered",
      paymentStatus: "paid",
      deliveryMethod: "own_fleet",
      deliveryFeeCents: 0,
      lines: [{ product: "Processed Chicken", quantity: 30 }],
      paid: { amountCents: 28_800, method: "bank_transfer" },
    },
    {
      reference: "ORD-2833",
      customer: "Chop Life Restaurant",
      offset: 4,
      time: "10:05",
      status: "delivered",
      paymentStatus: "paid",
      deliveryMethod: "third_party",
      deliveryFeeCents: 0,
      lines: [{ product: "Processed Chicken", quantity: 30 }],
      paid: { amountCents: 28_800, method: "cash" },
    },
    // Standing daily egg orders — these give the production chart its
    // "eggs sold" series across the week.
    ...[4, 5, 6, 3, 1].map((offset, index) => ({
      reference: `ORD-28${28 + index}`,
      customer: index % 2 === 0 ? "Sunrise Supermarket" : "Mama Ngozi Foods",
      offset,
      time: "08:30",
      status: "delivered" as const,
      paymentStatus: "paid" as const,
      deliveryMethod: "own_fleet" as const,
      deliveryFeeCents: 0,
      lines: [{ product: "Table Eggs", quantity: 520 + index * 35 }],
      paid: {
        amountCents: (520 + index * 35) * 310,
        method: "bank_transfer" as const,
      },
    })),
  ];

  const productPrice: Record<string, number> = {
    "Live Birds": 640,
    "Table Eggs": 310,
    "Day-old Chicks": 120,
    "Manure (bagged)": 280,
    "Spent Layers": 420,
    "Processed Chicken": 960,
  };

  const orderIdByRef: Record<string, number> = {};

  for (const seedOrder of seedOrders) {
    const lines = seedOrder.lines.map((line) => ({
      productName: line.product,
      productId: P[line.product],
      quantity: line.quantity,
      unitPriceCents: productPrice[line.product],
      lineTotalCents: Math.round(line.quantity * productPrice[line.product]),
    }));
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const total = subtotal + seedOrder.deliveryFeeCents;

    const [order] = await db
      .insert(orders)
      .values({
        reference: seedOrder.reference,
        customerId: C[seedOrder.customer],
        placedAt: at(seedOrder.offset, seedOrder.time),
        status: seedOrder.status,
        paymentStatus: seedOrder.paymentStatus,
        deliveryMethod: seedOrder.deliveryMethod,
        subtotalCents: subtotal,
        deliveryFeeCents: seedOrder.deliveryFeeCents,
        totalCents: total,
        createdById: BLESSING,
      })
      .returning({ id: orders.id });

    orderIdByRef[seedOrder.reference] = order.id;

    await db
      .insert(orderItems)
      .values(lines.map((line) => ({ ...line, orderId: order.id, unit: null })));

    const events: Array<typeof orderEvents.$inferInsert> = [
      {
        orderId: order.id,
        kind: "placed",
        title: "Order placed",
        description: "Created by Samuel Adeyemi.",
        occurredAt: at(seedOrder.offset, seedOrder.time),
        createdById: JOHNSON,
      },
    ];

    const paid = seedOrder.paid;
    if (paid) {
      events.push({
        orderId: order.id,
        kind: "payment",
        title: "Payment received",
        description: `$${(paid.amountCents / 100).toFixed(2)} via ${paid.method.replace("_", " ")}.`,
        occurredAt: at(seedOrder.offset, "10:35"),
        createdById: BLESSING,
      });

      await db.insert(payments).values({
        orderId: order.id,
        customerId: C[seedOrder.customer],
        amountCents: paid.amountCents,
        method: paid.method,
        receivedOn: day(seedOrder.offset),
        reference: seedOrder.reference,
        description: seedOrder.lines.map((line) => line.product).join(", "),
        createdById: BLESSING,
      });
    }

    if (seedOrder.status === "delivered") {
      events.push(
        {
          orderId: order.id,
          kind: "packed",
          title: "Ready for dispatch",
          description: "Order packed and quality-checked.",
          occurredAt: at(seedOrder.offset, "11:40"),
        },
        {
          orderId: order.id,
          kind: "transit",
          title: "In transit",
          description: `Driver left the farm with ${seedOrder.lines.length} items.`,
          occurredAt: at(seedOrder.offset, "12:30"),
        },
        {
          orderId: order.id,
          kind: "delivered",
          title: "Delivered",
          description: "Signed proof of delivery uploaded.",
          occurredAt: at(seedOrder.offset, "14:05"),
        },
      );
    }

    await db.insert(orderEvents).values(events);
  }

  console.log(`Seeded ${seedOrders.length} orders.`);

  /* ----------------------------------------------------------- Deliveries */

  await db.insert(deliveries).values([
    { orderId: orderIdByRef["ORD-2840"], driverId: BLESSING, destination: "Ikeja, Lagos", routeName: "Lagos route", scheduledOn: day(0), windowStart: "14:00", windowEnd: "16:00", status: "in_transit", weightKg: 40 },
    { orderId: orderIdByRef["ORD-2839"], driverId: MUSA, destination: "Bodija, Ibadan", routeName: "Ibadan route", scheduledOn: day(0), windowStart: "16:00", windowEnd: "18:00", status: "preparing", weightKg: 120 },
    { orderId: orderIdByRef["ORD-2838"], driverId: IFEANYI, destination: "Sagamu, Ogun", routeName: "Sagamu route", scheduledOn: day(-1), windowStart: "08:00", windowEnd: "10:00", status: "scheduled", weightKg: 210 },
    { orderId: orderIdByRef["ORD-2841"], driverId: MUSA, destination: "Kuto, Abeokuta", routeName: "Abeokuta route", scheduledOn: day(0), windowStart: "12:30", windowEnd: "14:05", status: "delivered", weightKg: 96 },
    { orderId: orderIdByRef["ORD-2834"], driverId: BLESSING, destination: "Ijebu-Ode, Ogun", routeName: "Ogun route", scheduledOn: day(3), windowStart: "09:10", windowEnd: "11:00", status: "delivered", weightKg: 64 },
    { orderId: orderIdByRef["ORD-2833"], driverId: IFEANYI, destination: "Bodija, Ibadan", routeName: "Ibadan route", scheduledOn: day(4), windowStart: "09:00", windowEnd: "11:00", status: "failed", weightKg: 30, attempts: 2, notes: "Failed 2 attempts" },
  ]);

  /* ------------------------------------------------------------- Expenses */

  const headlineExpenses = [
    { offset: 0, description: "Broiler finisher feed · 5 tons", category: "feed" as const, amountCents: 324_000, supplier: "Amo Feeds Ltd", method: "bank_transfer" as const, status: "approved" as const, by: JOHNSON },
    { offset: 1, description: "Layer mash · 3.6 tons", category: "feed" as const, amountCents: 211_000, supplier: "Hybrid Nutrition", method: "bank_transfer" as const, status: "approved" as const, by: GRACE },
    { offset: 4, description: "Monthly payroll · 12 staff", category: "labour" as const, amountCents: 198_000, supplier: null, method: "bank_transfer" as const, status: "approved" as const, by: JOHNSON },
    { offset: 5, description: "Diesel for generators", category: "utilities" as const, amountCents: 68_000, supplier: "Ogun Power", method: "cash" as const, status: "pending" as const, by: TUNDE },
    { offset: 6, description: "Newcastle vaccine · 20 vials", category: "medicine" as const, amountCents: 29_000, supplier: "VetPro Nigeria", method: "card" as const, status: "approved" as const, by: CHIKE },
    { offset: 7, description: "Delivery van maintenance", category: "transport" as const, amountCents: 42_000, supplier: "AutoFix Ogun", method: "cash" as const, status: "pending" as const, by: AMINA },
  ];

  /*
   * Six months of history so the finance charts have depth. The five closed
   * months are written as aggregates; the current month is made up of the
   * itemised rows above plus a single balancing row, so month-to-date spend
   * lands on the target without double counting.
   */
  const monthlyFeed = [510_000, 545_000, 575_000, 585_000, 615_000];
  const monthlyLabour = [266_000, 280_000, 295_000, 305_000, 305_000];
  const monthlyOther = [545_000, 585_000, 625_000, 625_000, 665_000];
  const CURRENT_MONTH_EXPENSE_TARGET = 1_645_000;

  const historicalExpenses = monthlyFeed.flatMap((feedAmount, index) => {
    const offsetMonths = 5 - index;
    return [
      { expenseDate: monthStart(offsetMonths), description: "Monthly feed purchases", category: "feed" as const, amountCents: feedAmount, supplierId: S["Amo Feeds Ltd"], method: "bank_transfer" as const, status: "approved" as const, recordedById: JOHNSON },
      { expenseDate: monthStart(offsetMonths), description: "Monthly payroll", category: "labour" as const, amountCents: monthlyLabour[index], supplierId: null, method: "bank_transfer" as const, status: "approved" as const, recordedById: JOHNSON },
      { expenseDate: monthStart(offsetMonths), description: "Utilities, medicine and transport", category: "other" as const, amountCents: monthlyOther[index], supplierId: null, method: "bank_transfer" as const, status: "approved" as const, recordedById: JOHNSON },
    ];
  });

  const itemisedThisMonth = headlineExpenses
    .filter((expense) => day(expense.offset) >= monthStart(0))
    .reduce((sum, expense) => sum + expense.amountCents, 0);

  await db.insert(expenses).values([
    ...headlineExpenses.map((expense) => ({
      expenseDate: day(expense.offset),
      description: expense.description,
      category: expense.category,
      amountCents: expense.amountCents,
      supplierId: expense.supplier ? S[expense.supplier] : null,
      method: expense.method,
      status: expense.status,
      recordedById: expense.by,
    })),
    ...historicalExpenses,
    {
      expenseDate: monthStart(0),
      description: "Payroll, utilities and sundry costs",
      category: "labour" as const,
      amountCents: Math.max(CURRENT_MONTH_EXPENSE_TARGET - itemisedThisMonth, 0),
      supplierId: null,
      method: "bank_transfer" as const,
      status: "approved" as const,
      recordedById: JOHNSON,
    },
  ]);

  /* -------------------------------------------------------- Revenue history */

  // Invoiced revenue per month, oldest first, matching the finance boards.
  const monthlyRevenue = [1_934_000, 2_083_000, 2_167_000, 2_283_000, 2_333_000];
  const CURRENT_MONTH_REVENUE_TARGET = 2_482_000;

  const orderPaymentsThisMonth = seedOrders
    .filter((order) => order.paid && day(order.offset) >= monthStart(0))
    .reduce((sum, order) => sum + (order.paid?.amountCents ?? 0), 0);

  await db.insert(payments).values([
    ...monthlyRevenue.map((amountCents, index) => ({
      orderId: null,
      customerId: C["Mama Ngozi Foods"],
      amountCents,
      method: "bank_transfer" as const,
      receivedOn: monthStart(5 - index),
      reference: `INV-${String(index + 1).padStart(4, "0")}`,
      description: "Monthly sales settlement",
      createdById: BLESSING,
    })),
    {
      orderId: null,
      customerId: C["Mama Ngozi Foods"],
      amountCents: Math.max(
        CURRENT_MONTH_REVENUE_TARGET - orderPaymentsThisMonth,
        0,
      ),
      method: "bank_transfer" as const,
      receivedOn: monthStart(0),
      reference: "INV-0006",
      description: "Monthly sales settlement",
      createdById: BLESSING,
    },
  ]);

  /* ---------------------------------------------------------------- Tasks */

  await db.insert(tasks).values([
    { title: "Order layer feed", detail: "Grower mash below minimum stock", priority: "high", status: "pending", contextLabel: "Inventory", assigneeId: JOHNSON, dueAt: at(0, "14:00"), createdById: AMINA },
    { title: "Record flock weights", detail: "Sample 50 birds per broiler house", priority: "low", status: "pending", contextLabel: "House 01", assigneeId: AMINA, dueAt: at(0, "16:30"), createdById: JOHNSON },
    { title: "Repair House 04 drinker line", detail: "Leak reported during morning round", priority: "medium", status: "pending", contextLabel: "House 04", assigneeId: TUNDE, dueAt: at(-1, "10:00"), createdById: AMINA },
    { title: "Chase Kola Poultry payment", detail: "₵3,420 overdue by 18 days", priority: "high", status: "pending", contextLabel: "Sales", assigneeId: BLESSING, dueAt: at(-1, "12:00"), createdById: JOHNSON },
    { title: "Restock egg trays", detail: "Below 1,000 units", priority: "low", status: "pending", contextLabel: "Inventory", assigneeId: GRACE, dueAt: at(-3, "09:00"), createdById: AMINA },

    { title: "Vaccinate Flock JF-2026-002", detail: "Gumboro booster · 4,950 doses", priority: "high", status: "in_progress", contextLabel: "House 02", assigneeId: CHIKE, dueAt: at(0, "11:00"), createdById: AMINA },
    { title: "Investigate House 03 mortality", detail: "9 deaths in 24h · awaiting diagnosis", priority: "high", status: "in_progress", contextLabel: "House 03", assigneeId: CHIKE, dueAt: at(0, "15:00"), createdById: JOHNSON },
    { title: "Deliver order #ORD-2840", detail: "Ikeja, Lagos · 40 kg", priority: "medium", status: "in_progress", contextLabel: "Logistics", assigneeId: MUSA, dueAt: at(0, "16:00"), createdById: BLESSING },

    { title: "Record morning egg production", detail: "18,420 eggs across 2 layer houses", priority: "low", status: "completed", contextLabel: "House 03", assigneeId: AMINA, dueAt: at(0, "07:12"), completedAt: at(0, "07:12"), createdById: AMINA },
    { title: "Inspect House 03 ventilation", detail: "Level raised to 3 after heat spike", priority: "high", status: "completed", contextLabel: "House 03", assigneeId: TUNDE, dueAt: at(0, "09:30"), completedAt: at(0, "09:30"), createdById: AMINA },
    { title: "Submit daily records", detail: "All 6 houses submitted", priority: "medium", status: "completed", contextLabel: "All houses", assigneeId: GRACE, dueAt: at(0, "08:40"), completedAt: at(0, "08:40"), createdById: AMINA },
    { title: "Clean water lines", detail: "House 01 and House 02 flushed", priority: "low", status: "completed", contextLabel: "House 01", assigneeId: TUNDE, dueAt: at(1, "15:00"), completedAt: at(1, "15:20"), createdById: AMINA },
    { title: "Receive feed delivery", detail: "5 tons broiler finisher booked in", priority: "medium", status: "completed", contextLabel: "Inventory", assigneeId: AMINA, dueAt: at(1, "11:00"), completedAt: at(1, "11:30"), createdById: JOHNSON },
    { title: "Pay VetPro invoice", detail: "₵290 settled by card", priority: "low", status: "completed", contextLabel: "Finance", assigneeId: JOHNSON, dueAt: at(6, "12:00"), completedAt: at(6, "12:10"), createdById: JOHNSON },
  ]);

  /* -------------------------------------------------------- Notifications */

  await db.insert(notifications).values([
    { userId: JOHNSON, category: "health", tone: "error", icon: "alert", title: "High mortality threshold breached", description: "Flock JF-2026-003 in House 03 lost 9 birds in 24 hours, exceeding the 2% weekly threshold.", linkLabel: "Flock JF-2026-003", linkHref: "/flocks/JF-2026-003", actionLabel: "Investigate", createdAt: at(0, "08:45") },
    { userId: JOHNSON, category: "health", tone: "error", icon: "syringe", title: "Vaccination overdue", description: "Fowl typhoid for Flock JF-2026-007 was scheduled and has not been recorded.", linkLabel: "Flock JF-2026-007", linkHref: "/flocks/JF-2026-007", actionLabel: "Schedule now", createdAt: at(0, "08:00") },
    { userId: JOHNSON, category: "inventory", tone: "warning", icon: "package-open", title: "Grower mash below minimum", description: "Stock is at 900 kg against a 1,000 kg minimum. Estimated 4 days of cover remaining.", linkLabel: "Grower Mash", linkHref: "/inventory", actionLabel: "Reorder", createdAt: at(0, "07:30") },
    { userId: JOHNSON, category: "finance", tone: "warning", icon: "credit-card", title: "Payment overdue", description: "Kola Poultry Traders has $3,420 outstanding, 18 days past terms.", linkLabel: "#ORD-2838", linkHref: "/orders", actionLabel: "Send reminder", createdAt: at(0, "06:00") },
    { userId: JOHNSON, category: "tasks", tone: "violet", icon: "task", title: "Task assigned to you", description: 'Amina Okoro assigned "Order layer feed" to you, due today at 14:00.', linkLabel: "Order layer feed", linkHref: "/tasks", actionLabel: "Open task", createdAt: at(0, "05:00") },
    { userId: JOHNSON, category: "inventory", tone: "warning", icon: "calendar-x", title: "Coccidiostat expiring in 10 days", description: "Batch CCP-0288 expires soon. Use or dispose before expiry.", linkLabel: "Batch CCP-0288", linkHref: "/medicines", actionLabel: "View batch", readAt: at(0, "09:00"), createdAt: at(1, "10:00") },
    { userId: JOHNSON, category: "sales", tone: "success", icon: "receipt", title: "New order received", description: "Sunrise Supermarket placed order #ORD-2840 for $310.", linkLabel: "#ORD-2840", linkHref: "/orders", actionLabel: "View order", readAt: at(0, "09:00"), createdAt: at(1, "09:41") },
    { userId: JOHNSON, category: "system", tone: "success", icon: "check", title: "Daily records complete", description: "All 6 houses submitted daily records before 09:00.", linkLabel: "Daily records", linkHref: "/records/daily", actionLabel: "View records", readAt: at(0, "09:00"), createdAt: at(1, "09:00") },
  ]);

  await db.insert(notificationPreferences).values([
    { userId: JOHNSON, channel: "In-app", scope: "All categories", enabled: true },
    { userId: JOHNSON, channel: "Email", scope: "Health & Finance only", enabled: true },
    { userId: JOHNSON, channel: "SMS", scope: "Critical alerts only", enabled: true },
    { userId: JOHNSON, channel: "WhatsApp", scope: "Disabled", enabled: false },
  ]);

  /* -------------------------------------------------------------- Reports */

  await db.insert(reports).values([
    { name: "Farm Performance", reportKey: "farm-performance", origin: "scheduled", scheduleLabel: "daily", periodStart: day(8), periodEnd: day(0), periodLabel: "Last 9 days", format: "pdf", sizeBytes: 1_258_291, status: "ready", generatedAt: at(0, "06:00") },
    { name: "Egg Production", reportKey: "egg-production", origin: "manual", periodLabel: "This month", format: "excel", sizeBytes: 393_216, status: "ready", generatedById: JOHNSON, generatedAt: at(0, "07:30") },
    { name: "Mortality Report", reportKey: "mortality", origin: "manual", periodStart: day(8), periodEnd: day(0), periodLabel: "Last 9 days", format: "pdf", sizeBytes: 634_880, status: "ready", generatedById: CHIKE, generatedAt: at(0, "08:15") },
    { name: "Financial Statement", reportKey: "financial-statement", origin: "scheduled", scheduleLabel: "monthly", periodLabel: "Last month", format: "pdf", sizeBytes: 2_516_582, status: "ready", generatedAt: at(8, "06:00") },
    { name: "Inventory Report", reportKey: "inventory", origin: "manual", periodLabel: `As at ${day(1)}`, format: "csv", sizeBytes: 98_304, status: "ready", generatedById: AMINA, generatedAt: at(1, "17:00") },
  ]);

  console.log("Seed complete.");
  console.log("Sign in with johnson@jaydafarms.com / farmpassword");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
