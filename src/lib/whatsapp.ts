import { DEFAULT_SITE_CONFIG } from "./config";
import type { CartItem } from "./types";

export function buildWhatsAppUrl(
  phoneDigits: string,
  message: string,
): string {
  const phone = phoneDigits.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatOrderMessage(
  config: { companyName: string },
  data: {
    name: string;
    phone?: string;
    modality?: "retiro" | "domicilio";
    orderNumber?: string;
    address: string;
    locality: string;
    notes: string;
    items: CartItem[];
    subtotalCents: number | null;
    totalCents: number | null;
    totalLabel: string;
  },
  formatMoney: (cents: number | null) => string,
): string {
  const lines: string[] = [];
  lines.push(`Hola, ${config.companyName}. Quiero consultar o realizar el siguiente pedido.`);
  lines.push("");
  lines.push(`Nombre: ${data.name || "-"}`);
  if (data.phone) {
    lines.push(`Teléfono: ${data.phone}`);
  }
  lines.push(
    `Modalidad: ${data.modality === "retiro" ? "Retiro en tienda" : "Entrega a domicilio"}`,
  );
  if (data.orderNumber) {
    lines.push(`Pedido registrado: ${data.orderNumber}`);
  }
  if (data.modality !== "retiro") {
    lines.push(`Dirección: ${data.address || "-"}`);
    lines.push(`Localidad: ${data.locality || "-"}`);
  }
  if (data.notes.trim()) {
    lines.push(`Instrucciones: ${data.notes.trim()}`);
  }
  lines.push("");
  lines.push("Productos:");
  for (const item of data.items) {
    lines.push(`* ${item.name} x ${item.quantity}`);
  }
  lines.push("");
  if (data.subtotalCents !== null) {
    lines.push(`Subtotal: ${formatMoney(data.subtotalCents)}`);
  }
  if (data.totalCents !== null) {
    lines.push(`Total estimado: ${data.totalLabel}`);
  } else {
    lines.push("Total: a confirmar (precios pendientes de configuración).");
  }
  lines.push("");
  lines.push(
    "¿Me pueden confirmar la disponibilidad, el precio final y las condiciones de entrega? Gracias.",
  );
  return lines.join("\n");
}

export function directProductMessage(
  config: { companyName: string },
  productName: string,
  formatMoney: (cents: number | null) => string,
  priceCents: number | null,
): string {
  const price = formatMoney(priceCents);
  return [
    `Hola, ${config.companyName}. Quiero consultar por el producto:`,
    `* ${productName}${price ? ` (${price})` : ""}`,
    "",
    "¿Me confirman disponibilidad y condiciones de entrega? Gracias.",
  ].join("\n");
}

export { DEFAULT_SITE_CONFIG };
