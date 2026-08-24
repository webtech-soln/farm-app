import { createHmac, randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { sessions, type UserRole } from "@/lib/db/schema";
import { ActionState } from "@/lib/actions/types";

import { cookieJar } from "./next-mocks";
import type { Fixtures } from "./fixtures";

/**
 * Mirrors how `createSession` stores a token: the keyed digest, never the
 * token. Kept in step with `lib/auth/session.ts` on purpose — a test that
 * derived the id differently would silently stop authenticating anything.
 */
function digest(token: string) {
  const secret =
    process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
      ? process.env.SESSION_SECRET
      : "development-only-session-secret-do-not-ship";
  return createHmac("sha256", secret).update(token).digest("hex");
}

/** Issues a real session row for a role and puts its token in the cookie jar. */
export async function signInAs(role: UserRole, fixtures: Fixtures) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id: digest(token),
    userId: fixtures.userIdByRole[role],
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  cookieJar.token = token;
  return token;
}

export function signOutOfTest() {
  cookieJar.token = null;
}

/** The shape every `createFormAction` returns, for terser assertions. */
export type Result = ActionState;

/** Builds the `FormData` an action expects from a plain object. */
export function form(fields: Record<string, string | number | undefined>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) data.append(key, String(value));
  }
  return data;
}

export const IDLE: ActionState = { status: "idle" };
