/**
 * Where a `?next=` value is allowed to send someone.
 *
 * Both the sign-in form and the expired-session route carry a destination
 * across a redirect, and both are reachable by anyone who can get a person to
 * click a link on this domain — so the value has to be treated as hostile.
 *
 * Matching on the string is what makes this hard to get right: rejecting a
 * leading `//` looks sufficient, but a browser parses `/\host`, `/\/host` and
 * a tab or newline between the slashes all the same way it parses `//host` —
 * as a protocol-relative URL pointing at somebody else's origin. Rather than
 * chase that list, hand the value to the same parser the browser uses and keep
 * it only if it lands back on this origin.
 */
const SENTINEL_ORIGIN = "http://safe-next.invalid";

export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;

  let url: URL;
  try {
    url = new URL(next, SENTINEL_ORIGIN);
  } catch {
    return fallback;
  }

  // An absolute URL, a protocol-relative one, or anything the parser resolved
  // away from this origin has escaped the site and cannot be honoured.
  if (url.origin !== SENTINEL_ORIGIN) return fallback;

  const path = `${url.pathname}${url.search}${url.hash}`;
  // `new URL("//evil.test", …)` keeps the origin only when the host is empty,
  // which leaves a path that would be re-parsed the same hostile way.
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
