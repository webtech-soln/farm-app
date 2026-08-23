"use client";

import { useActionState, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { IDLE } from "@/lib/actions/types";
import { useToast } from "@/components/ui/toast";
import type { ServerFormAction } from "@/components/form/form-dialog";

/**
 * The switch on the Notifications board. Flipping it submits straight away —
 * there is no Save button on that panel — and the toggle follows the server's
 * answer rather than optimistic local state.
 */
export function PreferenceToggle({
  action,
  channel,
  scope,
  enabled,
}: {
  action: ServerFormAction;
  channel: string;
  scope: string;
  enabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const toast = useToast();
  const reported = useRef<unknown>(null);

  useEffect(() => {
    if (state.status === "idle" || reported.current === state) return;
    reported.current = state;
    toast(
      state.status === "success" ? "success" : "error",
      state.message ?? "Preference updated.",
    );
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="scope" value={scope} />
      {/* Posting the opposite value makes the button a toggle. */}
      {enabled ? null : <input type="hidden" name="enabled" value="on" />}
      <button
        type="submit"
        role="switch"
        aria-checked={enabled}
        aria-label={`${channel} notifications`}
        disabled={pending}
        className={cn(
          "flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60",
          enabled ? "bg-violet" : "bg-border-hair",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white transition-transform",
            enabled && "translate-x-4",
          )}
        />
      </button>
    </form>
  );
}
