"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/cn";

/** Board `31 · States & Feedback` → `Toasts`. */
export type ToastTone = "success" | "error";

type Toast = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(
  null,
);

const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, message }]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-100 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:items-end"
      >
        {toasts.map((toast) => (
          <ToastRow key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.tone === "success" ? CircleCheck : TriangleAlert;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-card border bg-card px-3.5 py-3 shadow-[0_8px_24px_rgba(24,24,27,0.12)]",
        toast.tone === "success"
          ? "border-success/25"
          : "border-error/25",
      )}
    >
      <Icon
        className={cn(
          "mt-px size-[17px] shrink-0",
          toast.tone === "success" ? "text-success" : "text-error",
        )}
      />
      <p className="min-w-0 flex-1 text-base text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-ink-3 hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/**
 * Returns a push function. Safe to call outside a provider — the toast is
 * simply dropped rather than crashing a screen that has not mounted one.
 */
export function useToast() {
  const push = useContext(ToastContext);
  return useMemo(
    () => (tone: ToastTone, message: string) => push?.(tone, message),
    [push],
  );
}
