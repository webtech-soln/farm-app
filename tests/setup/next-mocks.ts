import { vi } from "vitest";

/**
 * Server Actions reach for request-scoped Next APIs that do not exist outside a
 * request. These stand in for them.
 *
 * The cookie jar is deliberately real rather than the whole session being
 * stubbed out: a test signs in by writing an actual `sessions` row and putting
 * its token here, so `requireCapability` runs the genuine lookup, expiry check
 * and role gate. Stubbing the session would test the mock instead.
 */
export const cookieJar: { token: string | null } = { token: null };

const SESSION_COOKIE = "jf_session";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && cookieJar.token
        ? { name, value: cookieJar.token }
        : undefined,
    set: () => {},
    delete: () => {
      cookieJar.token = null;
    },
    has: (name: string) => name === SESSION_COOKIE && Boolean(cookieJar.token),
  }),
  headers: async () => new Headers(),
}));

// Revalidation is a no-op without a render to invalidate.
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));
