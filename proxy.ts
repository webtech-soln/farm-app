import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "jf_session";
const PUBLIC_PATHS = ["/login"];

/**
 * Optimistic routing only. The proxy runs before rendering and cannot reach
 * the database, so it just checks whether a session cookie is present and
 * bounces obvious cases. Every page and Server Action still verifies the
 * session against the database via `requireUser()`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!hasSessionCookie && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (hasSessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the favicon and static assets —
     * without this the redirect would also swallow CSS and JS requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
