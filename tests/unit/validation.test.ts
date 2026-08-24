import { describe, expect, it } from "vitest";

import { stripCurrency } from "@/lib/currency";
import { moneyCents, pastOrTodayDate, optionalPhone, wholeNumber } from "@/lib/validation/common";
import { dailyRecordSchema, mortalitySchema, changePasswordSchema } from "@/lib/validation/schemas";
import { toIsoDate, todayIso } from "@/lib/date";

// Local time, not UTC: `pastOrTodayDate` compares against the farm's calendar
// day, and an ISO-from-UTC date reads as tomorrow every evening west of GMT.
const today = todayIso();
const tomorrow = toIsoDate(new Date(Date.now() + 2 * 864e5));

describe("money parsing", () => {
  const amount = moneyCents("Amount", { min: 1 });

  it.each([
    ["1240.50", 124_050],
    ["1,240.50", 124_050],
    ["₵1,240.50", 124_050],
    ["GH₵ 1,240.50", 124_050],
    ["GHS 1240.50", 124_050],
    ["GHC 1240.50", 124_050],
    ["  12.5  ", 1_250],
    ["0.01", 1],
  ])("reads %j as %i pesewas", (input, expected) => {
    expect(amount.parse(input)).toBe(expected);
  });

  it.each(["1e3", "0x10", "Infinity", "abc", "12abc", "--5", ""])(
    "refuses %j",
    (input) => {
      expect(amount.safeParse(input).success).toBe(false);
    },
  );

  it("refuses an amount below the minimum or above the ceiling", () => {
    expect(amount.safeParse("-50").success).toBe(false);
    expect(amount.safeParse("0").success).toBe(false);
    expect(amount.safeParse("999999999").success).toBe(false);
  });

  it("rounds the third decimal rather than truncating it", () => {
    expect(amount.parse("1.005")).toBe(101);
    expect(amount.parse("1.004")).toBe(100);
  });

  it("strips currency without touching the digits", () => {
    expect(stripCurrency("₵1,240.50")).toBe("1240.50");
    expect(stripCurrency("1240.50")).toBe("1240.50");
  });
});

describe("dates", () => {
  it("accepts today and refuses the day after tomorrow", () => {
    expect(pastOrTodayDate.safeParse(today).success).toBe(true);
    expect(pastOrTodayDate.safeParse(tomorrow).success).toBe(false);
  });

  it.each(["not-a-date", "2026-13-01", "01-01-2026", "2026/01/01", ""])(
    "refuses %j",
    (input) => {
      expect(pastOrTodayDate.safeParse(input).success).toBe(false);
    },
  );
});

describe("whole numbers", () => {
  const birds = wholeNumber("Birds", { min: 0, max: 1000 });

  it.each([["5", 5], ["0", 0], ["1000", 1000]])("accepts %j", (input, expected) => {
    expect(birds.parse(input)).toBe(expected);
  });

  it.each(["-1", "1001", "1.5", "abc"])("refuses %j", (input) => {
    expect(birds.safeParse(input).success).toBe(false);
  });
});

describe("phone numbers", () => {
  it("takes the formats the farm's contacts actually use", () => {
    for (const value of ["+233 24 123 4567", "0241234567", "(024) 123-4567"]) {
      expect(optionalPhone.safeParse(value).success).toBe(true);
    }
  });

  it("refuses letters and lengths that cannot be a number", () => {
    for (const value of ["call me", "123", "1".repeat(40)]) {
      expect(optionalPhone.safeParse(value).success).toBe(false);
    }
  });
});

describe("daily record cross-field rules", () => {
  const base = {
    houseId: "1",
    recordDate: today,
    startingBirds: "100",
    deaths: "0",
    culls: "0",
    transfersOut: "0",
  };

  it("allows losses that exactly consume the flock", () => {
    const result = dailyRecordSchema.safeParse({
      ...base, deaths: "50", culls: "30", transfersOut: "20",
    });
    expect(result.success).toBe(true);
  });

  it("refuses losses beyond the starting birds", () => {
    const result = dailyRecordSchema.safeParse({ ...base, deaths: "101" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain("cannot exceed the starting birds");
    }
  });

  it("refuses a minimum temperature above the maximum", () => {
    const result = dailyRecordSchema.safeParse({ ...base, tempMinC: "40", tempMaxC: "10" });
    expect(result.success).toBe(false);
  });

  it("accepts a minimum equal to the maximum", () => {
    expect(
      dailyRecordSchema.safeParse({ ...base, tempMinC: "25", tempMaxC: "25" }).success,
    ).toBe(true);
  });
});

describe("mortality", () => {
  it("requires at least one death and refuses a future date", () => {
    const base = { flockId: "1", occurredOn: today, deaths: "1", cause: "Heat" };
    expect(mortalitySchema.safeParse(base).success).toBe(true);
    expect(mortalitySchema.safeParse({ ...base, deaths: "0" }).success).toBe(false);
    expect(mortalitySchema.safeParse({ ...base, occurredOn: tomorrow }).success).toBe(false);
  });
});

describe("password policy", () => {
  const valid = { currentPassword: "old", newPassword: "Longenough1", confirmPassword: "Longenough1" };

  it("accepts a password with length, case and a digit", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["too short", "Short1"],
    ["no uppercase", "alllowercase1"],
    ["no lowercase", "ALLUPPERCASE1"],
    ["no digit", "NoDigitsHere"],
  ])("refuses one that is %s", (_label, newPassword) => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword, confirmPassword: newPassword }).success,
    ).toBe(false);
  });

  it("refuses a confirmation that does not match", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, confirmPassword: "Different1" }).success,
    ).toBe(false);
  });
});
