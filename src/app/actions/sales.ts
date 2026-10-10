"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import {
  cancelSale,
  createSale,
  getSaleById,
  updateSale,
  type Modality,
  type PaymentMethod,
  type SaleChannel,
  type SaleItemInput,
} from "@/lib/sales-repo";
import { cleanText, parseIntSafe } from "@/lib/validation";
import { localDateTimeToUtcIso } from "@/lib/period";
import { parsePriceToCents } from "@/lib/money";

export interface SaleFormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const CHANNELS = ["local", "telefono", "whatsapp", "otro"] as const;
const PAYMENTS = ["efectivo", "transferencia", "tarjeta", "otro"] as const;
const MODALITIES = ["retiro", "domicilio"] as const;

function oneOf<T extends string>(value: string, list: readonly T[], fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseItemsJson(value: string): { items: SaleItemInput[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return { error: "El formato de los productos es inválido." };
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "Agregá al menos un producto a la venta." };
  }
  const items: SaleItemInput[] = [];
  for (const el of raw) {
    if (typeof el !== "object" || el === null) return { error: "Un producto es inválido." };
    const o = el as Record<string, unknown>;
    const productId = Number(o.productId);
    const quantity = Number(o.quantity);
    const unitPrice = Number(o.unitPriceCents);
    if (!Number.isInteger(productId) || productId <= 0) {
      return { error: "Un producto es inválido." };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
      return { error: "Una cantidad es inválida." };
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000_00) {
      return { error: "Un precio unitario es inválido." };
    }
    items.push({ productId, quantity, unitPriceCents: Math.round(unitPrice) });
  }
  return { items };
}

export async function saveSaleAction(
  _prev: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await requireAdminAction();

  const id = parseIntSafe(formData.get("id"), 0);
  const existing = id > 0 ? getSaleById(id) : null;
  if (id > 0 && !existing) {
    return { ok: false, message: "La venta no existe." };
  }
  if (existing && existing.sale.source !== "manual") {
    return { ok: false, message: "Las ventas generadas por pedidos no se pueden editar." };
  }
  if (existing && existing.sale.status === "cancelled") {
    return { ok: false, message: "Las ventas anuladas no se pueden editar." };
  }

  const saleDate = cleanText(formData.get("saleDate"), 20);
  const saleTime = cleanText(formData.get("saleTime"), 10);
  const channel = oneOf<SaleChannel>(
    cleanText(formData.get("channel"), 20),
    CHANNELS,
    "local",
  );
  const paymentRaw = cleanText(formData.get("paymentMethod"), 20);
  const paymentMethod = paymentRaw
    ? oneOf<PaymentMethod>(paymentRaw, PAYMENTS, "efectivo")
    : null;
  const modality = oneOf<Modality>(cleanText(formData.get("modality"), 20), MODALITIES, "retiro");
  const isMides = formData.get("isMides") === "on";
  const notes = cleanText(formData.get("notes"), 1000);
  const discountRaw = cleanText(formData.get("discount"), 30);
  const itemsRaw = cleanText(formData.get("items"), 50_000);

  const fieldErrors: Record<string, string> = {};
  const saleDateIso = localDateTimeToUtcIso(saleDate, saleTime);
  if (!saleDateIso) fieldErrors.saleDate = "Ingresá una fecha válida.";

  let discountCents = 0;
  if (discountRaw && discountRaw !== "0") {
    const parsed = parsePriceToCents(discountRaw);
    if (parsed === null) {
      fieldErrors.discount = "El descuento debe ser un número válido.";
    } else {
      discountCents = parsed;
    }
  }

  const parsedItems = parseItemsJson(itemsRaw);
  if ("error" in parsedItems) {
    return {
      ok: false,
      message: "Revisá el detalle de la venta.",
      fieldErrors: { ...fieldErrors, items: parsedItems.error },
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  const input = {
    saleDateIso: saleDateIso as string,
    source: "manual" as const,
    orderId: null,
    channel,
    paymentMethod,
    modality,
    isMides,
    discountCents,
    notes,
    actor: session.username,
    items: parsedItems.items,
  };

  if (id > 0) {
    updateSale(id, input);
  } else {
    createSale(input);
  }

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/admin");
  redirect("/admin/ventas?ok=1");
}

export async function cancelSaleAction(
  _prev: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  const reason = cleanText(formData.get("reason"), 500);

  if (id <= 0) return { ok: false, message: "Venta inválida." };
  if (reason.length < 3) {
    return { ok: false, message: "Ingresá el motivo de la anulación (mínimo 3 caracteres)." };
  }

  try {
    cancelSale(id, reason, session.username);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "No se pudo anular la venta.",
    };
  }

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/admin");
  return { ok: true, message: "Venta anulada y stock restituido." };
}