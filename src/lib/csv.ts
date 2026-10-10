export type CsvValue = string | number | null | undefined;

function escapeCell(value: CsvValue): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/["\r\n,]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Array<Record<string, CsvValue>>): string {
  if (rows.length === 0) return "\uFEFF";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
  ];
  return "\uFEFF" + lines.join("\r\n");
}