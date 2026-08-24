import { describe, expect, it } from "vitest";

import { CURRENCY_SYMBOL } from "@/lib/currency";
import { money as moneyMajor, count, percent, signedPercent } from "@/lib/format";
import { numberParam, pageParam, pageWindow, paginate, param } from "@/lib/pagination";

describe("currency formatting", () => {
  it("renders cedis, never dollars", () => {
    expect(CURRENCY_SYMBOL).toBe("₵");
    expect(moneyMajor(1234)).toBe("₵1,234");
    expect(moneyMajor(1234)).not.toContain("$");
  });

  it("compacts large figures", () => {
    expect(moneyMajor(1_500_000, { compact: true })).toBe("₵1.5M");
    expect(moneyMajor(2_400, { compact: true })).toBe("₵2k");
  });

  it("formats counts and percentages", () => {
    expect(count(1234567)).toBe("1,234,567");
    expect(percent(38.64)).toBe("38.6%");
    expect(signedPercent(4.2)).toBe("+4.2%");
    expect(signedPercent(-4.2)).toBe("-4.2%");
  });
});

describe("pagination", () => {
  it("defaults to page one for anything that is not a page", () => {
    for (const page of [undefined, "", "0", "-5", "abc", "NaN", "Infinity"]) {
      expect(pageParam(page === undefined ? {} : { page })).toBe(1);
    }
  });

  it("floors a fractional page", () => {
    expect(pageParam({ page: "3.9" })).toBe(3);
  });

  it("clamps a page too large to survive the offset multiplication", () => {
    // The bug this guards: (1e308 - 1) * 25 overflows to Infinity, and
    // Postgres rejects that as an OFFSET.
    const window = pageWindow({ page: "1e308" });
    expect(Number.isFinite(window.offset)).toBe(true);
    expect(window.page).toBeLessThanOrEqual(100_000);
  });

  it("reads the first value when a param is repeated", () => {
    expect(param({ q: ["first", "second"] }, "q")).toBe("first");
    expect(param({ q: "  spaced  " }, "q")).toBe("spaced");
    expect(param({ q: "   " }, "q")).toBeUndefined();
  });

  it("reports a next page from the extra row, without a count query", () => {
    const rows = Array.from({ length: 26 }, (_, index) => index);
    const result = paginate(rows, { page: 1, pageSize: 25 });
    expect(result.rows).toHaveLength(25);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrevious).toBe(false);
    expect(result.range).toBe("1–25");
  });

  it("says so plainly when a page is empty", () => {
    expect(paginate([], { page: 9, pageSize: 25 }).range).toBe("0");
  });
});

describe("numberParam", () => {
  it("takes a number inside the bounds", () => {
    expect(numberParam({ days: "30" }, "days", 14, { min: 1, max: 365 })).toBe(30);
  });

  it.each(["bogus", "1e309", "-1", "0", "9999", "NaN", "Infinity"])(
    "falls back for %j",
    (value) => {
      expect(numberParam({ days: value }, "days", 14, { min: 1, max: 365 })).toBe(14);
    },
  );

  it("falls back when the parameter is absent", () => {
    expect(numberParam({}, "days", 14)).toBe(14);
  });
});
