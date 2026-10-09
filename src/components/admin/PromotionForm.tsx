"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  savePromotionAction,
  type AdminFormState,
} from "@/app/actions/content";
import type { Promotion } from "@/lib/types";
import { Alert, Button } from "../ui";

const initialState: AdminFormState = { ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar promoción"}
    </Button>
  );
}

export function PromotionForm({
  products,
  promotion,
}: {
  products: Array<{ id: number; name: string }>;
  promotion?: Promotion | null;
}) {
  const [state, formAction] = useActionState(savePromotionAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {promotion && <input type="hidden" name="id" value={promotion.id} />}
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div>
        <label htmlFor="title" className="field-label">
          Título *
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={promotion?.title ?? ""}
          className="field-input"
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1200}
          defaultValue={promotion?.description ?? ""}
          className="field-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="discountLabel" className="field-label">
            Etiqueta de descuento (opcional)
          </label>
          <input
            id="discountLabel"
            name="discountLabel"
            maxLength={60}
            placeholder="Ej.: 10% menos"
            defaultValue={promotion?.discountLabel ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="productId" className="field-label">
            Producto asociado (opcional)
          </label>
          <select
            id="productId"
            name="productId"
            defaultValue={promotion?.productId ?? ""}
            className="field-input"
          >
            <option value="">Sin producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className="field-label">
            Desde (fecha)
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={promotion?.startsAt ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="field-label">
            Hasta (fecha)
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            defaultValue={promotion?.endsAt ?? ""}
            className="field-input"
          />
          {state.fieldErrors?.endsAt && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endsAt}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={promotion ? promotion.isActive : true}
          className="h-4 w-4"
        />
        Activa
      </label>

      <SaveButton />
    </form>
  );
}