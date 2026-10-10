import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getSaleById,
  listSales,
  type SaleChannel,
  type PaymentMethod,
  type SaleSource,
  type SaleStatus,
} from "@/lib/sales-repo";
import { localDateStartMs, formatLocalDateTime } from "@/lib/period";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function parseDateMs(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const ms = localDateStartMs(v);
    if (!Number.isNaN(ms)) return ms;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp: Params = Object.fromEntries(req.nextUrl.searchParams.entries());

  const toValue = parseDateMs(sp.to);
  const toMs = toValue !== undefined ? toValue + 86_400_000 : undefined;

  const filter = {
    status: (typeof sp.status === "string" ? sp.status : "all") as SaleStatus | "all",
    source: (typeof sp.source === "string" ? sp.source : "all") as SaleSource | "all",
    channel: (typeof sp.channel === "string" ? sp.channel : "all") as SaleChannel | "all",
    paymentMethod: (typeof sp.payment === "string" ? sp.payment : "all") as PaymentMethod | "all",
    fromMs: parseDateMs(sp.from),
    toMs,
  };

  const sales = listSales(filter);
  const rows: Array<Record<string, string | number>> = [];

  for (const s of sales) {
    const withItems = getSaleById(s.id);
    const items = withItems?.items ?? [];
    const summary = items
      .map((i) => `${i.quantity} x ${i.productName} (${i.unitPriceCents} UYU c/u)`)
      .join(" | ");
    rows.push({
      Venta: s.saleNumber,
      Fecha: formatLocalDateTime(new Date(s.saleDate).getTime()),
      Estado: s.status === "cancelled" ? "Anulada" : "Completada",
      Origen: s.source === "order" ? "Pedido" : "Manual",
      Canal: s.channel,
      "Medio de pago": s.paymentMethod ?? "",
      Modalidad: s.modality,
      MIDES: s.isMides ? "Sí" : "No",
      Subtotal_UYU: s.subtotalCents,
      Descuento_UYU: s.discountCents,
      Total_UYU: s.totalCents,
      Unidades: items.reduce((a, i) => a + i.quantity, 0),
      Productos: items.length,
      Detalle: summary,
      Notas: s.notes,
    });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}