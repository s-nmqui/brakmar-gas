"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  cancelOrderAction,
  confirmOrderAction,
  deliverOrderAction,
  type OrderActionResult,
} from "@/app/actions/orders";
import type { OrderRow } from "@/lib/orders-repo";
import { Badge, Button } from "../ui";

const initialState: OrderActionResult = { ok: false };

function ActionSubmit({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "danger" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

function Feedback({ message, ok }: { message?: string; ok: boolean }) {
  if (!message) return null;
  return (
    <p className={`text-xs ${ok ? "text-emerald-600" : "text-red-600"}`} role="status">
      {message}
    </p>
  );
}

export function OrderRowActions({ order }: { order: OrderRow }) {
  const [confirmState, confirmAction] = useActionState(confirmOrderAction, initialState);
  const [deliverState, deliverAction] = useActionState(deliverOrderAction, initialState);
  const [cancelState, cancelAction] = useActionState(cancelOrderAction, initialState);

  if (order.status === "delivered") {
    return (
      <div className="space-y-2">
        <Badge tone="success">Venta registrada</Badge>
        {order.saleId != null && (
          <p className="text-xs text-neutral-500">Venta asociada. Para revertirla, anulá la venta.</p>
        )}
      </div>
    );
  }

  if (order.status === "cancelled") {
    return (
      <div className="space-y-2">
        <Badge tone="danger">Cancelado</Badge>
        {order.cancelReason && <p className="text-xs text-neutral-500">{order.cancelReason}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {order.status === "pending" && (
          <form action={confirmAction}>
            <input type="hidden" name="id" value={order.id} />
            <ActionSubmit pendingLabel="Confirmando…" variant="outline">
              Confirmar
            </ActionSubmit>
          </form>
        )}
        <form
          action={deliverAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "¿Registrar la venta de este pedido y marcarlo como entregado? Se descontará el stock.",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={order.id} />
          <ActionSubmit pendingLabel="Completando…">Completar venta</ActionSubmit>
        </form>
        <form action={cancelAction}>
          <input type="hidden" name="id" value={order.id} />
          <input
            type="text"
            name="reason"
            required
            minLength={3}
            placeholder="Motivo"
            aria-label="Motivo de cancelación"
            className="field-input w-full max-w-[140px]"
          />
          <ActionSubmit pendingLabel="Cancelando…" variant="danger">
            Cancelar
          </ActionSubmit>
        </form>
      </div>
      {confirmState.message && (
        <Feedback message={confirmState.message} ok={confirmState.ok} />
      )}
      {deliverState.message && <Feedback message={deliverState.message} ok={deliverState.ok} />}
      {cancelState.message && <Feedback message={cancelState.message} ok={cancelState.ok} />}
    </div>
  );
}