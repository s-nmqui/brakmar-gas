export const MONTEVIDEO_OFFSET_MS = 3 * 60 * 60 * 1000;

export type PeriodKey = "today" | "7d" | "month" | "year" | "all";

export interface PeriodRange {
  startMs: number;
  endMs: number;
}

function pad(n: number, size = 2): string {
  return String(n).padStart(size, "0");
}

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function localPartsFromUtcMs(utcMs: number): LocalParts {
  const d = new Date(utcMs - MONTEVIDEO_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

export function utcMsFromLocalParts(p: Partial<LocalParts>): number {
  const y = p.year ?? 1970;
  const mo = p.month ?? 1;
  const d = p.day ?? 1;
  const h = p.hour ?? 0;
  const mi = p.minute ?? 0;
  const s = p.second ?? 0;
  return Date.UTC(y, mo - 1, d, h, mi, s) + MONTEVIDEO_OFFSET_MS;
}

export function localDateTimeInput(utcMs = Date.now()): {
  date: string;
  time: string;
} {
  const p = localPartsFromUtcMs(utcMs);
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function localDateStartMs(dateStr: string): number {
  const p = parseDateOnly(dateStr);
  if (!p) return NaN;
  return utcMsFromLocalParts(p);
}

function parseDateOnly(s: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function parseTimeOnly(s: string): { hour: number; minute: number; second: number } | null {
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = Number(m[3] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

export function localDateTimeToUtcIso(
  dateStr: string,
  timeStr?: string,
): string | null {
  const dp = parseDateOnly(dateStr);
  if (!dp) return null;
  let time = { hour: 0, minute: 0, second: 0 };
  if (timeStr && timeStr.trim()) {
    const tp = parseTimeOnly(timeStr);
    if (!tp) return null;
    time = tp;
  }
  const ms = utcMsFromLocalParts({ ...dp, ...time });
  return new Date(ms).toISOString();
}

export function getPeriodRange(period: PeriodKey, refMs = Date.now()): PeriodRange {
  const p = localPartsFromUtcMs(refMs);
  switch (period) {
    case "today": {
      return { startMs: startOfLocalDayMs(refMs), endMs: refMs };
    }
    case "7d": {
      const todayStart = startOfLocalDayMs(refMs);
      return { startMs: todayStart - 6 * 86_400_000, endMs: refMs };
    }
    case "month": {
      return {
        startMs: utcMsFromLocalParts({ year: p.year, month: p.month, day: 1 }),
        endMs: refMs,
      };
    }
    case "year": {
      return {
        startMs: utcMsFromLocalParts({ year: p.year, month: 1, day: 1 }),
        endMs: refMs,
      };
    }
    case "all":
    default:
      return { startMs: 0, endMs: refMs };
  }
}

export function customRangeMs(fromDate: string, toDate: string): PeriodRange | null {
  const start = localDateStartMs(fromDate);
  const end = localDateStartMs(toDate) + 86_400_000;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return null;
  return { startMs: start, endMs: end };
}

export function startOfLocalDayMs(utcMs: number): number {
  const p = localPartsFromUtcMs(utcMs);
  return utcMsFromLocalParts({ year: p.year, month: p.month, day: p.day });
}

export function previousRange(range: PeriodRange): PeriodRange {
  const length = range.endMs - range.startMs;
  return { startMs: range.startMs - length, endMs: range.startMs };
}

export function formatLocalDate(utcMs: number, withTime = false): string {
  const p = localPartsFromUtcMs(utcMs);
  const date = `${pad(p.day)}/${pad(p.month)}/${p.year}`;
  return withTime ? `${date} ${pad(p.hour)}:${pad(p.minute)}` : date;
}

export function formatLocalDateTime(utcMs: number): string {
  return formatLocalDate(utcMs, true);
}

export function montevideoDayKey(utcMs: number): string {
  const p = localPartsFromUtcMs(utcMs);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function montevideoMonthKey(utcMs: number): string {
  const p = localPartsFromUtcMs(utcMs);
  return `${p.year}-${pad(p.month)}`;
}

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthLabel(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const name = MONTH_NAMES[month - 1] ?? key;
  return `${name} ${year}`;
}