import { getDb, inTransaction } from "./db";
import { getProductById } from "./products-repo";
import { logAudit } from "./audit";
import { nowIso } from "./period";
import { applyStock, createSaleInTx, type Modality, type SaleItemInput } from "./sales-repo";
import type { DatabaseSync } from "node:sqlite";

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
export type OrderModality = Modality;

export interface OrderItemRow {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  unitPriceCents: number | null;
  quantity: number;
}

export interface OrderRow {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  idempotencyKey: string;
  signature: string;
  customerName: string;
  customerPhone: string;
  address: string;
  locality: string;
  modality: OrderModality;
  notes: string;
  totalEstCents: number | null;
  saleId: number | null;
  cancelReason: string;
  cancelledAt: string | null;
  confirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface OrderWithItems {
  order: OrderRow;
  items: OrderItemRow[];
}

export interface WebOrderItem {
  productId: number;
  quantity: number;
}

export interface WebOrderInput {
  idempotencyKey: string;
  signature: string;
  customerName: string;
  customerPhone: string;
  address: string;
  locality: string;
  modality: OrderModality;
  notes: string;
  items: WebOrderItem[];
}

export interface OrderFilter {
  status?: OrderStatus | "all";
  fromMs?: number;
  toMs?: number;
}

interface OrderRowRaw {
  id: number;
  order_number: string;
  order_date: string;
  status: string;
  idempotency_key: string;
  signature: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  locality: string;
  modality: string;
  notes: string;
  total_est_cents: number | null;
  sale_id: number | null;
  cancel_reason: string;
  cancelled_at: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const ORDER_COLUMNS = `o.id, o.order_number, o.order_date, o.status, o.idempotency_key, o.signature,
  o.customer_name, o.customer_phone, o.address, o.locality, o.modality, o.notes,
  o.total_est_cents, o.sale_id, o.cancel_reason, o.cancelled_at, o.confirmed_at,
  o.delivered_at, o.created_at`;

function mapOrderRow(r: OrderRowRaw): OrderRow {
  return {
    id: r.id,
    orderNumber: r.order_number,
    orderDate: r.order_date,
    status: r.status as OrderStatus,
    idempotencyKey: r.idempotency_key,
    signature: r.signature,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    address: r.address,
    locality: r.locality,
    modality: r.modality as OrderModality,
    notes: r.notes,
    totalEstCents: r.total_est_cents,
    saleId: r.sale_id,
    cancelReason: r.cancel_reason,
    cancelledAt: r.cancelled_at,
    confirmedAt: r.confirmed_at,
    deliveredAt: r.delivered_at,
    createdAt: r.created_at,
  };
}

function getOrderRowById(db: DatabaseSync, id: number): OrderRow | null {
  const row = db
    .prepare(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id = ?`)
    .get(id) as OrderRowRaw | undefined;
  return row ? mapOrderRow(row) : null;
}

function getOrderItems(db: DatabaseSync, orderId: number): OrderItemRow[] {
  const rows = db
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
    .all(orderId) as Array<{
    id: number;
    order_id: number;
    product_id: number | null;
    product_name: string;
    unit_price_cents: number | null;
    quantity: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    productName: r.product_name,
    unitPriceCents: r.unit_price_cents,
    quantity: r.quantity,
  }));
}

function nextOrderNumber(db: DatabaseSync): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM orders WHERE strftime('%Y', order_date) = ?`)
    .get(String(year)) as { c: number };
  let seq = row.c + 1;
  let number = `P-${year}-${String(seq).padStart(4, "0")}`;
  let guard = 0;
  while (db.prepare("SELECT id FROM orders WHERE order_number = ?").get(number) && guard < 1000) {
    seq += 1;
    number = `P-${year}-${String(seq).padStart(4, "0")}`;
    guard += 1;
  }
  return number;
}

export function createWebOrder(input: WebOrderInput): OrderWithItems {
  return inTransaction((db) => {
    const key = input.idempotencyKey.trim();
    if (!key || key.length > 100) throw new Error("INVALID_KEY");

    const existing = db
      .prepare("SELECT id FROM orders WHERE idempotency_key = ?")
      .get(key) as { id: number } | undefined;

    if (existing) {
      const row = getOrderRowById(db, existing.id);
      if (!row) throw new Error("NOT_FOUND");
      if (row.signature !== input.signature) throw new Error("CONFLICT");
      return { order: row, items: getOrderItems(db, existing.id) };
    }

    if (!input.items.length) throw new Error("EMPTY_ITEMS");

    let totalEstCents: number | null = 0;
    const rows: Array<{
      productId: number;
      productName: string;
      unitPriceCents: number | null;
      quantity: number;
    }> = [];
    for (const it of input.items) {
      const quantity = Math.floor(it.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error("INVALID_QUANTITY");
      }
      const product = getProductById(it.productId);
      if (!product) throw new Error("PRODUCT_DELETED");
      const unitPriceCents = product.promoPriceCents ?? product.priceCents;
      if (unitPriceCents == null) {
        totalEstCents = null;
      } else {
        totalEstCents =
          totalEstCents === null ? null : totalEstCents + unitPriceCents * quantity;
      }
      rows.push({ productId: product.id, productName: product.name, unitPriceCents, quantity });
    }

    const orderNumber = nextOrderNumber(db);
    const orderDate = nowIso();
    const result = db
      .prepare(
        `INSERT INTO orders
          (order_number, order_date, status, idempotency_key, signature, customer_name,
           customer_phone, address, locality, modality, notes, total_est_cents)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        orderNumber,
        orderDate,
        key,
        input.signature,
        input.customerName,
        input.customerPhone,
        input.address,
        input.locality,
        input.modality,
        input.notes,
        totalEstCents,
      );
    const orderId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const r of rows) {
      insertItem.run(orderId, r.productId, r.productName, r.unitPriceCents, r.quantity);
    }

    logAudit({
      actor: "web",
      action: "order.create",
      entityType: "order",
      entityId: orderId,
      details: JSON.stringify({ orderNumber, totalEstCents }),
    });

    const order = getOrderRowById(db, orderId);
    if (!order) throw new Error("NOT_FOUND");
    return { order, items: getOrderItems(db, orderId) };
  });
}

export function confirmOrder(id: number, actor: string): void {
  return inTransaction((db) => {
    const order = getOrderRowById(db, id);
    if (!order) throw new Error("El pedido no existe.");
    if (order.status !== "pending") throw new Error("Solo se pueden confirmar pedidos pendientes.");
    db.prepare(
      `UPDATE orders SET status = 'confirmed', confirmed_at = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(nowIso(), id);
    logAudit({ actor, action: "order.confirm", entityType: "order", entityId: id });
  });
}

export function deliverOrder(id: number, actor: string): number {
  return inTransaction((db) => {
    const order = getOrderRowById(db, id);
    if (!order) throw new Error("El pedido no existe.");
    if (order.status === "cancelled") throw new Error("El pedido está cancelado.");
    if (order.status === "delivered") throw new Error("El pedido ya fue entregado.");
    if (order.saleId != null) throw new Error("El pedido ya tiene una venta asociada.");

    const items = getOrderItems(db, id);
    if (items.length === 0) throw new Error("El pedido no tiene productos.");

    const saleItems: SaleItemInput[] = [];
    for (const it of items) {
      if (it.unitPriceCents == null) {
        throw new Error(
          "Hay productos sin precio definido. Configurá el precio de todos los productos antes de completar la venta.",
        );
      }
      if (it.productId == null) {
        throw new Error("El pedido contiene productos ya eliminados del catálogo.");
      }
      saleItems.push({ productId: it.productId, unitPriceCents: it.unitPriceCents, quantity: it.quantity });
    }

    const notes = order.notes ? `Pedido web ${order.orderNumber}. ${order.notes}` : `Pedido web ${order.orderNumber}.`;
    const saleId = createSaleInTx(db, {
      saleDateIso: nowIso(),
      source: "order",
      orderId: id,
      channel: "whatsapp",
      paymentMethod: null,
      modality: order.modality,
      isMides: false,
      discountCents: 0,
      notes,
      actor,
      items: saleItems,
    });

    applyStock(db, saleItems, "venta_pedido", "order", id, actor);
    db.prepare("UPDATE sales SET stock_applied = 1 WHERE id = ?").run(saleId);

    const deliveredAt = nowIso();
    db.prepare(
      `UPDATE orders SET status = 'delivered', delivered_at = ?, sale_id = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(deliveredAt, saleId, id);

    logAudit({ actor, action: "order.deliver", entityType: "order", entityId: id, details: JSON.stringify({ saleId }) });
    return saleId;
  });
}

export function cancelOrder(id: number, reason: string, actor: string): void {
  return inTransaction((db) => {
    const order = getOrderRowById(db, id);
    if (!order) throw new Error("El pedido no existe.");
    if (order.status === "cancelled") throw new Error("El pedido ya está cancelado.");
    if (order.status === "delivered") {
      throw new Error(
        "Este pedido ya fue entregado y tiene una venta asociada. Para revertirlo, anulá la venta correspondiente.",
      );
    }
    db.prepare(
      `UPDATE orders SET status = 'cancelled', cancel_reason = ?, cancelled_at = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(reason, nowIso(), id);
    logAudit({ actor, action: "order.cancel", entityType: "order", entityId: id, details: reason });
  });
}

export function getOrderById(id: number): OrderWithItems | null {
  const db = getDb();
  const row = getOrderRowById(db, id);
  if (!row) return null;
  return { order: row, items: getOrderItems(db, id) };
}

export function listOrders(filter: OrderFilter = {}): OrderRow[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (filter.status && filter.status !== "all") {
    clauses.push("o.status = ?");
    params.push(filter.status);
  }
  if (filter.fromMs != null) {
    clauses.push("o.order_date >= ?");
    params.push(new Date(filter.fromMs).toISOString());
  }
  if (filter.toMs != null) {
    clauses.push("o.order_date < ?");
    params.push(new Date(filter.toMs).toISOString());
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT ${ORDER_COLUMNS} FROM orders o ${where} ORDER BY o.order_date DESC, o.id DESC`)
    .all(...(params as never[])) as OrderRowRaw[];
  return rows.map(mapOrderRow);
}

export function countOrdersByStatus(status: OrderStatus): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM orders WHERE status = ?")
    .get(status) as { c: number };
  return row.c;
}