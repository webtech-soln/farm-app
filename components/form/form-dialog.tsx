"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Check,
  CircleCheckBig,
  Clock3,
  CreditCard,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { IDLE, type ActionState } from "@/lib/actions/types";
import type { Capability } from "@/lib/auth/permissions";
import { useToast } from "@/components/ui/toast";

import { useCan } from "./capabilities";
import { FormProvider } from "./form-context";

/**
 * Icons cannot cross the server/client boundary as props, so triggers name the
 * icon they want and it is resolved here.
 */
const icons = {
  plus: Plus,
  pencil: Pencil,
  trash: Trash2,
  check: Check,
  "check-big": CircleCheckBig,
  ban: Ban,
  clock: Clock3,
  card: CreditCard,
  truck: Truck,
  cart: ShoppingCart,
  "stock-in": ArrowDownToLine,
  "stock-out": ArrowUpFromLine,
  alert: TriangleAlert,
} as const;

export type TriggerIcon = keyof typeof icons;

export type ServerFormAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type TriggerProps = {
  label: string;
  icon?: TriggerIcon;
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger-icon" | "chip";
  className?: string;
};

const triggerVariants = {
  primary: "bg-violet text-white hover:bg-violet-deep",
  secondary: "border border-border-hair bg-card text-ink hover:bg-border-soft",
  ghost: "text-ink-2 hover:bg-border-soft",
} as const;

function Trigger({
  label,
  icon,
  variant = "primary",
  className,
  onClick,
}: TriggerProps & { onClick: () => void }) {
  const Icon: LucideIcon | undefined = icon ? icons[icon] : undefined;

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-[6px] border border-border-hair px-2 py-1 text-2xs font-semibold text-ink-2 hover:bg-border-soft",
          className,
        )}
      >
        {label}
      </button>
    );
  }

  if (variant === "icon" || variant === "danger-icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-nav transition-colors",
          variant === "danger-icon"
            ? "text-ink-3 hover:bg-error-bg hover:text-error"
            : "text-ink-3 hover:bg-border-soft hover:text-ink",
          className,
        )}
      >
        {Icon ? <Icon className="size-[15px]" /> : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[38px] shrink-0 items-center gap-[7px] rounded-nav px-3.5 text-base font-semibold transition-colors",
        triggerVariants[variant],
        className,
      )}
    >
      {Icon ? <Icon className="size-[15px]" /> : null}
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog shell                                                               */
/* -------------------------------------------------------------------------- */

const widths = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
} as const;

function DialogShell({
  title,
  description,
  size = "md",
  onClose,
  children,
}: {
  title: string;
  description?: string;
  size?: keyof typeof widths;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // The dialog element itself only covers the backdrop area.
        if (event.target === ref.current) ref.current?.close();
      }}
      className={cn(
        // Tailwind's preflight zeroes the margin a modal <dialog> relies on to
        // centre itself, so it is put back explicitly. `text-left` is just as
        // deliberate: the element sits in the DOM where it was rendered — often
        // a right-aligned table cell — and would otherwise inherit its
        // alignment even while floating in the top layer.
        "m-auto w-[calc(100vw-32px)] rounded-card border border-border-hair bg-card p-0 text-left text-ink shadow-[0_24px_64px_rgba(24,24,27,0.24)] backdrop:bg-ink/40",
        widths[size],
      )}
    >
      <div className="flex max-h-[84vh] flex-col">
        <div className="flex items-start gap-3 border-b border-border-hair px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h2 className="text-md font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="text-sm text-ink-2">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-nav text-ink-3 hover:bg-border-soft hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-nav border border-error/25 bg-error-bg px-3 py-2.5 text-sm-plus text-error"
    >
      <TriangleAlert className="mt-px size-4 shrink-0" />
      {message}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Form dialog                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The modal every create/edit flow uses: renders a trigger button, and while
 * open runs the Server Action through `useActionState` so field errors land
 * back on the inputs. Mounting the form only while open means each visit
 * starts from a clean state.
 */
export function FormDialog({
  trigger,
  title,
  description,
  size,
  action,
  submitLabel = "Save",
  pendingLabel,
  children,
  footerNote,
  capability,
}: {
  trigger: TriggerProps;
  title: string;
  description?: string;
  size?: keyof typeof widths;
  action: ServerFormAction;
  submitLabel?: string;
  pendingLabel?: string;
  /** Fields, rendered inside the form element. */
  children: ReactNode;
  footerNote?: string;
  /** Hides the trigger for a role the action would refuse anyway. */
  capability?: Capability;
}) {
  const [open, setOpen] = useState(false);
  const allowed = useCan(capability);

  if (!allowed) return null;

  return (
    <>
      <Trigger {...trigger} onClick={() => setOpen(true)} />
      {open ? (
        <DialogShell
          title={title}
          description={description}
          size={size}
          onClose={() => setOpen(false)}
        >
          <DialogForm
            action={action}
            submitLabel={submitLabel}
            pendingLabel={pendingLabel}
            footerNote={footerNote}
            onDone={() => setOpen(false)}
          >
            {children}
          </DialogForm>
        </DialogShell>
      ) : null}
    </>
  );
}

