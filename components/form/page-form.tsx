"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";
import { IDLE, type ActionState } from "@/lib/actions/types";
import { useToast } from "@/components/ui/toast";

import { FormProvider } from "./form-context";
import type { ServerFormAction } from "./form-dialog";

export type SubmitButton = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  /** Posted alongside the form, e.g. `status=draft` for "Save as draft". */
  name?: string;
  value?: string;
};

/**
 * A full-page form (the Daily Records board, the Settings panels) sharing the
 * dialog's state plumbing: inline field errors, a form-level banner, and a
 * toast plus optional redirect once the action succeeds.
 */
export function PageForm({
  action,
  children,
  buttons,
  className,
  /** Navigated to after a successful save. */
  redirectTo,
  /** Keeps the values on screen after saving (settings panels). */
  keepValues = false,
}: {
  action: ServerFormAction;
  children: ReactNode;
  buttons: SubmitButton[];
  className?: string;
  redirectTo?: string;
  keepValues?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const toast = useToast();
  const router = useRouter();
  const handled = useRef<ActionState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    toast("success", state.message ?? "Saved.");
    if (!keepValues) formRef.current?.reset();
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }, [state, toast, router, redirectTo, keepValues]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn("flex flex-col gap-5", className)}
    >
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-nav border border-error/25 bg-error-bg px-3.5 py-3 text-sm-plus text-error"
        >
          <TriangleAlert className="mt-px size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <FormProvider value={{ state, pending }}>{children}</FormProvider>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="submit"
            name={button.name}
            value={button.value}
            disabled={pending}
            className={cn(
              "inline-flex h-[38px] shrink-0 items-center gap-[7px] rounded-nav px-3.5 text-base font-semibold transition-colors disabled:opacity-60",
              button.variant === "secondary"
                ? "border border-border-hair bg-card text-ink hover:bg-border-soft"
                : "bg-violet text-white hover:bg-violet-deep",
            )}
          >
            {button.variant === "secondary" ? null : (
              <Check className="size-[15px]" />
            )}
            {pending ? (button.pendingLabel ?? "Saving…") : button.label}
          </button>
        ))}
      </div>
    </form>
  );
}
