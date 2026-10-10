"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdminAction } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanText, detectSpam, parseIntSafe } from "@/lib/validation";
import {
  cancelOrder,
  confirmOrder,
  createWebOrder,
  deliverOrder,
  type OrderModality,
  type WebOrderItem,
} from "@/lib/orders-repo";
import { getSaleByOrderId } from "@/lib/sales-repo";
import { formatCents } from "@/lib/money";

export interface OrderActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  order?: {
    id: number;
    number: string;
    totalEstCents: number | null;
    totalEstLabel: string | null;
  };
}

const MODALITIES = ["retiro", "domicilio"] as const;

function oneOf<T extends string>(value: string, list: readonly T[], fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseItemsJson(value: string): { items: WebOrderItem[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return { error: "El formulario no pudo procesarse. Intentá de nuevo." };
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "El pedido está vacío. Agregá productos antes de confirmar." };
  }
  const items: WebOrderItem[] = [];
  for (const el of raw) {
    if (typeof el !== "object" || el === null) {
      return { error: "El formulario tiene productos inválidos." };
    }
    const o = el as Record<string, unknown>;
    const productId = Number(o.productId);
    const quantity = Number(o.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
      return { error: "El formulario tiene productos inválidos." };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Una cantidad es inválida." };
    }
    items.push({ productId, quantity });
  }
  return { items };
}

export async function createWebOrderAction(
  _prev: OrderActionResult,
  formData: FormData,
): Promise<OrderActionResult> {
  const spamError = detectSpam({
    honeypot: cleanText(formData.get("website"), 200),
    elapsedMs: Number(cleanText(formData.get("elapsedMs"), 20)),
  });
  if (spamError) return { ok: false, message: spamError };

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "desconocido";
  const limit = checkRateLimit(`order:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return {
      ok: false,
      message: "Se registraron demasiados pedidos desde esta conexión. Esperá un rato e intentá de nuevo.",
    };
  }

  const idempotencyKey = cleanText(formData.get("idempotencyKey"), 100);
  const signature = cleanText(formData.get("signature"), 200);
  const name = cleanText(formData.get("name"), 120);
  const phone = cleanText(formData.get("phone"), 30);
  const address = cleanText(formData.get("address"), 200);
  const locality = cleanText(formData.get("locality"), 120);
  const modality = oneOf<OrderModality>(
    cleanText(formData.get("modality"), 20),
    MODALITIES,
    "domicilio",
  );
  const notes = cleanText(formData.get("notes"), 1000);
  const itemsRaw = cleanText(formData.get("items"), 30_000);

  const fieldErrors: Record<string, string> = {};
  if (!idempotencyKey) fieldErrors.form = "El formulario no pudo procesarse. Recargá la página.";
  if (!name || name.length < 2) fieldErrors.name = "Ingresá tu nombre.";
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    fieldErrors.phone = "Ingresá un teléfono válido.";
  }
  if (modality === "domicilio") {
    if (address.trim().length < 3) fieldErrors.address = "Ingresá la dirección de entrega.";
    if (locality.trim().length < 2) fieldErrors.locality = "Indicá la localidad.";
  }

  const parsedItems = parseItemsJson(itemsRaw);
  if ("error" in parsedItems) {
    return {
      ok: false,
      message: "Revisá los datos del pedido.",
      fieldErrors: { ...fieldErrors, items: parsedItems.error },
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los datos del pedido.", fieldErrors };
  }

  try {
    const result = createWebOrder({
      idempotencyKey,
      signature,
      customerName: name,
      customerPhone: phoneDigits,
      address: modality === "domicilio" ? address : "",
      locality: modality === "domicilio" ? locality : "",
      modality,
      notes,
      items: parsedItems.items,
    });

    return {
      ok: true,
      order: {
        id: result.order.id,
        number: result.order.orderNumber,
        totalEstCents: result.order.totalEstCents,
        totalEstLabel:
          result.order.totalEstCents === null
            ? "a confirmar"
            : (formatCents(result.order.totalEstCents) ?? "a confirmar"),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    switch (message) {
      case "CONFLICT":
        return {
          ok: false,
          message: "Tu pedido cambió entre intentos. Recargá la página y volvé a armarlo.",
        };
      case "PRODUCT_DELETED":
        return {
          ok: false,
          message: "Algunos productos ya no están disponibles. Actualizá el pedido.",
        };
      case "EMPTY_ITEMS":
        return { ok: false, message: "El pedido está vacío." };
      default:
        return {
          ok: false,
          message: "No se pudo registrar el pedido. Podés enviarlo igual por WhatsApp.",
        };
    }
  }
}

export async function confirmOrderAction(
  _prev: OrderActionResult,
  formData: FormData,
): Promise<OrderActionResult> {
  const session = await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id <= 0) return { ok: false, message: "Pedido inválido." };
  try {
    confirmOrder(id, session.username);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "No se pudo confirmar." };
  }
  revalidatePaths();
  return { ok: true, message: "Pedido confirmado." };
}

export async function deliverOrderAction(
  _prev: OrderActionResult,
  formData: FormData,
): Promise<OrderActionResult> {
  const session = await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id <= 0) return { ok: false, message: "Pedido inválido." };
  try {
    const saleId = deliverOrder(id, session.username);
    const sale = getSaleByOrderId(id);
    revalidatePaths();
    return {
      ok: true,
      message: sale
        ? `Pedido entregado. Se registró la venta ${sale.sale.saleNumber}.`
        : `Pedido entregado y venta registrada (id ${saleId}).`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "No se pudo completar." };
  }
}

export async function cancelOrderAction(
  _prev: OrderActionResult,
  formData: FormData,
): Promise<OrderActionResult> {
  const session = await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  const reason = cleanText(formData.get("reason"), 500);
  if (id <= 0) return { ok: false, message: "Pedido inválido." };
  if (reason.length < 3) {
    return { ok: false, message: "Ingresá el motivo de la cancelación (mínimo 3 caracteres)." };
  }
  try {
    cancelOrder(id, reason, session.username);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "No se pudo cancelar." };
  }
  revalidatePaths();
  return { ok: true, message: "Pedido cancelado." };
}

function revalidatePaths(): void {
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/admin");
}