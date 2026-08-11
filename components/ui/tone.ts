/**
 * The status palette from board `32 · Design System`. Every tinted surface on
 * the boards (badges, icon chips, deltas, alerts) draws from this table.
 */
export type Tone =
  | "violet"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export const toneText: Record<Tone, string> = {
  violet: "text-violet",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  info: "text-info",
  neutral: "text-ink-2",
};

export const toneBg: Record<Tone, string> = {
  violet: "bg-violet-50",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
  error: "bg-error-bg",
  info: "bg-info-bg",
  neutral: "bg-border-soft",
};

export const toneSolid: Record<Tone, string> = {
  violet: "bg-violet",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  neutral: "bg-ink-3",
};
