import "server-only";

import { and, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";
import { logger } from "@/lib/observability/logger";

/**
 * Throttling for the sign-in form.
 *
 * Two independent limits, because they stop different things. The per-account
 * limit stops someone grinding a password list against one known email; the
 * per-IP limit stops the same person spreading that grind across many accounts,
 * which the account limit alone would never notice.
 *
 * Both are sliding windows over the `login_attempts` table rather than counters
 * in memory — see the schema for why.
 */

const WINDOW_MINUTES = 15;

/** An account someone is guessing at. Generous enough for a real typo streak. */
const PER_ACCOUNT_LIMIT = 5;

/** A source address. Higher, because a farm office shares one address. */
const PER_ADDRESS_LIMIT = 20;

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function windowStart() {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
}

async function countAndOldest(identifier: string, kind: "email" | "ip") {
  const [row] = await db
    .select({
      attempts: sql<number>`count(*)::int`,
      // Milliseconds rather than the timestamp itself: a bare `min()` comes
      // back from the driver as a string, and a `Date` annotation on raw SQL
      // is a claim Drizzle does not check.
      oldestMs: sql<
        string | null
      >`(extract(epoch from min(${loginAttempts.attemptedAt})) * 1000)::bigint`,
    })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.kind, kind),
        gt(loginAttempts.attemptedAt, windowStart()),
      ),
    );

  const oldest = row?.oldestMs == null ? null : Number(row.oldestMs);
  return {
    attempts: row?.attempts ?? 0,
    oldest: oldest !== null && Number.isFinite(oldest) ? oldest : null,
  };
}

/**
 * Asks whether this attempt may proceed. Called before the password is
 * checked, so a locked-out attempt costs nothing but a count.
 */
export async function checkLoginRate(
  email: string,
  ipAddress: string | null,
): Promise<RateLimitVerdict> {
  const checks: Array<{ identifier: string; kind: "email" | "ip"; limit: number }> = [
    { identifier: email.toLowerCase(), kind: "email", limit: PER_ACCOUNT_LIMIT },
  ];
  if (ipAddress) {
    checks.push({ identifier: ipAddress, kind: "ip", limit: PER_ADDRESS_LIMIT });
  }

  for (const check of checks) {
    const { attempts, oldest } = await countAndOldest(check.identifier, check.kind);
    if (attempts >= check.limit) {
      // The window slides, so the block lifts when the oldest attempt ages out.
      const freeAt = (oldest ?? Date.now()) + WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.max(1, Math.ceil((freeAt - Date.now()) / 1000));

      logger.warn("Sign-in throttled", {
        kind: check.kind,
        attempts,
        retryAfterSeconds,
      });

      return { allowed: false, retryAfterSeconds };
    }
  }

  return { allowed: true };
}

/** Records a failure. Successful sign-ins clear the account's history. */
export async function recordFailedLogin(email: string, ipAddress: string | null) {
  const rows = [
    { identifier: email.toLowerCase(), kind: "email" as const },
    ...(ipAddress ? [{ identifier: ipAddress, kind: "ip" as const }] : []),
  ];
  await db.insert(loginAttempts).values(rows);

  // Opportunistic cleanup, so the table cannot grow without bound.
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, windowStart()));
}

export async function clearLoginAttempts(email: string) {
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, email.toLowerCase()),
        eq(loginAttempts.kind, "email"),
      ),
    );
}

/** Rendered into the form, so the person knows this is temporary. */
export function throttleMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "Too many sign-in attempts. Try again in a minute."
    : `Too many sign-in attempts. Try again in ${minutes} minutes.`;
}
