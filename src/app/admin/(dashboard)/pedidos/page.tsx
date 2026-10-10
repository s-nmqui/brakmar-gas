import {
  listOrders,
  type OrderStatus,
} from "@/lib/orders-repo";
import { formatCents } from "@/lib/money";
import { formatLocalDateTime, localDateStartMs } from "@/lib/period";
import { MODALITY_LABELS } from "@/lib/sales-labels";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrderRowActions } from "@/components/admin/OrderRowActions";
import { Badge, Button, Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

const STATUS_LABELS: Record<OrderStatus, { label: string; tone: "warning" | "neutral" | "success" | "danger" }> = {
  pending: { label: "Pendiente", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "neutral" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

function parseDateMs(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const ms = localDateStartMs(v);
    if (!Number.isNaN(ms)) return ms;
  }
  return undefined;
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const statusRaw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = (["pending", "confirmed", "delivered", "cancelled"] as string[]).includes(
    statusRaw ?? "",
  )
    ? (statusRaw as OrderStatus)
    : undefined;
  const fromMs = parseDateMs(sp.from);
  const toValue = parseDateMs(sp.to);
  const toMs = toValue !== undefined ? toValue + 86_400_000 : undefined;

  const orders = listOrders({ status, fromMs, toMs });
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos enviados desde la web. Completar la venta registra la venta y descuenta stock automáticamente."
      />

      <Card className="p-4">
        <form method="GET" action="/admin/pedidos" className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="field-label text-xs">Desde</label>
            <input type="date" name="from" className="field-input" />
          </div>
          <div>
            <label className="field-label text-xs">Hasta</label>
            <input type="date" name="to" className="field-input" />
          </div>
          <div>
            <label className="field-label text-xs">Estado</label>
            <select defaultValue={status ?? ""} className="field-input" name="status">
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Filtrar
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <Badge tone="neutral">{orders.length} pedido{orders.length === 1 ? "" : "s"}</Badge>
        {pendingCount > 0 && <Badge tone="warning">{pendingCount} pendiente{pendingCount === 1 ? "" : "s"}</Badge>}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No hay pedidos"
            description="Los pedidos enviados desde la web aparecen acá con estado pendiente hasta que los confirmes."
          />
        </div>
      ) : (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Modalidad</th>
                <th className="px-4 py-3">Total est.</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-50 last:border-b-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-neutral-500">
                      {formatLocalDateTime(new Date(order.orderDate).getTime())}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{order.customerName}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-neutral-500">Tel: {order.customerPhone}</p>
                    )}
                    {order.modality === "domicilio" && (
                      <p className="text-xs text-neutral-500">
                        {order.address} · {order.locality}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{MODALITY_LABELS[order.modality]}</td>
                  <td className="px-4 py-3 font-bold">
                    {order.totalEstCents === null ? "A confirmar" : formatCents(order.totalEstCents)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_LABELS[order.status].tone}>
                      {STATUS_LABELS[order.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <OrderRowActions order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Nota: los datos personales de los pedidos solo se muestran en administración y no se
        publican en la web ni en las estadísticas agregadas.
      </p>
    </div>
  );
}