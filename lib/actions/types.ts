/**
 * The single result shape every Server Action returns, so `useActionState`
 * consumers on the client all read errors the same way.
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  status: "idle" | "success" | "error";
  /** Form-level message: a success confirmation or a non-field error. */
  message?: string;
  /** Per-field validation messages keyed by the input's `name`. */
  fieldErrors?: FieldErrors;
  /**
   * The submitted values echoed back so a re-rendered form can repopulate
   * itself after a failed submit without losing the user's typing.
   */
  values?: Record<string, string>;
  /** Identifier of the row a successful create/update touched. */
  id?: number;
};

export const IDLE: ActionState = { status: "idle" };

export function successState(message: string, id?: number): ActionState {
  return { status: "success", message, id };
}

export function errorState(
  message: string,
  fieldErrors?: FieldErrors,
  values?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors, values };
}
