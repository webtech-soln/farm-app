"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  Clock3,
  Check,
  Lock,
  Mail,
  TriangleAlert,
} from "lucide-react";

import { signIn } from "@/lib/actions/auth";
import { IDLE } from "@/lib/actions/types";

/**
 * The sign-in form. A Client Component because it reports validation and
 * credential errors from `useActionState` — everything else on the page stays
 * on the server.
 */
export function LoginForm({
  next,
  expired,
}: {
  next?: string;
  /** Set when the watchdog sent an idle tab back here. */
  expired?: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, IDLE);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="flex w-full max-w-[540px] flex-col gap-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
          Sign in
        </h2>
        <p className="text-base-plus text-ink-2">
          Welcome back. Enter your details to continue.
        </p>
      </div>

      {expired && state.status !== "error" ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-nav border border-border-hair bg-bg px-3.5 py-3 text-sm-plus text-ink-2"
        >
          <Clock3 className="mt-px size-4 shrink-0 text-ink-3" />
          Your session ended after an hour of inactivity. Sign in to pick up
          where you left off.
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-nav border border-error/25 bg-error-bg px-3.5 py-3 text-sm-plus text-error"
        >
          <TriangleAlert className="mt-px size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm-plus font-medium text-ink-2">
            Work email
          </span>
          <span className="flex h-11 items-center gap-2.5 rounded-nav border border-border-hair bg-card px-3.5">
            <Mail className="size-[17px] shrink-0 text-ink-3" />
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              defaultValue={state.values?.email ?? ""}
              aria-invalid={fieldError("email") ? true : undefined}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
            />
          </span>
          {fieldError("email") ? (
            <span className="text-xs-plus text-error">{fieldError("email")}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-3">
            <span className="flex-1 text-sm-plus font-medium text-ink-2">
              Password
            </span>
            <span className="text-sm font-semibold text-violet-deep">
              Forgot password?
            </span>
          </span>
          <span className="flex h-11 items-center gap-2.5 rounded-nav border border-border-hair bg-card px-3.5">
            <Lock className="size-[17px] shrink-0 text-violet" />
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              aria-invalid={fieldError("password") ? true : undefined}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none"
            />
          </span>
          {fieldError("password") ? (
            <span className="text-xs-plus text-error">
              {fieldError("password")}
            </span>
          ) : null}
        </label>

        <label className="flex cursor-pointer items-center gap-2.5">
          <span className="relative flex size-[18px] items-center justify-center rounded-[5px] bg-violet">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="peer absolute inset-0 appearance-none rounded-[5px] bg-border-soft checked:bg-violet"
            />
            <Check className="pointer-events-none relative size-3 text-white opacity-0 peer-checked:opacity-100" />
          </span>
          <span className="text-sm-plus text-ink-2">
            Keep me signed in on this device
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[46px] items-center justify-center gap-2 rounded-nav bg-violet text-[14px] font-semibold text-white hover:bg-violet-deep disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
        <ArrowRight className="size-[17px]" />
      </button>

      {/* <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-hair" />
        <span className="text-xs-plus text-ink-3">or</span>
        <span className="h-px flex-1 bg-border-hair" />
      </div> */}

      {/* <button
        type="button"
        className="flex h-[46px] items-center justify-center gap-2 rounded-nav border border-border-hair bg-card text-base-plus font-medium text-ink hover:bg-border-soft"
      >
        <Building2 className="size-[17px] text-ink-2" />
        Continue with company SSO
      </button>

      <p className="flex items-center justify-center gap-1.5 text-sm-plus text-ink-2">
        New to Jayda Farms?
        <span className="font-semibold text-violet-deep">Request access</span>
      </p> */}
    </form>
  );
}
