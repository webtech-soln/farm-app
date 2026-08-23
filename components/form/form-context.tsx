"use client";

import { createContext, useContext } from "react";

import { IDLE, type ActionState } from "@/lib/actions/types";

/**
 * Carries the `useActionState` result down to the individual fields so a
 * screen can lay a form out freely and still get inline errors and repopulated
 * values without threading props through every input.
 */
const FormContext = createContext<{ state: ActionState; pending: boolean }>({
  state: IDLE,
  pending: false,
});

export const FormProvider = FormContext.Provider;

export function useFormField(name: string) {
  const { state, pending } = useContext(FormContext);
  return {
    error: state.fieldErrors?.[name]?.[0],
    /** Present only after a failed submit, so the user's typing survives. */
    submitted: state.values?.[name],
    pending,
  };
}

export function useFormStatus() {
  return useContext(FormContext);
}
