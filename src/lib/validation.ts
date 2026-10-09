export interface FieldErrors {
  [field: string]: string;
}

export function cleanText(value: FormDataEntryValue | null, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

const URL_RE = /^https?:\/\/[^\s]+$/i;

export function isValidUrl(value: string): boolean {
  if (!value) return true;
  return URL_RE.test(value.trim());
}

export function isValidWhatsapp(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function parseRating(value: FormDataEntryValue | null): number | null {
  const n = Number(cleanText(value, 4));
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export function parseIntSafe(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(cleanText(value, 12));
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  return n;
}

export function normalizeAvailability(
  value: FormDataEntryValue | null,
): "in_stock" | "low_stock" | "out_of_stock" | "unknown" {
  const s = cleanText(value, 20);
  if (s === "in_stock" || s === "low_stock" || s === "out_of_stock") return s;
  return "unknown";
}

export function detectSpam(data: {
  honeypot: string;
  elapsedMs: number;
}): string | null {
  if (data.honeypot.trim()) return "El formulario fue rechazado por seguridad.";
  if (data.elapsedMs > 0 && data.elapsedMs < 1500) {
    return "El formulario fue enviado demasiado rápido. Intentá nuevamente.";
  }
  return null;
}

export function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}
