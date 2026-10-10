import { getDb } from "./db";
import {
  montevideoDayKey,
  montevideoMonthKey,
  monthLabel,
  previousRange,
  startOfLocalDayMs,
  type PeriodRange,
} from "./period";
import { CHANNEL_LABELS, MODALITY_LABELS, PAYMENT_LABELS } from "./sales-labels";

export interface SalesAggregates {
  count: number;
  units: number;
  revenueNet: number;
  revenueGross: number;
  discountCents: number;
  avgTicket: number;
  midesCount: number;
  midesRevenue: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  revenueNet: number;
  count: number;
}

export interface TopProduct {
  productId: number | null;
  productName: string;
  units: number;
  revenue: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  revenueNet: number;
}

export interface MarginStats {
  totalCount: number;
  costedCount: number;
  revenue: number;
  cogs: number;
  margin: number;
  marginPct: number | null;
}

export interface OrdersSummary {
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
}

export interface RevenueComparison {
  current: number;
  previous: number;
  pct: number | null;
  previousRevenue: number;
}

interface SaleSummary {
  id: number;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  is_mides: number;
  sale_date: string;
}

function isoBounds(range: PeriodRange): [string, string] {
  return [
    new Date(range.startMs).toISOString(),
    new Date(range.endMs).toISOString(),
  ];
}

function salesInRange(range: PeriodRange): SaleSummary[] {
  const db = getDb();
  const [from, to] = isoBounds(range);
  return db
    .prepare(
      `SELECT id, subtotal_cents, discount_cents, total_cents, is_mides, sale_date
       FROM sales
       WHERE status = 'completed' AND sale_date >= ? AND sale_date < ?
       ORDER BY sale_date ASC`,
    )
    .all(from, to) as SaleSummary[];
}

export function getSalesAggregates(range: PeriodRange): SalesAggregates {
  const db = getDb();
  const [from, to] = isoBounds(range);
  const rows = salesInRange(range);

  let revenueNet = 0;
  let revenueGross = 0;
  let discountCents = 0;
  let midesRevenue = 0;
  let midesCount = 0;
  for (const r of rows) {
    revenueNet += r.total_cents;
    revenueGross += r.subtotal_cents;
    discountCents += r.discount_cents;
    if (r.is_mides === 1) {
      midesRevenue += r.total_cents;
      midesCount += 1;
    }
  }

  const unitsRow = db
    .prepare(
      `SELECT COALESCE(SUM(si.quantity), 0) AS units
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed' AND s.sale_date >= ? AND s.sale_date < ?`,
    )
    .get(from, to) as { units: number };

  const count = rows.length;
  return {
    count,
    units: unitsRow.units,
    revenueNet,
    revenueGross,
    discountCents,
    avgTicket: count > 0 ? Math.round(revenueNet / count) : 0,
    midesCount,
    midesRevenue,
  };
}

export function getRevenueComparison(range: PeriodRange): RevenueComparison {
  const current = getSalesAggregates(range).revenueNet;
  const prev = getSalesAggregates(previousRange(range)).revenueNet;
  let pct: number | null = null;
  if (prev > 0) {
    pct = ((current - prev) / prev) * 100;
  }
  return { current, previous: prev, pct, previousRevenue: prev };
}

export function getDailySeries(range: PeriodRange): SeriesPoint[] {
  if (range.endMs - range.startMs > 400 * 86_400_000) return [];
  const rows = salesInRange(range);
  const byDay = new Map<string, { revenueNet: number; count: number }>();
  for (const r of rows) {
    const key = montevideoDayKey(new Date(r.sale_date).getTime());
    const cur = byDay.get(key) ?? { revenueNet: 0, count: 0 };
    cur.revenueNet += r.total_cents;
    cur.count += 1;
    byDay.set(key, cur);
  }
  const out: SeriesPoint[] = [];
  for (let t = startOfLocalDayMs(range.startMs); t < range.endMs; t += 86_400_000) {
    const key = montevideoDayKey(t);
    const b = byDay.get(key);
    const [, m, d] = key.split("-");
    out.push({
      key,
      label: `${d}/${m}`,
      revenueNet: b?.revenueNet ?? 0,
      count: b?.count ?? 0,
    });
  }
  return out;
}

