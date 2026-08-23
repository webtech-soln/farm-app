import { NextResponse, type NextRequest } from "next/server";

import { destroySession } from "@/lib/auth/session";

/**
 * Where an expired session is sent to be cleared away.
 *
 * A page cannot delete a cookie while it renders, so redirecting straight to
 * `/login` would leave the stale cookie in place — and the proxy, which only
 * sees that a cookie exists, would bounce the request back to the app: a loop.
 * This route drops the cookie (and the row behind it) first, so the sign-in
 * page is reached with nothing left over.
 */
export async function GET(request: NextRequest) {
  await destroySession();

  const url = new URL("/login", request.url);
  url.searchParams.set("expired", "1");

  const next = request.nextUrl.searchParams.get("next");
  // Only same-site paths, so this cannot be used as an open redirect.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    url.searchParams.set("next", next);
  }

  return NextResponse.redirect(url);
}
