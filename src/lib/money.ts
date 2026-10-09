export type Cents = number;

const UYU = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCents(cents: Cents | null | undefined): string | null {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return null;
  return UYU.format(cents / 100);
}

export function formatCentsOrConsultar(cents: Cents | null | undefined): string {
  return formatCents(cents) ?? "Consultar precio";
}

export function parsePriceToCents(input: string): Cents | null {
  const raw = input.trim().replace(/\s/g, "").replace(/\$/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: Cents | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}
