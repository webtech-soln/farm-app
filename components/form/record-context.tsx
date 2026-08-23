"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Calendar, ChevronDown, Layers, Warehouse } from "lucide-react";
import { todayIso } from "@/lib/date";

/**
 * The context strip on the Daily Records board. Changing a picker reloads the
 * board through the URL, so the opening balance, the flock and any record
 * already filed for that day all come back from the server for the new
 * selection.
 */
export function RecordContext({
  date,
  houses,
  flocks,
  houseCode,
  flockCode,
}: {
  date: string;
  houses: { code: string; name: string }[];
  flocks: { code: string; breed: string }[];
  houseCode?: string;
  flockCode?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Changing house invalidates the flock chosen inside the old house.
    if (key === "house") next.delete("flock");
    startTransition(() => router.push(`/records/daily?${next.toString()}`));
  };

  return (
    <>
      <Picker
        icon={<Calendar className="size-4 text-ink-2" />}
        label="Date"
        value={date}
        pending={pending}
        onChange={(value) => update("date", value)}
        type="date"
      />
      <Picker
        icon={<Warehouse className="size-4 text-ink-2" />}
        label="House"
        value={houseCode ?? ""}
        pending={pending}
        onChange={(value) => update("house", value)}
        options={houses.map((house) => ({
          value: house.code,
          label: house.name,
        }))}
      />
      <Picker
        icon={<Layers className="size-4 text-ink-2" />}
        label="Flock"
        value={flockCode ?? ""}
        pending={pending}
        onChange={(value) => update("flock", value)}
        options={[
          { value: "", label: "No flock" },
          ...flocks.map((flock) => ({
            value: flock.code,
            label: `${flock.code} · ${flock.breed}`,
          })),
        ]}
      />
    </>
  );
}

function Picker({
  icon,
  label,
  value,
  options,
  type,
  pending,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options?: { value: string; label: string }[];
  type?: "date";
  pending: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-[180px] flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2">{label}</span>
      <span className="flex h-10 items-center gap-2 rounded-nav border border-border-hair bg-card px-3">
        {icon}
        {options ? (
          <>
            <select
              value={value}
              disabled={pending}
              onChange={(event) => onChange(event.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent text-base-plus font-medium text-ink outline-none"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="size-4 shrink-0 text-ink-3" />
          </>
        ) : (
          <input
            type={type}
            value={value}
            disabled={pending}
            max={todayIso()}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base-plus font-medium text-ink outline-none"
          />
        )}
      </span>
    </label>
  );
}
