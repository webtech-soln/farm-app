import { NextResponse } from "next/server";

import { refreshSession } from "@/lib/auth/session";

/**
 * Keeps an open tab signed in. The session's idle deadline only moves when a
 * request arrives, and a page render cannot re-issue the cookie, so the client
 * watchdog posts here while the person is actually doing something.
 *
 * A 401 means the session is already gone — the watchdog then sends the tab to
 * the sign-in page rather than leaving it on a screen it can no longer use.
 */
export async function POST() {
  const refreshed = await refreshSession();

  if (!refreshed) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, expiresAt: refreshed.expiresAt.toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
