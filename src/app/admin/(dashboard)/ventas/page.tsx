import Link from "next/link";
import {
  listSales,
  getSaleById,
  type SaleChannel,
  type SaleFilter,
  type PaymentMethod,
  type SaleStatus,
  type SaleSource,
} from "@/lib/sales-repo";
import { listProducts } from "@/lib/products-repo";
import { formatCents } from "@/lib/money";
import { formatLocalDateTime, localDateStartMs } from "@/lib/period";
import {
  CHANNEL_LABELS,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  SOURCE_LABELS,
} from "@/lib/sales-labels";
import { PageHeader } from "@/components/admin/PageHeader";
import { CancelSaleButton } from "@/components/admin/CancelSaleButton";
import { Badge, Button, Card, EmptyState, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function pick(value: string | string[] | undefined, allowed: string[], fallback?: string): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v && allowed.includes(v)) return v;
  return fallback;
}

function parseDateMs(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const ms = localDateStartMs(v);
    if (!Number.isNaN(ms)) return ms;
  }
  return undefined;
}

export default async function AdminVentasPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;

  const channel = pick(sp.channel, Object.keys(CHANNEL_LABELS)) as SaleChannel | undefined;
  const paymentMethod = pick(sp.payment, Object.keys(PAYMENT_LABELS)) as PaymentMethod | undefined;
  const status = pick(sp.status, ["completed", "cancelled"]) as SaleStatus | undefined;
  const source = pick(sp.source, ["manual", "order"]) as SaleSource | undefined;
  const fromMs = parseDateMs(sp.from);
  const toValue = parseDateMs(sp.to);
  const toMs = toValue !== undefined ? toValue + 86_400_000 : undefined;
  const productRaw = Array.isArray(sp.product) ? sp.product[0] : sp.product;
  const productId = productRaw && Number(productRaw) > 0 ? Number(productRaw) : undefined;

  const filter: SaleFilter = {
    channel,
    paymentMethod,
    status,
    source,
    fromMs,
    toMs,
    productId,
  };
  const sales = listSales(filter);
  const products = listProducts();

  const completed = sales.filter((s) => s.status === "completed");
  const revenue = completed.reduce((acc, s) => acc + s.totalCents, 0);
  const countCancelled = sales.filter((s) => s.status === "cancelled").length;

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries({
    channel,
    payment: paymentMethod,
    status,
    source,
    from: fromMs !== undefined ? new Date(fromMs).toISOString().slice(0, 10) : undefined,
    to: toValue !== undefined ? new Date(toValue).toISOString().slice(0, 10) : undefined,
    product: productId,
  })) {
    if (value !== undefined && value !== "") exportQuery.set(key, String(value));
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Registrá ventas manuales, revisá los históricos y aplicá correcciones o anulaciones."
        actions={
          <>
            <LinkButton href="/admin/ventas/nuevo" variant="primary">
              + Nueva venta
            </LinkButton>
            <LinkButton
              href={`/admin/ventas/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ""}`}
              variant="outline"
            >
              Exportar CSV
            </LinkButton>
          </>
        }
      />

      <Card className="p-4">
        <form method="GET" action="/admin/ventas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="field-label text-xs">Desde</label>
            <input
              type="date"
              name="from"
              defaultValue={fromMs !== undefined ? new Date(fromMs).toISOString().slice(0, 10) : ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label text-xs">Hasta</label>
            <input
              type="date"
              name="to"
              defaultValue={toValue !== undefined ? new Date(toValue).toISOString().slice(0, 10) : ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label text-xs">Producto</label>
            <select name="product" defaultValue={productId ?? ""} className="field-input">
              <option value="">Todos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label text-xs">Canal</label>
            <select name="channel" defaultValue={channel ?? ""} className="field-input">
              <option value="">Todos</option>
              {(Object.keys(CHANNEL_LABELS) as SaleChannel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label text-xs">Medio de pago</label>
            <select name="payment" defaultValue={paymentMethod ?? ""} className="field-input">
              <option value="">Todos</option>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label text-xs">Estado</label>
            <select name="status" defaultValue={status ?? ""} className="field-input">
              <option value="">Todos</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Anulada</option>
            </select>
          </div>
          <div>
            <label className="field-label text-xs">Origen</label>
            <select name="source" defaultValue={source ?? ""} className="field-input">
              <option value="">Todos</option>
              {(Object.keys(SOURCE_LABELS) as SaleSource[]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            <Link href="/admin/ventas" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <Badge tone="brand">
          {sales.length} venta{sales.length === 1 ? "" : "s"} en el filtro
        </Badge>
        <Badge tone="success">Ingresos: {formatCents(revenue)}</Badge>
        {countCancelled > 0 && <Badge tone="danger">{countCancelled} anuladas</Badge>}
      </div>

      {sales.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No hay ventas"
            description="Cambiá los filtros o registrá una nueva venta manual desde el botón «+ Nueva venta»."
            action={<LinkButton href="/admin/ventas/nuevo">+ Nueva venta</LinkButton>}
          />
        </div>
      ) : (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Canal / Pago</th>
                <th className="px-4 py-3">Modalidad</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const details = getSaleById(sale.id);
                const editable = sale.status === "completed" && sale.source === "manual";
                return (
                  <tr key={sale.id} className="border-b border-neutral-50 last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold">{sale.saleNumber}</p>
                      <p className="text-xs text-neutral-500">{formatLocalDateTime(new Date(sale.saleDate).getTime())}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={sale.source === "order" ? "warning" : "neutral"}>
                        {SOURCE_LABELS[sale.source]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p>{CHANNEL_LABELS[sale.channel]}</p>
                      <p className="text-xs text-neutral-500">
                        {sale.paymentMethod ? PAYMENT_LABELS[sale.paymentMethod] : "Pago sin registrar"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p>{MODALITY_LABELS[sale.modality]}</p>
                      {sale.isMides && <Badge tone="brand" className="mt-1">MIDES</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-bold">
                      {formatCents(sale.totalCents)}
                      {sale.discountCents > 0 && (
                        <p className="text-xs font-normal text-red-600">
                          − {formatCents(sale.discountCents)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {sale.status === "completed" ? (
                        <Badge tone="success">Completada</Badge>
                      ) : (
                        <Badge tone="danger">Anulada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:text-brand-800">
                          Ver / acciones
                        </summary>
                        <div className="mt-2 space-y-2">
                          {details?.items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-neutral-100 p-2 text-xs">
                              <p className="font-semibold">{item.productName}</p>
                              <p className="text-neutral-500">
                                {item.quantity} × {formatCents(item.unitPriceCents)} ·{" "}
                                {formatCents(item.lineTotalCents)}
                              </p>
                              <p className="text-neutral-400">
                                Costo: {item.costCents === null ? "no cargado" : formatCents(item.costCents)}
                              </p>
                            </div>
                          ))}
                          {details?.sale.notes && (
                            <p className="text-xs text-neutral-500">Notas: {details.sale.notes}</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            {editable && (
                              <Link
                                href={`/admin/ventas/editar/${sale.id}`}
                                className="text-xs font-bold text-brand-700 hover:text-brand-800"
                              >
                                Editar
                              </Link>
                            )}
                          </div>
                          {sale.status === "completed" && <CancelSaleButton saleId={sale.id} />}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}