function DialogForm({
  action,
  submitLabel,
  pendingLabel,
  footerNote,
  onDone,
  children,
}: {
  action: ServerFormAction;
  submitLabel: string;
  pendingLabel?: string;
  footerNote?: string;
  onDone: () => void;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const toast = useToast();
  const closed = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !closed.current) {
      closed.current = true;
      toast("success", state.message ?? "Saved.");
      onDone();
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {state.status === "error" && state.message ? (
          <ErrorBanner message={state.message} />
        ) : null}
        <FormProvider value={{ state, pending }}>{children}</FormProvider>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 border-t border-border-hair px-5 py-3.5">
        {footerNote ? (
          <p className="min-w-0 flex-1 text-xs text-ink-3">{footerNote}</p>
        ) : (
          <span className="flex-1" />
        )}
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="inline-flex h-[38px] items-center rounded-nav border border-border-hair bg-card px-3.5 text-base font-semibold text-ink hover:bg-border-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-[38px] items-center gap-[7px] rounded-nav bg-violet px-3.5 text-base font-semibold text-white hover:bg-violet-deep disabled:opacity-60"
        >
          {pending ? (pendingLabel ?? "Saving…") : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Board `31 · States & Feedback` → `Confirmation Dialog`. Used for deletes and
 * one-click state changes; `fields` are posted as hidden inputs.
 */
export function ConfirmAction({
  trigger,
  title,
  message,
  action,
  fields,
  confirmLabel = "Confirm",
  pendingLabel = "Working…",
  tone = "danger",
  children,
  capability,
}: {
  trigger: TriggerProps;
  title: string;
  message: string;
  action: ServerFormAction;
  fields?: Record<string, string | number | undefined | null>;
  confirmLabel?: string;
  pendingLabel?: string;
  tone?: "danger" | "primary";
  /** Optional extra inputs (a note, a date) shown above the buttons. */
  children?: ReactNode;
  /** Hides the trigger for a role the action would refuse anyway. */
  capability?: Capability;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const allowed = useCan(capability);

  if (!allowed) return null;

  return (
    <>
      <Trigger {...trigger} onClick={() => setOpen(true)} />
      {open ? (
        <DialogShell title={title} size="sm" onClose={close}>
          <ConfirmForm
            action={action}
            message={message}
            fields={fields}
            confirmLabel={confirmLabel}
            pendingLabel={pendingLabel}
            tone={tone}
            onDone={close}
          >
            {children}
          </ConfirmForm>
        </DialogShell>
      ) : null}
    </>
  );
}

function ConfirmForm({
  action,
  message,
  fields,
  confirmLabel,
  pendingLabel,
  tone,
  onDone,
  children,
}: {
  action: ServerFormAction;
  message: string;
  fields?: Record<string, string | number | undefined | null>;
  confirmLabel: string;
  pendingLabel: string;
  tone: "danger" | "primary";
  onDone: () => void;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const toast = useToast();
  const closed = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !closed.current) {
      closed.current = true;
      toast("success", state.message ?? "Done.");
      onDone();
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className="flex flex-col">
      <div className="flex flex-col gap-3.5 px-5 py-4">
        {state.status === "error" && state.message ? (
          <ErrorBanner message={state.message} />
        ) : null}
        <p className="text-base-plus text-ink-2">{message}</p>
        {Object.entries(fields ?? {}).map(([key, value]) =>
          value === undefined || value === null ? null : (
            <input key={key} type="hidden" name={key} value={value} />
          ),
        )}
        {children ? (
          <FormProvider value={{ state, pending }}>{children}</FormProvider>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2.5 border-t border-border-hair px-5 py-3.5">
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="inline-flex h-[38px] items-center rounded-nav border border-border-hair bg-card px-3.5 text-base font-semibold text-ink hover:bg-border-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-[38px] items-center rounded-nav px-3.5 text-base font-semibold text-white disabled:opacity-60",
            tone === "danger"
              ? "bg-error hover:bg-error/90"
              : "bg-violet hover:bg-violet-deep",
          )}
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </form>
  );
}
