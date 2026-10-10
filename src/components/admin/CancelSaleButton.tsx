"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelSaleAction, type SaleFormState } from "@/app/actions/sales";
import { Button } from "../ui";

const initialState: SaleFormState = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Anulando…" : "Anular venta"}
    </Button>
  );
}

export function CancelSaleButton({ saleId }: { saleId: number }) {
  const [state, formAction] = useActionState(cancelSaleAction, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={saleId} />
      <input
        type="text"
        name="reason"
        required
        minLength={3}
        placeholder="Motivo de anulación"
        aria-label="Motivo de anulación"
        className="field-input w-full max-w-[220px]"
      />
      <div>
        <Submit />
      </div>
      {state.message && (
        <p
          className={`text-xs ${state.ok ? "text-emerald-600" : "text-red-600"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}