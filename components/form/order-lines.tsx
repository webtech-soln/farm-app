"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { useFormField } from "./form-context";

export type ProductOption = {
  id: number;
  name: string;
  unit: string;
  priceCents: number;
};

type Line = { key: number; productId: string; quantity: string };

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * The order's line editor. `orderSchema` takes the lines as a JSON string
 * because repeated inputs cannot express the product/quantity pairing through
 * `FormData`, so the rows are kept in state and serialised into one hidden
 * field on every change.
 */
export function OrderLines({
  products,
  initial = [],
}: {
  products: ProductOption[];
  initial?: { productId: number; quantity: number }[];
}) {
  const { error } = useFormField("items");
  const [lines, setLines] = useState<Line[]>(() =>
    initial.length > 0
      ? initial.map((line, index) => ({
          key: index,
          productId: String(line.productId),
          quantity: String(line.quantity),
        }))
      : [{ key: 0, productId: "", quantity: "1" }],
  );

  const update = (key: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  const filled = lines.filter((line) => line.productId && Number(line.quantity) > 0);
  const subtotal = filled.reduce((total, line) => {
    const product = products.find((row) => String(row.id) === line.productId);
    return total + (product ? product.priceCents * Number(line.quantity) : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium text-ink-2">
          Items<span className="text-error"> *</span>
        </span>
        <button
          type="button"
          onClick={() =>
            setLines((current) => [
              ...current,
              { key: Math.max(0, ...current.map((l) => l.key)) + 1, productId: "", quantity: "1" },
            ])
          }
          className="flex items-center gap-1.5 rounded-nav border border-border-hair bg-card px-2.5 py-1.5 text-sm-plus font-medium text-ink hover:bg-border-soft"
        >
          <Plus className="size-3.5" />
          Add line
        </button>
      </div>

      {lines.map((line) => {
        const product = products.find((row) => String(row.id) === line.productId);
        return (
          <div key={line.key} className="flex items-center gap-2">
            <select
              value={line.productId}
              onChange={(event) =>
                update(line.key, { productId: event.target.value })
              }
              className="h-10 min-w-0 flex-1 rounded-nav border border-border-hair bg-card px-3 text-base-plus font-medium text-ink outline-none focus:border-violet"
            >
              <option value="">Choose a product…</option>
              {products.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {money(option.priceCents)}/{option.unit}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              value={line.quantity}
              onChange={(event) =>
                update(line.key, { quantity: event.target.value })
              }
              aria-label="Quantity"
              className="h-10 w-[92px] shrink-0 rounded-nav border border-border-hair bg-card px-3 text-base-plus font-medium text-ink outline-none focus:border-violet"
            />
            <span className="w-[92px] shrink-0 text-right text-sm-plus font-semibold text-ink">
              {product
                ? money(product.priceCents * Number(line.quantity || 0))
                : "—"}
            </span>
            <button
              type="button"
              onClick={() =>
                setLines((current) =>
                  current.length === 1
                    ? current
                    : current.filter((row) => row.key !== line.key),
                )
              }
              aria-label="Remove line"
              className="flex size-7 shrink-0 items-center justify-center rounded-nav text-ink-3 hover:bg-error-bg hover:text-error"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}

      <div className="flex items-center gap-2 rounded-nav bg-violet-50 px-3 py-2.5">
        <span className="flex-1 text-sm-plus font-medium text-violet-deep">
          Items subtotal
        </span>
        <span className="text-md font-semibold text-violet-deep">
          {money(subtotal)}
        </span>
      </div>

      {error ? <span className="text-xs-plus text-error">{error}</span> : null}

      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          filled.map((line) => ({
            productId: Number(line.productId),
            quantity: Number(line.quantity),
          })),
        )}
      />
    </div>
  );
}