export function getMonthlySeries(range: PeriodRange): SeriesPoint[] {
  const rows = salesInRange(range);
  const byMonth = new Map<string, { revenueNet: number; count: number }>();
  for (const r of rows) {
    const key = montevideoMonthKey(new Date(r.sale_date).getTime());
    const cur = byMonth.get(key) ?? { revenueNet: 0, count: 0 };
    cur.revenueNet += r.total_cents;
    cur.count += 1;
    byMonth.set(key, cur);
  }
  const keys = [...byMonth.keys()].sort();
  return keys.map((key) => ({
    key,
    label: monthLabel(key),
    revenueNet: byMonth.get(key)?.revenueNet ?? 0,
    count: byMonth.get(key)?.count ?? 0,
  }));
}

export function getTopProducts(range: PeriodRange, limit = 5): TopProduct[] {
  const db = getDb();
  const [from, to] = isoBounds(range);
  const rows = db
    .prepare(
      `SELECT si.product_id AS product_id, si.product_name AS product_name,
              SUM(si.quantity) AS units, SUM(si.line_total_cents) AS revenue
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed' AND s.sale_date >= ? AND s.sale_date < ?
       GROUP BY si.product_id, si.product_name
       ORDER BY units DESC, revenue DESC
       LIMIT ?`,
    )
    .all(from, to, Math.max(1, limit)) as Array<{
    product_id: number | null;
    product_name: string;
    units: number;
    revenue: number;
  }>;
  return rows.map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    units: r.units,
    revenue: r.revenue,
  }));
}

export function getBreakdownByChannel(range: PeriodRange): BreakdownItem[] {
  return breakdownByField(range, "channel", CHANNEL_LABELS);
}

export function getBreakdownByPayment(range: PeriodRange): BreakdownItem[] {
  return breakdownByField(range, "payment_method", PAYMENT_LABELS);
}

export function getBreakdownByModality(range: PeriodRange): BreakdownItem[] {
  return breakdownByField(range, "modality", MODALITY_LABELS);
}

function breakdownByField(
  range: PeriodRange,
  field: "channel" | "payment_method" | "modality",
  labels: Record<string, string>,
): BreakdownItem[] {
  const db = getDb();
  const [from, to] = isoBounds(range);
  const rows = db
    .prepare(
      `SELECT ${field} AS k, COUNT(*) AS c, SUM(total_cents) AS revenue
       FROM sales
       WHERE status = 'completed' AND sale_date >= ? AND sale_date < ?
       GROUP BY ${field}
       ORDER BY revenue DESC`,
    )
    .all(from, to) as Array<{ k: string | null; c: number; revenue: number }>;
  return rows.map((r) => ({
    key: r.k ?? "sin_dato",
    label: (r.k && labels[r.k]) || "Sin dato",
    count: r.c,
    revenueNet: r.revenue,
  }));
}

export function getMarginStats(range: PeriodRange): MarginStats {
  const db = getDb();
  const [from, to] = isoBounds(range);
  const rows = db
    .prepare(
      `SELECT s.total_cents,
              COUNT(si.id) AS n,
              COUNT(si.cost_cents) AS costed,
              COALESCE(SUM(si.cost_cents * si.quantity), 0) AS cogs
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       WHERE s.status = 'completed' AND s.sale_date >= ? AND s.sale_date < ?
       GROUP BY s.id`,
    )
    .all(from, to) as Array<{
    total_cents: number;
    n: number;
    costed: number;
    cogs: number;
  }>;

  let costedCount = 0;
  let revenue = 0;
  let cogs = 0;
  for (const r of rows) {
    if (r.n === r.costed) {
      costedCount += 1;
      revenue += r.total_cents;
      cogs += r.cogs;
    }
  }
  const margin = revenue - cogs;
  return {
    totalCount: rows.length,
    costedCount,
    revenue,
    cogs,
    margin,
    marginPct: revenue > 0 ? (margin / revenue) * 100 : null,
  };
}

export function getOrdersSummary(): OrdersSummary {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM orders`,
    )
    .get() as { pending: number; confirmed: number; delivered: number; cancelled: number };
  return {
    pending: row.pending ?? 0,
    confirmed: row.confirmed ?? 0,
    delivered: row.delivered ?? 0,
    cancelled: row.cancelled ?? 0,
  };
}

export function countSalesByStatus(status: "completed" | "cancelled"): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM sales WHERE status = ?")
    .get(status) as { c: number };
  return row.c;
}