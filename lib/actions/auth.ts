"use server";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { fakeVerify, hashPassword, verifyPassword } from "@/lib/auth/password";
import { safeNext } from "@/lib/auth/safe-next";
import {
  createSession,
  destroySession,
  requireUser,
  revokeOtherSessions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { changePasswordSchema, loginSchema } from "@/lib/validation/schemas";

import { formDataToObject, toErrorState } from "./handler";
import { errorState, successState, type ActionState } from "./types";

/** Same wording whether the email is unknown or the password is wrong. */
const BAD_CREDENTIALS = "That email and password do not match an account.";

/**
 * Only same-origin paths are honoured, so a crafted `?next=https://evil.test`
 * cannot turn the login form into an open redirect. See `safeNext` for why the
 * check is a URL parse rather than a prefix test.
 */

export async function signIn(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // The password is deliberately left out of the echoed values.
  const values = {
    email: String(formData.get("email") ?? ""),
    next: String(formData.get("next") ?? ""),
  };

  let destination = "/";

  try {
    const parsed = loginSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return errorState(
        "Enter your email and password.",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
        values,
      );
    }
    const { email, password, next, remember } = parsed.data;

    const [account] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);

    if (!account) {
      // Burn comparable time so a missing account is not faster to probe.
      await fakeVerify();
      return errorState(BAD_CREDENTIALS, undefined, values);
    }

    if (!(await verifyPassword(password, account.passwordHash))) {
      return errorState(BAD_CREDENTIALS, undefined, values);
    }

    if (!account.isActive) {
      return errorState(
        "That account has been deactivated. Ask an administrator to restore it.",
        undefined,
        values,
      );
    }

    const requestHeaders = await headers();
    await createSession(account.id, {
      userAgent: requestHeaders.get("user-agent"),
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      remember,
    });

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, account.id));

    destination = safeNext(next);
  } catch (error) {
    unstable_rethrow(error);
    return toErrorState(error, values);
  }

  // Outside the try: `redirect` signals by throwing and must not be caught.
  redirect(destination);
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser();

    const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return errorState(
        flat.formErrors[0] ?? "Please correct the highlighted fields.",
        flat.fieldErrors as Record<string, string[]>,
      );
    }

    const [account] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!(await verifyPassword(parsed.data.currentPassword, account?.passwordHash))) {
      return errorState("Your current password is not correct.", {
        currentPassword: ["Your current password is not correct."],
      });
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(parsed.data.newPassword),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await revokeOtherSessions(user.id);

    return successState(
      "Password updated. Other devices have been signed out.",
    );
  } catch (error) {
    unstable_rethrow(error);
    return toErrorState(error);
  }
}
