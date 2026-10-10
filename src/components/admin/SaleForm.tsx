"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveSaleAction, type SaleFormState } from "@/app/actions/sales";
import { centsToInput, formatCents, parsePriceToCents } from "@/lib/money";
import { localDateTimeInput } from "@/lib/period";
import {
  CHANNEL_LABELS,
  CHANNEL_OPTIONS,
  MODALITY_LABELS,
  MODALITY_OPTIONS,
  PAYMENT_LABELS,
  PAYMENT_OPTIONS,
} from "@/lib/sales-labels";
import type { Modality, PaymentMethod, SaleChannel, SaleWithItems } from "@/lib/sales-repo";
import type { Product } from "@/lib/types";
import { Alert, Button, LinkButton } from "../ui";

type ProductOption = Pick<Product, "id" | "name" | "priceCents" | "promoPriceCents">;

interface Row {
  productId: number | null;
  quantity: number;
  unitPriceCents: number | null;
}

const initialState: SaleFormState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function defaultFields() {
  const now = localDateTimeInput();
  return { saleDate: now.date, saleTime: now.time };
}

export function SaleForm({
  products,
  sale,
}: {
  products: ProductOption[];
  sale?: SaleWithItems | null;
}) {
  const [state, formAction] = useActionState(saveSaleAction, initialState);
  const isEdit = Boolean(sale);

  const initialRows = useMemo<Row[]>(() => {
    if (sale) {
      return sale.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
      }));
    }
    return [{ productId: null, quantity: 1, unitPriceCents: null }];
  }, [sale]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [saleDate, setSaleDate] = useState(sale?.sale.saleDate ?? defaultFields().saleDate);
  const [saleTime, setSaleTime] = useState(() => {
    if (!sale) return defaultFields().saleTime;
    const d = new Date(sale.sale.saleDate);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  });
  const [channel, setChannel] = useState(sale?.sale.channel ?? "local");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    sale?.sale.paymentMethod ?? null,
  );
  const [modality, setModality] = useState(sale?.sale.modality ?? "retiro");
  const [isMides, setIsMides] = useState(sale?.sale.isMides ?? false);
  const [discount, setDiscount] = useState(
    sale && sale.sale.discountCents > 0 ? centsToInput(sale.sale.discountCents) : "",
  );
  const [notes, setNotes] = useState(sale?.sale.notes ?? "");

  const productsById = useMemo(() => {
    const map = new Map<number, ProductOption>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const subtotalCents = rows.reduce((acc, r) => {
    if (r.unitPriceCents === null) return acc;
    if (!Number.isInteger(r.quantity) || r.quantity < 1) return acc;
    return acc + r.unitPriceCents * r.quantity;
  }, 0);
  const discountCents = discount ? (parsePriceToCents(discount) ?? 0) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleProductChange(index: number, productIdRaw: string) {
    const productId = Number(productIdRaw) || null;
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const product = productId ? productsById.get(productId) : undefined;
        const keepPrice = productId === row.productId;
        return {
          ...row,
          productId,
          unitPriceCents: keepPrice
            ? row.unitPriceCents
            : (product?.promoPriceCents ?? product?.priceCents ?? null),
        };
      }),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: null, quantity: 1, unitPriceCents: null }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function itemsJson(): string {
    return JSON.stringify(
      rows.map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
        unitPriceCents: r.unitPriceCents ?? 0,
      })),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {sale && <input type="hidden" name="id" value={sale.sale.id} />}
      <input type="hidden" name="items" value={itemsJson()} />

      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Productos</h2>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                + Agregar producto
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {rows.map((row, index) => {
                const product = row.productId ? productsById.get(row.productId) : undefined;
                return (
                  <div
                    key={`${index}-${row.productId ?? "none"}`}
                    className="grid grid-cols-12 items-end gap-3 rounded-xl border border-neutral-200 p-3"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label className="field-label text-xs" htmlFor={`product-${index}`}>
                        Producto
                      </label>
                      <select
                        id={`product-${index}`}
                        value={row.productId ?? ""}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="field-input"
                      >
                        <option value="">Seleccionar…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.priceCents !== null ? ` — ${formatCents(p.promoPriceCents ?? p.priceCents)}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="field-label text-xs" htmlFor={`qty-${index}`}>
                        Cant.
                      </label>
                      <input
                        id={`qty-${index}`}
                        type="number"
                        min={1}
                        max={9999}
                        value={row.quantity}
                        onChange={(e) => updateRow(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        className="field-input"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <label className="field-label text-xs" htmlFor={`price-${index}`}>
                        Precio unitario (UYU)
                      </label>
                      <input
                        id={`price-${index}`}
                        inputMode="decimal"
                        placeholder="Ej.: 950"
                        value={centsToInput(row.unitPriceCents)}
                        onChange={(e) => {
                          const parsed = parsePriceToCents(e.target.value);
                          updateRow(index, {
                            unitPriceCents: e.target.value.trim() ? parsed : null,
                          });
                        }}
                        className="field-input"
                      />
                      {row.unitPriceCents === null && (
                        <p className="mt-0.5 text-[11px] text-red-600">
                          {product ? "Precio sin configurar: completalo." : "Elegí el producto."}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={rows.length === 1}
                        onClick={() => removeRow(index)}
                        aria-label="Quitar producto"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <FieldError message={state.fieldErrors?.items} />

            <div className="mt-5 flex flex-wrap items-end justify-between border-t border-neutral-100 pt-4">
              <div className="w-full max-w-xs">
                <label htmlFor="discount" className="field-label">
                  Descuento total (UYU)
                </label>
                <input
                  id="discount"
                  inputMode="decimal"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="field-input"
                />
                <FieldError message={state.fieldErrors?.discount} />
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Subtotal</p>
                <p className="text-lg font-bold">{formatCents(subtotalCents)}</p>
                <p className="text-xs text-neutral-500">Descuento</p>
                <p className="text-sm font-semibold text-red-600">
                  {discountCents > 0 ? `− ${formatCents(discountCents)}` : "—"}
                </p>
                <p className="text-xs text-neutral-500">Total</p>
                <p className="text-2xl font-extrabold text-brand-700">{formatCents(totalCents)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h2 className="font-bold">Datos de la venta</h2>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="saleDate" className="field-label">
                    Fecha *
                  </label>
                  <input
                    id="saleDate"
                    name="saleDate"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="field-input"
                  />
                  <FieldError message={state.fieldErrors?.saleDate} />
                </div>
                <div>
                  <label htmlFor="saleTime" className="field-label">
                    Hora
                  </label>
                  <input
                    id="saleTime"
                    name="saleTime"
                    type="time"
                    value={saleTime}
                    onChange={(e) => setSaleTime(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="channel" className="field-label">
                  Canal
                </label>
                <select
                  id="channel"
                  name="channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SaleChannel)}
                  className="field-input"
                >
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="paymentMethod" className="field-label">
                  Medio de pago
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentMethod ?? ""}
                  onChange={(e) => setPaymentMethod((e.target.value || null) as PaymentMethod | null)}
                  className="field-input"
                >
                  <option value="">Sin registrar</option>
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PAYMENT_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modality" className="field-label">
                  Modalidad
                </label>
                <select
                  id="modality"
                  name="modality"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as Modality)}
                  className="field-input"
                >
                  {MODALITY_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {MODALITY_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  name="isMides"
                  checked={isMides}
                  onChange={(e) => setIsMides(e.target.checked)}
                  className="h-4 w-4"
                />
                Venta con beneficio MIDES
              </label>

              <div>
                <label htmlFor="notes" className="field-label">
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la venta"
                  className="field-input"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton label={isEdit ? "Guardar cambios" : "Registrar venta"} />
            <LinkButton href="/admin/ventas" variant="outline">
              Cancelar
            </LinkButton>
          </div>
        </div>
      </div>
    </form>
  );
}