import { getPeriodRange, customRangeMs, formatLocalDateTime, type PeriodKey } from "@/lib/period";
import { formatCents } from "@/lib/money";
import {
  getBreakdownByChannel,
  getBreakdownByModality,
  getBreakdownByPayment,
  getDailySeries,
  getMarginStats,
  getMonthlySeries,
  getOrdersSummary,
  getRevenueComparison,
  getSalesAggregates,
  getTopProducts,
  type SeriesPoint,
} from "@/lib/stats-repo";
import { PageHeader, StatCard } from "@/components/admin/PageHeader";
import { Alert, Badge, Button, Card, EmptyState, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

const PERIOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este año" },
  { value: "all", label: "Todo" },
  { value: "custom", label: "Personalizado" },
];

function pctDisplay(pct: number | null): string {
  if (pct === null) return "sin datos previos";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs. período anterior`;
}

function RevenueBars({ series }: { series: SeriesPoint[] }) {
  if (series.length === 0) return null;
  const max = Math.max(...series.map((p) => p.revenueNet), 1);
  return (
    <div className="flex items-end gap-0.5 sm:gap-1" style={{ height: 140 }} aria-hidden="true">
      {series.map((p) => (
        <div
          key={p.key}
          title={`${p.label}: ${formatCents(p.revenueNet)} · ${p.count} venta${p.count === 1 ? "" : "s"}`}
          className="group relative min-w-[2px] flex-1 rounded-t bg-brand-500/80 hover:bg-brand-600"
          style={{ height: `${Math.max(2, Math.round((p.revenueNet / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

export default async function AdminEstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const periodRaw = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const requested: string = PERIOD_OPTIONS.some((o) => o.value === periodRaw)
    ? (periodRaw as string)
    : "month";

  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  let period = requested;
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

  const agg = getSalesAggregates(range);
  const comparison = getRevenueComparison(range);
  const margin = getMarginStats(range);
  const topProducts = getTopProducts(range, 5);
  const breakdowns = {
    channel: getBreakdownByChannel(range),
    payment: getBreakdownByPayment(range),
    modality: getBreakdownByModality(range),
  };
  const orders = getOrdersSummary();
  const longRange = range.endMs - range.startMs > 400 * 86_400_000;
  const series = longRange ? getMonthlySeries(range) : getDailySeries(range);

  const rangeLabel = `Período: ${formatLocalDateTime(range.startMs)} — ${formatLocalDateTime(range.endMs)}`;
  const exportQuery = new URLSearchParams({ period });
  if (period === "custom" && from && to) {
    exportQuery.set("from", from);
    exportQuery.set("to", to);
  }

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        description="Métricas de ventas confirmadas y pedidos. Solo se consideran ventas en estado «completada»."
        actions={
          <LinkButton
            href={`/admin/estadisticas/export?${exportQuery.toString()}`}
            variant="outline"
          >
            Exportar CSV
          </LinkButton>
        }
      />

      <Card className="p-4">
        <form method="GET" action="/admin/estadisticas" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label text-xs" htmlFor="period">
              Período
            </label>
            <select id="period" name="period" defaultValue={period} className="field-input">
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {period === "custom" && (
            <>
              <div>
                <label className="field-label text-xs" htmlFor="from">
                  Desde
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={from ?? ""}
                  required
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label text-xs" htmlFor="to">
                  Hasta
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={to ?? ""}
                  required
                  className="field-input"
                />
              </div>
            </>
          )}
          <Button type="submit" size="sm">
            Aplicar
          </Button>
          <span className="text-xs text-neutral-500">{rangeLabel}</span>
        </form>
      </Card>

      {agg.count === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No hay ventas en este período"
            description="Registrá ventas manuales o completá pedidos para ver estadísticas. Con precios y costos cargados también vas a ver el margen bruto."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Ingresos netos"
              value={formatCents(agg.revenueNet) ?? "—"}
              hint={formatCents(comparison.previousRevenue) ? `${formatCents(comparison.previousRevenue)} anterior · ${pctDisplay(comparison.pct)}` : "Sin datos del período anterior"}
              tone="brand"
            />
            <StatCard label="Ventas" value={agg.count} hint="Ventas completadas" />
            <StatCard label="Unidades" value={agg.units} hint="Productos vendidos" />
            <StatCard label="Ticket promedio" value={formatCents(agg.avgTicket) ?? "—"} />
            <StatCard
              label="Margen bruto est."
              value={formatCents(margin.margin) ?? "—"}
              tone={margin.marginPct !== null && margin.margin < 0 ? "danger" : "neutral"}
              hint={
                margin.marginPct !== null
                  ? `${margin.marginPct.toFixed(1)} %${margin.costedCount < margin.totalCount ? ` · parcial (${margin.costedCount}/${margin.totalCount} ventas con costo)` : ""}`
                  : "Sin datos: cargá costos en los productos"
              }
            />
          </div>

          <div className="mt-4">
            <Alert tone="info">
              El margen es una estimación bruta (ingresos menos costo de productos) y no incluye
              gastos como combustible, salarios, comisiones ni impuestos. Si faltan costos, el
              margen se muestra parcial o no disponible.
            </Alert>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pedidos pendientes"
              value={orders.pending}
              tone={orders.pending > 0 ? "warning" : "neutral"}
            />
            <StatCard label="Confirmados" value={orders.confirmed} />
            <StatCard label="Entregados" value={orders.delivered} />
            <StatCard
              label="Cancelados"
              value={orders.cancelled}
              tone={orders.cancelled > 0 ? "danger" : "neutral"}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-bold">
                Evolución {longRange ? "mensual" : "diaria"} de ingresos
              </h2>
              {series.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                  El rango es demasiado amplio para mostrar el detalle.
                </p>
              ) : (
                <>
                  <RevenueBars series={series} />
                  <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
                    <span>{series[0]?.label}</span>
                    <span>{series[series.length - 1]?.label}</span>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-bold">Productos más vendidos</h2>
              {topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">Sin ventas en el período.</p>
              ) : (
                <ul className="mt-3 divide-y divide-neutral-100">
                  {topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.productName}</p>
                        <p className="text-xs text-neutral-500">{p.units} unidad{p.units === 1 ? "" : "es"}</p>
                      </div>
                      <p className="text-sm font-bold">{formatCents(p.revenue)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="font-bold">Por canal</h2>
              <BreakdownTable items={breakdowns.channel} />
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Por medio de pago</h2>
              <BreakdownTable items={breakdowns.payment} />
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Modalidad</h2>
              <BreakdownTable items={breakdowns.modality} />
              {agg.midesCount > 0 && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <Badge tone="brand">MIDES</Badge>
                  <p className="mt-1 text-sm text-neutral-600">
                    {agg.midesCount} venta{agg.midesCount === 1 ? "" : "s"} por {formatCents(agg.midesRevenue)}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownTable({
  items,
}: {
  items: Array<{ label: string; count: number; revenueNet: number }>;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-neutral-500">Sin datos en el período.</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-neutral-100">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 py-2.5">
          <span className="font-semibold">{item.label}</span>
          <span className="text-right">
            <span className="block text-sm font-bold">{formatCents(item.revenueNet)}</span>
            <span className="block text-xs text-neutral-500">{item.count} venta{item.count === 1 ? "" : "s"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}