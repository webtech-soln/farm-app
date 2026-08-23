import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { sessions, users, type User, type UserRole } from "@/lib/db/schema";

import { can, type Capability } from "./permissions";

export const SESSION_COOKIE = "jf_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_REFRESH_MS = 1000 * 60 * 60 * 24; // slide when < 6 days remain

/** The session token lives in the cookie; only its digest reaches the table. */
function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "jobTitle" | "phone" | "dutyStatus"
> & { initials: string };

function initialsFor(name: string) {
  const parts = name
    .replace(/\b(dr|mr|mrs|ms|prof)\.?\s+/gi, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Issues a session and writes the cookie. Only callable from a Server Action
 * or Route Handler, because it sets a response cookie.
 */
export async function createSession(
  userId: number,
  meta: {
    userAgent?: string | null;
    ipAddress?: string | null;
    /** False keeps the cookie for the browser session only. */
    remember?: boolean;
  } = {},
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: digest(token),
    userId,
    expiresAt,
    userAgent: meta.userAgent?.slice(0, 400) ?? null,
    ipAddress: meta.ipAddress?.slice(0, 64) ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "keep me signed in" the cookie is dropped when the browser
    // closes, even though the row stays valid for the full window.
    ...(meta.remember === false ? {} : { expires: expiresAt }),
  });

  // Opportunistic cleanup so expired rows do not accumulate unbounded.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  return { token, expiresAt };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.id, digest(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolves the signed-in user for the current request. Memoised with React
 * `cache` so a page that checks the session in several places still issues a
 * single query.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      jobTitle: users.jobTitle,
      phone: users.phone,
      dutyStatus: users.dutyStatus,
      isActive: users.isActive,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    jobTitle: row.jobTitle,
    phone: row.phone,
    dutyStatus: row.dutyStatus,
    initials: initialsFor(row.name),
  };
});

/**
 * Signs every other device out, leaving the caller's own session alive. Called
 * after a password change so a stolen session cannot outlive the credential.
 */
export async function revokeOtherSessions(userId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  await db
    .delete(sessions)
    .where(
      token
        ? and(eq(sessions.userId, userId), ne(sessions.id, digest(token)))
        : eq(sessions.userId, userId),
    );
}

/**
 * Extends a session that is within a day of the sliding window. Safe to call
 * only from Server Actions / Route Handlers since it writes a cookie.
 */
export async function refreshSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const id = digest(token);
  const [row] = await db
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  if (!row) return;

  const remaining = row.expiresAt.getTime() - Date.now();
  if (remaining <= 0 || remaining > SESSION_TTL_MS - SESSION_REFRESH_MS) return;

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * The authorization gate every page and Server Action goes through. Server
 * Actions are reachable by direct POST, so this must be called inside the
 * action itself — the proxy redirect is only a first line of defence.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Throws `AuthorizationError`, which the action wrapper turns into a form error. */
export async function requireCapability(
  capability: Capability,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, capability)) {
    throw new AuthorizationError(
      `Your role (${user.role}) cannot perform this action.`,
    );
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthorizationError(
      `This action is restricted to: ${roles.join(", ")}.`,
    );
  }
  return user;
}

export { initialsFor };
