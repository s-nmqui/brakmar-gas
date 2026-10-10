import { test } from "node:test";
import assert from "node:assert/strict";
import {
  customRangeMs,
  formatLocalDate,
  getPeriodRange,
  localDateStartMs,
  localDateTimeInput,
  localDateTimeToUtcIso,
  localPartsFromUtcMs,
  montevideoDayKey,
  montevideoMonthKey,
  monthLabel,
  previousRange,
  utcMsFromLocalParts,
} from "../src/lib/period.ts";

test("local parts round trip for a Montevideo morning", () => {
  const ms = utcMsFromLocalParts({ year: 2026, month: 10, day: 10, hour: 9, minute: 30 });
  const parts = localPartsFromUtcMs(ms);
  assert.equal(parts.year, 2026);
  assert.equal(parts.month, 10);
  assert.equal(parts.day, 10);
  assert.equal(parts.hour, 9);
  assert.equal(parts.minute, 30);
  // 09:30 -03 => 12:30 UTC
  assert.equal(new Date(ms).toISOString(), "2026-10-10T12:30:00.000Z");
});

test("local parts for UTC midnight maps to previous Montevideo day", () => {
  // 2026-10-10T02:59:59Z => local 2026-10-09T23:59:59
  const ms = Date.UTC(2026, 9, 10, 2, 59, 59);
  const p = localPartsFromUtcMs(ms);
  assert.equal(p.day, 9);
  assert.equal(p.month, 10);
  assert.equal(p.hour, 23);
});

test("localDateStartMs / montevideoDayKey alignment", () => {
  const start = localDateStartMs("2026-10-10");
  assert.ok(!Number.isNaN(start));
  assert.equal(montevideoDayKey(start), "2026-10-10");
  // one ms before local midnight belongs to the previous day
  assert.equal(new Date(start - 1).toISOString(), "2026-10-10T02:59:59.999Z");
  assert.equal(montevideoDayKey(start - 1), "2026-10-09");
});

test("localDateStartMs invalid input", () => {
  assert.ok(Number.isNaN(localDateStartMs("10/10/2026")));
  assert.ok(Number.isNaN(localDateStartMs("")));
});

test("localDateTimeToUtcIso produces UTC ISO with -03 offset applied", () => {
  const iso = localDateTimeToUtcIso("2026-10-10", "15:30");
  assert.equal(iso, "2026-10-10T18:30:00.000Z");
});

test("localDateTimeToUtcIso defaults to midnight local", () => {
  const iso = localDateTimeToUtcIso("2026-10-10");
  assert.equal(iso, "2026-10-10T03:00:00.000Z");
});

test("localDateTimeToUtcIso rejects bad times", () => {
  assert.equal(localDateTimeToUtcIso("2026-10-10", "25:00"), null);
  assert.equal(localDateTimeToUtcIso("2026-13-10", "10:00"), null);
});

test("localDateTimeInput returns date and time parts", () => {
  const ms = utcMsFromLocalParts({ year: 2026, month: 12, day: 5, hour: 8, minute: 7 });
  const { date, time } = localDateTimeInput(ms);
  assert.equal(date, "2026-12-05");
  assert.equal(time, "08:07");
});

test("getPeriodRange month starts on first local day", () => {
  const ref = utcMsFromLocalParts({ year: 2026, month: 10, day: 15, hour: 14 });
  const range = getPeriodRange("month", ref);
  assert.equal(montevideoDayKey(range.startMs), "2026-10-01");
  assert.equal(new Date(range.startMs).toISOString(), "2026-10-01T03:00:00.000Z");
  assert.equal(range.endMs, ref);
});

test("getPeriodRange today covers local midnight", () => {
  const ref = utcMsFromLocalParts({ year: 2026, month: 10, day: 10, hour: 12 });
  const range = getPeriodRange("today", ref);
  assert.equal(montevideoDayKey(range.startMs), "2026-10-10");
  assert.equal(range.endMs, ref);
});

test("getPeriodRange all starts at epoch", () => {
  const range = getPeriodRange("all", Date.now());
  assert.equal(range.startMs, 0);
});

test("customRangeMs inclusive end-of-day", () => {
  const from = "2026-10-01";
  const to = "2026-10-03";
  const r = customRangeMs(from, to);
  assert.ok(r !== null);
  assert.equal(r.endMs - r.startMs, 3 * 86_400_000);
  assert.equal(montevideoDayKey(r.startMs), "2026-10-01");
  assert.equal(montevideoDayKey(r.endMs - 1), "2026-10-03");
});

test("customRangeMs rejects invalid pairs", () => {
  assert.equal(customRangeMs("bad", "2026-10-03"), null);
  assert.equal(customRangeMs("2026-10-05", "2026-10-03"), null);
});

test("previousRange keeps equal length", () => {
  const r = { startMs: 1_000_000, endMs: 9_000_000 };
  const prev = previousRange(r);
  assert.equal(prev.endMs - prev.startMs, r.endMs - r.startMs);
  assert.equal(prev.endMs, r.startMs);
});

test("montevideoMonthKey and monthLabel", () => {
  const ms = utcMsFromLocalParts({ year: 2026, month: 10, day: 3 });
  assert.equal(montevideoMonthKey(ms), "2026-10");
  assert.equal(monthLabel("2026-10"), "Octubre 2026");
  assert.equal(monthLabel("nope"), "nope");
});

test("formatLocalDate without and with time", () => {
  const ms = utcMsFromLocalParts({ year: 2026, month: 10, day: 3, hour: 9, minute: 5 });
  assert.equal(formatLocalDate(ms), "03/10/2026");
  assert.equal(formatLocalDate(ms, true), "03/10/2026 09:05");
});