import { beforeEach, describe, expect, it } from "vitest";

import {
  checkLoginRate,
  clearLoginAttempts,
  recordFailedLogin,
  throttleMessage,
} from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";

import { seedFixtures } from "../setup/fixtures";

const ready = process.env.FARM_TEST_DB_READY !== "false";
const suite = ready ? describe : describe.skip;

const EMAIL = "owner@test.local";
const IP = "203.0.113.7";

suite("sign-in throttling", () => {
  beforeEach(async () => {
    await seedFixtures();
  });

  it("allows an attempt when nothing has failed", async () => {
    await expect(checkLoginRate(EMAIL, IP)).resolves.toEqual({ allowed: true });
  });

  it("blocks the account after five failures", async () => {
    for (let i = 0; i < 4; i += 1) await recordFailedLogin(EMAIL, null);
    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(true);

    await recordFailedLogin(EMAIL, null);
    const verdict = await checkLoginRate(EMAIL, null);

    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
      expect(verdict.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
    }
  });

  it("throttles one account without touching another", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailedLogin(EMAIL, null);

    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(false);
    expect((await checkLoginRate("vet@test.local", null)).allowed).toBe(true);
  });

  it("blocks an address spreading attempts across many accounts", async () => {
    // Under the per-account limit for each, but well over the address limit —
    // which is the whole point of counting the two separately.
    for (let i = 0; i < 21; i += 1) {
      await recordFailedLogin(`person${i}@test.local`, IP);
    }

    const fresh = await checkLoginRate("someone-new@test.local", IP);
    expect(fresh.allowed).toBe(false);
  });

  it("forgets an account's failures once it signs in", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailedLogin(EMAIL, null);
    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(false);

    await clearLoginAttempts(EMAIL);
    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(true);
  });

  it("ignores attempts that have aged out of the window", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailedLogin(EMAIL, null);
    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(false);

    // Age every attempt past the 15-minute window.
    await db
      .update(loginAttempts)
      .set({ attemptedAt: new Date(Date.now() - 16 * 60 * 1000) });

    expect((await checkLoginRate(EMAIL, null)).allowed).toBe(true);
  });

  it("is case-insensitive about the account", async () => {
    for (let i = 0; i < 5; i += 1) await recordFailedLogin("Owner@Test.Local", null);
    expect((await checkLoginRate("owner@test.local", null)).allowed).toBe(false);
  });

  it("tells the person how long to wait, in plain words", () => {
    expect(throttleMessage(30)).toContain("in a minute");
    expect(throttleMessage(9 * 60)).toContain("9 minutes");
  });
});
