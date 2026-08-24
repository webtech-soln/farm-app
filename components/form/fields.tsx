"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Banknote,
  Calendar,
  Clock3,
  Droplets,
  Globe,
  Scale,
  Thermometer,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { CURRENCY_SYMBOL } from "@/lib/currency";

import { useFormField } from "./form-context";

/**
 * Icons cannot be passed from a Server Component, so a field names the one it
 * wants and it is resolved here.
 */
const icons = {
  globe: Globe,
  "clock-3": Clock3,
  banknote: Banknote,
  scale: Scale,
  thermometer: Thermometer,
  droplets: Droplets,
  calendar: Calendar,
} as const;

export type FieldIcon = keyof typeof icons;

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/** Two-column field grid; collapses to one column on phones. */
export function FormGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Groups a set of fields under a small caption inside a long form. */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-xs font-semibold uppercase tracking-[0.6px] text-ink-3">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** Makes a field span the full width of a `FormGrid`. */
export function FullWidth({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Field shell                                                                */
/* -------------------------------------------------------------------------- */

const fieldShell =
  "flex h-10 items-center gap-2 rounded-nav border bg-card px-3 focus-within:border-violet";

const controlText =
  "min-w-0 flex-1 bg-transparent text-base-plus font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3 disabled:text-ink-3";

function Shell({
  label,
  name,
  required,
  hint,
  error,
  className,
  children,
}: {
  label?: string;
  name: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-sm font-medium text-ink-2">
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span id={`${name}-error`} className="text-xs-plus text-error">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}

type BaseProps = {
  name: string;
  label?: string;
  hint?: string;
  className?: string;
  unit?: string;
  icon?: FieldIcon;
};

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export function TextField({
  name,
  label,
  hint,
  className,
  unit,
  icon,
  defaultValue,
  ...props
}: BaseProps & Omit<ComponentProps<"input">, "name" | "className">) {
  const { error, submitted, pending } = useFormField(name);
  const value = submitted ?? (defaultValue as string | undefined) ?? "";
  const Icon = icon ? icons[icon] : undefined;

  return (
    <Shell
      label={label}
      name={name}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <span
        className={cn(fieldShell, error ? "border-error" : "border-border-hair")}
      >
        {Icon ? <Icon className="size-[15px] shrink-0 text-ink-3" /> : null}
        <input
          key={value}
          name={name}
          defaultValue={value}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className={controlText}
          {...props}
        />
        {unit ? <span className="text-sm text-ink-3">{unit}</span> : null}
      </span>
    </Shell>
  );
}

/** Numeric input; `step` defaults to whole numbers. */
export function NumberField(
  props: BaseProps & Omit<ComponentProps<"input">, "name" | "className" | "type">,
) {
  return <TextField type="number" step={props.step ?? 1} inputMode="decimal" {...props} />;
}

/**
 * Money is posted as a plain string ("1,240.50") and converted to whole cents
 * by the `moneyCents` schema helper, so this stays a text input.
 */
export function MoneyField({
  currency = CURRENCY_SYMBOL,
  ...props
}: BaseProps & { currency?: string } & Omit<
    ComponentProps<"input">,
    "name" | "className" | "type"
  >) {
  const { error, submitted, pending } = useFormField(props.name);
  const value = submitted ?? (props.defaultValue as string | undefined) ?? "";

  return (
    <Shell
      label={props.label}
      name={props.name}
      required={props.required}
      hint={props.hint}
      error={error}
      className={props.className}
    >
      <span
        className={cn(fieldShell, error ? "border-error" : "border-border-hair")}
      >
        <span className="text-sm text-ink-3">{currency}</span>
        <input
          key={value}
          name={props.name}
          defaultValue={value}
          disabled={pending}
          inputMode="decimal"
          placeholder={props.placeholder ?? "0.00"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${props.name}-error` : undefined}
          className={controlText}
          required={props.required}
        />
      </span>
    </Shell>
  );
}

export function DateField(
  props: BaseProps & Omit<ComponentProps<"input">, "name" | "className" | "type">,
) {
  return <TextField type="date" {...props} />;
}

export function TimeField(
  props: BaseProps & Omit<ComponentProps<"input">, "name" | "className" | "type">,
) {
  return <TextField type="time" {...props} />;
}

export function DateTimeField(
  props: BaseProps & Omit<ComponentProps<"input">, "name" | "className" | "type">,
) {
  return <TextField type="datetime-local" {...props} />;
}

export type Option = { value: string | number; label: string };

export function SelectField({
  name,
  label,
  hint,
  className,
  options,
  placeholder,
  defaultValue,
  required,
  disabled,
  ...props
}: BaseProps & {
  options: Option[];
  placeholder?: string;
} & Omit<ComponentProps<"select">, "name" | "className" | "children">) {
  const { error, submitted, pending } = useFormField(name);
  const value = submitted ?? (defaultValue as string | undefined) ?? "";

  return (
    <Shell
      label={label}
      name={name}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <select
        key={value}
        name={name}
        defaultValue={value}
        required={required}
        disabled={disabled || pending}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "h-10 rounded-nav border bg-card px-3 text-base-plus font-medium text-ink outline-none focus:border-violet disabled:text-ink-3",
          error ? "border-error" : "border-border-hair",
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  className,
  rows = 3,
  defaultValue,
  ...props
}: BaseProps & Omit<ComponentProps<"textarea">, "name" | "className">) {
  const { error, submitted, pending } = useFormField(name);
  const value = submitted ?? (defaultValue as string | undefined) ?? "";

  return (
    <Shell
      label={label}
      name={name}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        key={value}
        name={name}
        rows={rows}
        defaultValue={value}
        disabled={pending}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "rounded-nav border bg-card px-3 py-2 text-base-plus text-ink outline-none focus:border-violet placeholder:text-ink-3",
          error ? "border-error" : "border-border-hair",
        )}
        {...props}
      />
    </Shell>
  );
}

/**
 * An unchecked box is absent from `FormData`, which the `checkbox` schema
 * helper already expects, so nothing is posted for "off".
 */
export function CheckboxField({
  name,
  label,
  hint,
  className,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  className?: string;
  defaultChecked?: boolean;
}) {
  const { error, submitted, pending } = useFormField(name);
  const checked = submitted !== undefined ? submitted === "on" : defaultChecked;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          key={String(checked)}
          type="checkbox"
          name={name}
          defaultChecked={checked}
          disabled={pending}
          className="size-[18px] shrink-0 accent-violet"
        />
        <span className="text-base-plus text-ink">{label}</span>
      </label>
      {error ? (
        <span className="text-xs-plus text-error">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-3">{hint}</span>
      ) : null}
    </div>
  );
}

export function HiddenField({
  name,
  value,
}: {
  name: string;
  value: string | number | undefined | null;
}) {
  if (value === undefined || value === null || value === "") return null;
  return <input type="hidden" name={name} value={value} />;
}
