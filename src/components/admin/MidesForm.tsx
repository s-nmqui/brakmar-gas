"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveMidesAction, type AdminFormState } from "@/app/actions/content";
import { centsToInput } from "@/lib/money";
import type { MidesInfo } from "@/lib/types";
import { Alert, Button } from "../ui";

const initialState: AdminFormState = { ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar información MIDES"}
    </Button>
  );
}

export function MidesForm({ mides }: { mides: MidesInfo }) {
  const [state, formAction] = useActionState(saveMidesAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Publicá únicamente información oficial y verificada del beneficio MIDES.
        Los datos incorrectos pueden perjudicar a tus clientes.
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={mides.description}
          className="field-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="normalPrice" className="field-label">
            Precio normal (UYU)
          </label>
          <input
            id="normalPrice"
            name="normalPrice"
            inputMode="decimal"
            defaultValue={centsToInput(mides.normalPriceCents)}
            className="field-input"
          />
          {state.fieldErrors?.normalPrice && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.normalPrice}</p>
          )}
        </div>
        <div>
          <label htmlFor="benefitPrice" className="field-label">
            Precio con beneficio (UYU)
          </label>
          <input
            id="benefitPrice"
            name="benefitPrice"
            inputMode="decimal"
            defaultValue={centsToInput(mides.benefitPriceCents)}
            className="field-input"
          />
          {state.fieldErrors?.benefitPrice && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.benefitPrice}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="validFrom" className="field-label">
            Vigente desde
          </label>
          <input
            id="validFrom"
            name="validFrom"
            type="date"
            defaultValue={mides.validFrom || ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="validUntil" className="field-label">
            Vigente hasta
          </label>
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={mides.validUntil || ""}
            className="field-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="requirements" className="field-label">
          Requisitos
        </label>
        <textarea
          id="requirements"
          name="requirements"
          rows={3}
          maxLength={2000}
          defaultValue={mides.requirements}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="eligibility" className="field-label">
          Quiénes pueden acceder
        </label>
        <textarea
          id="eligibility"
          name="eligibility"
          rows={3}
          maxLength={2000}
          defaultValue={mides.eligibility}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="extraConditions" className="field-label">
          Condiciones adicionales
        </label>
        <textarea
          id="extraConditions"
          name="extraConditions"
          rows={3}
          maxLength={2000}
          defaultValue={mides.extraConditions}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className="field-label">
          URL de la fuente oficial
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          maxLength={300}
          defaultValue={mides.sourceUrl}
          className="field-input"
        />
        {state.fieldErrors?.sourceUrl && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.sourceUrl}</p>
        )}
      </div>

      <SaveButton />
    </form>
  );
}