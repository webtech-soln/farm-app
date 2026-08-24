import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { sessions, users, type User, type UserRole } from "@/lib/db/schema";

import { can, type Capability } from "./permissions";

export const SESSION_COOKIE = "jf_session";

/**
 * Sessions expire on inactivity, not on a fixed calendar window: `expiresAt`
 * is an idle deadline that every request pushes forward. Leave a tab alone for
 * longer than this and the next request — or the client's own watchdog —
 * lands back on the sign-in page. Override with `SESSION_IDLE_MINUTES`.
 */
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES ?? 60);
export const SESSION_IDLE_MS =
  (Number.isFinite(IDLE_MINUTES) && IDLE_MINUTES > 0 ? IDLE_MINUTES : 60) *
  60 *
  1000;

/**
 * Sliding is throttled so an active tab writes at most once per window rather
 * than on every request.
 */
const SESSION_SLIDE_AFTER_MS = 1000 * 60 * 5; // 5 minutes

/**
 * The key the session digest is derived under.
 *
 * Required in production and never defaulted there: a fallback secret is one
 * that ships, and a shipped secret is no secret. Development gets a fixed
 * stand-in so a fresh checkout runs, at the cost of tokens that do not survive
 * a change of environment — which is the correct trade for a dev machine.
 */
function sessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters in production. " +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  return "development-only-session-secret-do-not-ship";
}

/**
 * The session token lives in the cookie; only its digest reaches the table.
 *
 * Keyed with the application secret rather than hashed bare. The tokens are
 * 256 bits of randomness, so a plain digest was not itself weak — but an
 * unkeyed one means anyone who reads the `sessions` table off a backup, a log
 * or a replica can verify a guessed token offline. With the key held only by
 * the application, the table alone is inert.
 */
function digest(token: string) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
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
  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);

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

  // Any request counts as activity, so the idle deadline moves with the
  // person using the app. The cookie is refreshed separately by the heartbeat,
  // because a page render cannot write one.
  if (row.expiresAt.getTime() - Date.now() < SESSION_IDLE_MS - SESSION_SLIDE_AFTER_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_IDLE_MS) })
      .where(eq(sessions.id, digest(token)));
  }

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
 * Pushes the idle deadline out and re-issues the cookie with it. Only callable
 * from a Server Action or Route Handler, since it writes a cookie — the
 * heartbeat route is what keeps an open tab alive.
 */
export async function refreshSession(): Promise<{ expiresAt: Date } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = digest(token);
  const [row] = await db
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  // An expired row is not revived: the person has to sign in again.
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;

  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { expiresAt };
}

/**
 * The authorization gate every page and Server Action goes through. Server
 * Actions are reachable by direct POST, so this must be called inside the
 * action itself — the proxy redirect is only a first line of defence.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (user) return user;

  // A cookie that no longer resolves to a session has to be cleared before the
  // sign-in page, or the proxy will see it and bounce the request straight
  // back here. The route handler can delete it; this render cannot.
  const cookieStore = await cookies();
  redirect(cookieStore.has(SESSION_COOKIE) ? "/api/session/end" : "/login");
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
