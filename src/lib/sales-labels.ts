import type { Modality, PaymentMethod, SaleChannel, SaleSource } from "./sales-repo";

export const CHANNEL_LABELS: Record<SaleChannel, string> = {
  local: "Local",
  telefono: "Teléfono",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

export const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABELS) as SaleChannel[];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

export const PAYMENT_OPTIONS = Object.keys(PAYMENT_LABELS) as PaymentMethod[];

export const MODALITY_LABELS: Record<Modality, string> = {
  retiro: "Retiro en comercio",
  domicilio: "A domicilio",
};

export const MODALITY_OPTIONS = Object.keys(MODALITY_LABELS) as Modality[];

export const SOURCE_LABELS: Record<SaleSource, string> = {
  manual: "Manual",
  order: "Pedido web",
};