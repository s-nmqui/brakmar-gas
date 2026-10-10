import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { customRangeMs, getPeriodRange, type PeriodKey } from "@/lib/period";
import {
  getDailySeries,
  getMonthlySeries,
  getSalesAggregates,
} from "@/lib/stats-repo";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp: Params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const periodRaw = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const valid = ["today", "7d", "month", "year", "all", "custom"];
  let period = valid.includes(periodRaw ?? "") ? (periodRaw as string) : "month";

  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  let range = getPeriodRange(period as PeriodKey);
  if (period === "custom") {
    const custom = from && to ? customRangeMs(from, to) : null;
    if (!custom) {
      period = "month";
      range = getPeriodRange("month");
    } else {
      range = custom;
    }
  }

  const longRange = range.endMs - range.startMs > 400 * 86_400_000;
  const series = longRange ? getMonthlySeries(range) : getDailySeries(range);
  const totals = getSalesAggregates(range);

  const rows: Array<Record<string, string | number>> = series.map((p) => ({
    Periodo: p.label,
    Ventas: p.count,
    Ingresos_UYU: p.revenueNet,
  }));
  rows.push({
    Periodo: "TOTAL",
    Ventas: totals.count,
    Ingresos_UYU: totals.revenueNet,
  });

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="estadisticas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}