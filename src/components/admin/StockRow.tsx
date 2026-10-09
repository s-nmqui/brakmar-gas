"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateStockAction, type FormState } from "@/app/actions/products";
import { AVAILABILITY_LABELS } from "@/lib/config";
import type { Availability, Product } from "@/lib/types";
import { Button } from "../ui";

const initialState: FormState = { ok: false };
const AVAILABILITY_OPTIONS = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "unknown",
] as Availability[];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "…" : "Guardar"}
    </Button>
  );
}

export function StockRow({ product }: { product: Product }) {
  const [state, formAction] = useActionState(updateStockAction, initialState);
  const low = product.stock <= product.lowStockThreshold;

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 items-end gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 sm:grid-cols-12"
    >
      <input type="hidden" name="id" value={product.id} />
      <div className="sm:col-span-4">
        <p className="font-semibold">{product.name}</p>
        <p className="text-xs text-neutral-500">{product.categoryName ?? "Sin categoría"}</p>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label text-xs" htmlFor={`stock-${product.id}`}>
          Stock
        </label>
        <input
          id={`stock-${product.id}`}
          name="stock"
          type="number"
          min={0}
          defaultValue={product.stock}
          className={`field-input ${low ? "border-amber-300" : ""}`}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label text-xs" htmlFor={`threshold-${product.id}`}>
          Aviso
        </label>
        <input
          id={`threshold-${product.id}`}
          name="lowStockThreshold"
          type="number"
          min={0}
          defaultValue={product.lowStockThreshold}
          className="field-input"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="field-label text-xs" htmlFor={`avail-${product.id}`}>
          Disponibilidad
        </label>
        <select
          id={`avail-${product.id}`}
          name="availability"
          defaultValue={product.availability}
          className="field-input"
        >
          {AVAILABILITY_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {AVAILABILITY_LABELS[a]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 sm:col-span-1">
        <SaveButton />
      </div>
      {state.message && (
        <p
          className={`sm:col-span-12 text-xs ${
            state.ok ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
