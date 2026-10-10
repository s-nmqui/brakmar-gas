import { getDb, inTransaction } from "./db";
import { getProductById } from "./products-repo";
import { logAudit } from "./audit";
import { nowIso } from "./period";
import type { DatabaseSync } from "node:sqlite";

export type SaleSource = "manual" | "order";
export type SaleChannel = "local" | "telefono" | "whatsapp" | "otro";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "otro";
export type Modality = "retiro" | "domicilio";
export type SaleStatus = "completed" | "cancelled";

export interface SaleItemRow {
  id: number;
  saleId: number;
  productId: number | null;
  productName: string;
  unitPriceCents: number;
  costCents: number | null;
  quantity: number;
  discountCents: number;
  lineTotalCents: number;
}

export interface SaleRow {
  id: number;
  saleNumber: string;
  saleDate: string;
  source: SaleSource;
  orderId: number | null;
  channel: SaleChannel;
  paymentMethod: PaymentMethod | null;
  modality: Modality;
  isMides: boolean;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: SaleStatus;
  stockApplied: boolean;
  stockReverted: boolean;
  cancelledAt: string | null;
  cancelReason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface SaleWithItems {
  sale: SaleRow;
  items: SaleItemRow[];
}

export interface SaleItemInput {
  productId: number | null;
  unitPriceCents: number;
  quantity: number;
}

export interface SaleInput {
  saleDateIso: string;
  source: SaleSource;
  orderId?: number | null;
  channel: SaleChannel;
  paymentMethod: PaymentMethod | null;
  modality: Modality;
  isMides: boolean;
  discountCents: number;
  notes: string;
  actor: string;
  items: SaleItemInput[];
}

export interface SaleFilter {
  status?: SaleStatus | "all";
  fromMs?: number;
  toMs?: number;
  productId?: number;
  channel?: SaleChannel | "all";
  paymentMethod?: PaymentMethod | "all";
  source?: SaleSource | "all";
}

interface SaleRowRaw {
  id: number;
  sale_number: string;
  sale_date: string;
  source: string;
  order_id: number | null;
  channel: string;
  payment_method: string | null;
  modality: string;
  is_mides: number;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  status: string;
  stock_applied: number;
  stock_reverted: number;
  cancelled_at: string | null;
  cancel_reason: string;
  notes: string;
  created_by: string;
  created_at: string;
}

interface ComputedItem {
  productId: number | null;
  productName: string;
  unitPriceCents: number;
  costCents: number | null;
  quantity: number;
  lineTotalCents: number;
}

function mapSaleRow(r: SaleRowRaw): SaleRow {
  return {
    id: r.id,
    saleNumber: r.sale_number,
    saleDate: r.sale_date,
    source: r.source as SaleSource,
    orderId: r.order_id,
    channel: r.channel as SaleChannel,
    paymentMethod: r.payment_method as PaymentMethod | null,
    modality: r.modality as Modality,
    isMides: r.is_mides === 1,
    subtotalCents: r.subtotal_cents,
    discountCents: r.discount_cents,
    totalCents: r.total_cents,
    status: r.status as SaleStatus,
    stockApplied: r.stock_applied === 1,
    stockReverted: r.stock_reverted === 1,
    cancelledAt: r.cancelled_at,
    cancelReason: r.cancel_reason,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

const SALE_COLUMNS = `s.id, s.sale_number, s.sale_date, s.source, s.order_id, s.channel,
  s.payment_method, s.modality, s.is_mides, s.subtotal_cents, s.discount_cents,
  s.total_cents, s.status, s.stock_applied, s.stock_reverted, s.cancelled_at,
  s.cancel_reason, s.notes, s.created_by, s.created_at`;

function validateIsoDate(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("La fecha es inválida.");
  return d.toISOString();
}

function clampDiscount(discount: number, subtotal: number): number {
  if (!Number.isFinite(discount) || discount <= 0) return 0;
  return Math.min(Math.floor(discount), subtotal);
}

function computeItems(input: SaleInput): {
  items: ComputedItem[];
  subtotalCents: number;
} {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("La venta debe tener al menos un producto.");
  }
  const items: ComputedItem[] = [];
  let subtotal = 0;
  for (const raw of input.items) {
    const quantity = Math.floor(raw.quantity);
    const unitPrice = Math.floor(raw.unitPriceCents);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
      throw new Error("Cantidad inválida.");
    }
    if (!Number.isInteger(unitPrice) || unitPrice < 0 || unitPrice > 100_000_000) {
      throw new Error("Precio unitario inválido.");
    }
    let name: string | null = null;
    let costCents: number | null = null;
    if (raw.productId != null) {
      const p = getProductById(raw.productId);
      if (!p) throw new Error("Producto no encontrado.");
      name = p.name;
      costCents = p.costCents;
    }
    if (!name) throw new Error("Producto inválido.");
    const lineTotalCents = unitPrice * quantity;
    subtotal += lineTotalCents;
    items.push({
      productId: raw.productId,
      productName: name,
      unitPriceCents: unitPrice,
      costCents,
      quantity,
      lineTotalCents,
    });
  }
  return { items, subtotalCents: subtotal };
}

function nextSaleNumber(saleDateIso: string): string {
  const db = getDb();
  const year = saleDateIso.slice(0, 4);
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM sales WHERE strftime('%Y', sale_date) = ?`)
    .get(year) as { c: number };
  let seq = row.c + 1;
  let number = `V-${year}-${String(seq).padStart(4, "0")}`;
  let guard = 0;
  while (db.prepare("SELECT id FROM sales WHERE sale_number = ?").get(number) && guard < 1000) {
    seq += 1;
    number = `V-${year}-${String(seq).padStart(4, "0")}`;
    guard += 1;
  }
  return number;
}

interface StockItem {
  productId: number | null;
  quantity: number;
}

export function applyStock(
  db: DatabaseSync,
  items: StockItem[],
  reason: string,
  referenceType: string,
  referenceId: number,
  actor: string,
): void {
  const getStock = db.prepare("SELECT stock FROM products WHERE id = ?");
  const update = db.prepare(
    "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
  );
  const insertMov = db.prepare(
    `INSERT INTO stock_movements (product_id, delta, reason, reference_type, reference_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const it of items) {
    if (it.productId == null) continue;
    const r = getStock.get(it.productId) as { stock: number } | undefined;
    if (!r) continue;
    const change = Math.min(r.stock, it.quantity);
    if (change <= 0) continue;
    update.run(r.stock - change, it.productId);
    insertMov.run(it.productId, -change, reason, referenceType, referenceId, actor);
  }
}

export function revertStock(
  db: DatabaseSync,
  items: StockItem[],
  reason: string,
  referenceType: string,
  referenceId: number,
  actor: string,
): void {
  const getStock = db.prepare("SELECT stock FROM products WHERE id = ?");
  const update = db.prepare(
    "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
  );
  const insertMov = db.prepare(
    `INSERT INTO stock_movements (product_id, delta, reason, reference_type, reference_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const it of items) {
    if (it.productId == null) continue;
    const r = getStock.get(it.productId) as { stock: number } | undefined;
    if (!r) continue;
    update.run(r.stock + it.quantity, it.productId);
    insertMov.run(it.productId, it.quantity, reason, referenceType, referenceId, actor);
  }
}

function getSaleRowById(db: ReturnType<typeof getDb>, id: number): SaleRow | null {
  const row = db
    .prepare(`SELECT ${SALE_COLUMNS} FROM sales s WHERE s.id = ?`)
    .get(id) as SaleRowRaw | undefined;
  return row ? mapSaleRow(row) : null;
}

export function createSale(input: SaleInput): number {
  return inTransaction((db) => createSaleInTx(db, input));
}

export function createSaleInTx(db: DatabaseSync, input: SaleInput): number {
  const { items, subtotalCents } = computeItems(input);
  const discount = clampDiscount(input.discountCents, subtotalCents);
  const totalCents = subtotalCents - discount;
  const saleDate = validateIsoDate(input.saleDateIso);
  const saleNumber = nextSaleNumber(saleDate);

  const result = db
    .prepare(
      `INSERT INTO sales
        (sale_number, sale_date, source, order_id, channel, payment_method, modality,
         is_mides, subtotal_cents, discount_cents, total_cents, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
    )
    .run(
      saleNumber,
      saleDate,
      input.source,
      input.orderId ?? null,
      input.channel,
      input.paymentMethod ?? null,
      input.modality,
      input.isMides ? 1 : 0,
      subtotalCents,
      discount,
      totalCents,
      input.actor,
    );
  const saleId = Number(result.lastInsertRowid);

  const insertItem = db.prepare(
    `INSERT INTO sale_items
      (sale_id, product_id, product_name, unit_price_cents, cost_cents, quantity, line_total_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const it of items) {
    insertItem.run(saleId, it.productId, it.productName, it.unitPriceCents, it.costCents, it.quantity, it.lineTotalCents);
  }

  if (input.source === "manual") {
    applyStock(db, items, "venta", "sale", saleId, input.actor);
    db.prepare("UPDATE sales SET stock_applied = 1 WHERE id = ?").run(saleId);
  }

  logAudit({
    actor: input.actor,
    action: "sale.create",
    entityType: "sale",
    entityId: saleId,
    details: JSON.stringify({ saleNumber, totalCents }),
  });
  return saleId;
}

export function updateSale(id: number, input: SaleInput): void {
  return inTransaction((db) => {
    const existing = getSaleRowById(db, id);
    if (!existing) throw new Error("La venta no existe.");
    if (existing.source !== "manual") {
      throw new Error("Las ventas generadas por pedidos no se pueden editar.");
    }
    if (existing.status !== "completed") {
      throw new Error("Las ventas anuladas no se pueden editar.");
    }

    const { items, subtotalCents } = computeItems(input);
    const discount = clampDiscount(input.discountCents, subtotalCents);
    const totalCents = subtotalCents - discount;
    const saleDate = validateIsoDate(input.saleDateIso);

    const oldRows = db
      .prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?")
      .all(id) as Array<{ product_id: number | null; quantity: number }>;

    if (existing.stockApplied) {
      adjustStockForEdit(db, oldRows, items, id, input.actor);
    }

    db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(id);
    const insertItem = db.prepare(
      `INSERT INTO sale_items
        (sale_id, product_id, product_name, unit_price_cents, cost_cents, quantity, line_total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const it of items) {
      insertItem.run(id, it.productId, it.productName, it.unitPriceCents, it.costCents, it.quantity, it.lineTotalCents);
    }

    db.prepare(
      `UPDATE sales SET sale_date = ?, channel = ?, payment_method = ?, modality = ?,
        is_mides = ?, subtotal_cents = ?, discount_cents = ?, total_cents = ?, notes = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      saleDate,
      input.channel,
      input.paymentMethod ?? null,
      input.modality,
      input.isMides ? 1 : 0,
      subtotalCents,
      discount,
      totalCents,
      input.notes,
      id,
    );

    logAudit({
      actor: input.actor,
      action: "sale.update",
      entityType: "sale",
      entityId: id,
      details: JSON.stringify({ saleNumber: existing.saleNumber, totalCents }),
    });
  });
}

function adjustStockForEdit(
  db: ReturnType<typeof getDb>,
  oldRows: Array<{ product_id: number | null; quantity: number }>,
  newItems: ComputedItem[],
  saleId: number,
  actor: string,
): void {
  const oldByProduct = new Map<number, number>();
  for (const it of oldRows) {
    if (it.product_id == null) continue;
    oldByProduct.set(it.product_id, (oldByProduct.get(it.product_id) ?? 0) + it.quantity);
  }
  const newByProduct = new Map<number, number>();
  for (const it of newItems) {
    if (it.productId == null) continue;
    newByProduct.set(it.productId, (newByProduct.get(it.productId) ?? 0) + it.quantity);
  }
  const ids = new Set<number>([...oldByProduct.keys(), ...newByProduct.keys()]);

  const getStock = db.prepare("SELECT stock FROM products WHERE id = ?");
  const update = db.prepare(
    "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
  );
  const insertMov = db.prepare(
    `INSERT INTO stock_movements (product_id, delta, reason, reference_type, reference_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  for (const pid of ids) {
    const delta = (oldByProduct.get(pid) ?? 0) - (newByProduct.get(pid) ?? 0);
    if (delta === 0) continue;
    const r = getStock.get(pid) as { stock: number } | undefined;
    if (!r) continue;
    let applied = 0;
    if (delta > 0) {
      update.run(r.stock + delta, pid);
      applied = delta;
    } else {
      const removed = Math.min(r.stock, -delta);
      update.run(r.stock - removed, pid);
      applied = -removed;
    }
    if (applied !== 0) {
      insertMov.run(pid, applied, "ajuste_venta", "sale", saleId, actor);
    }
  }
}

export function cancelSale(id: number, reason: string, actor: string): void {
  return inTransaction((db) => {
    const existing = getSaleRowById(db, id);
    if (!existing) throw new Error("La venta no existe.");
    if (existing.status === "cancelled") throw new Error("La venta ya fue anulada.");

    if (existing.stockApplied && !existing.stockReverted) {
      const rows = db
        .prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?")
        .all(id) as Array<{ product_id: number | null; quantity: number }>;
      const items = rows.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
      revertStock(db, items, "anulacion_venta", "sale", id, actor);
      db.prepare("UPDATE sales SET stock_reverted = 1 WHERE id = ?").run(id);
    }

    const cancelledAt = nowIso();
    db.prepare(
      `UPDATE sales SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(cancelledAt, reason, id);

    if (existing.orderId != null) {
      db.prepare(
        `UPDATE orders SET status = 'cancelled', cancel_reason = ?, cancelled_at = ?, updated_at = datetime('now')
         WHERE id = ?`,
      ).run(reason, cancelledAt, existing.orderId);
    }

    logAudit({
      actor,
      action: "sale.cancel",
      entityType: "sale",
      entityId: id,
      details: JSON.stringify({ saleNumber: existing.saleNumber, reason }),
    });
  });
}

export function getSaleById(id: number): SaleWithItems | null {
  const db = getDb();
  const sale = getSaleRowById(db, id);
  if (!sale) return null;
  const rows = db
    .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id")
    .all(id) as Array<{
    id: number;
    sale_id: number;
    product_id: number | null;
    product_name: string;
    unit_price_cents: number;
    cost_cents: number | null;
    quantity: number;
    discount_cents: number;
    line_total_cents: number;
  }>;
  const items: SaleItemRow[] = rows.map((r) => ({
    id: r.id,
    saleId: r.sale_id,
    productId: r.product_id,
    productName: r.product_name,
    unitPriceCents: r.unit_price_cents,
    costCents: r.cost_cents,
    quantity: r.quantity,
    discountCents: r.discount_cents,
    lineTotalCents: r.line_total_cents,
  }));
  return { sale, items };
}

export function getSaleByOrderId(orderId: number): SaleWithItems | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${SALE_COLUMNS} FROM sales s WHERE s.order_id = ?`)
    .get(orderId) as SaleRowRaw | undefined;
  if (!row) return null;
  return getSaleById(row.id);
}

export function listSales(filter: SaleFilter = {}): SaleRow[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filter.status && filter.status !== "all") {
    clauses.push("s.status = ?");
    params.push(filter.status);
  }
  if (filter.source && filter.source !== "all") {
    clauses.push("s.source = ?");
    params.push(filter.source);
  }
  if (filter.channel && filter.channel !== "all") {
    clauses.push("s.channel = ?");
    params.push(filter.channel);
  }
  if (filter.paymentMethod && filter.paymentMethod !== "all") {
    clauses.push("s.payment_method = ?");
    params.push(filter.paymentMethod);
  }
  if (filter.fromMs != null) {
    clauses.push("s.sale_date >= ?");
    params.push(new Date(filter.fromMs).toISOString());
  }
  if (filter.toMs != null) {
    clauses.push("s.sale_date < ?");
    params.push(new Date(filter.toMs).toISOString());
  }
  if (filter.productId != null) {
    clauses.push(
      "EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id AND si.product_id = ?)",
    );
    params.push(filter.productId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT DISTINCT ${SALE_COLUMNS} FROM sales s ${where} ORDER BY s.sale_date DESC, s.id DESC`)
    .all(...(params as never[])) as SaleRowRaw[];
  return rows.map(mapSaleRow);
}