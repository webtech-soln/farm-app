import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "jf_session";
const PUBLIC_PATHS = ["/login"];

/** The paths the matcher below lets through, as a test the proxy can apply. */
const ASSET_PATH = /^\/(?:_next\/static|_next\/image|favicon\.ico)|\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/;

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

  // A Server Action is posted to the path of the page that holds it, so one
  // aimed at a file — `/favicon.ico`, an image — belongs to no page and cannot
  // be answered. Left to the framework it throws while trying to render a
  // route that was never a page, which anyone can trigger without signing in.
  if (request.headers.has("next-action") && ASSET_PATH.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

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
    /*
     * The exclusions above are matched on the path alone, so a Server Action
     * posted at one of them would never reach this file. Actions carry their
     * own header, which is enough to pull them back in wherever they land.
     */
    { source: "/:path*", has: [{ type: "header", key: "next-action" }] },
  ],
};
