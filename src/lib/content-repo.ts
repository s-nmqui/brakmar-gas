import { getDb } from "./db";
import { slugify } from "./slug";
import type { Faq, MidesInfo, Promotion, Review } from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

/* ----------------------------- Promociones ----------------------------- */

interface PromotionRow {
  id: number;
  title: string;
  slug: string;
  description: string;
  discount_label: string;
  product_id: number | null;
  product_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function mapPromotion(row: PromotionRow): Promotion {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    discountLabel: row.discount_label,
    productId: row.product_id,
    productName: row.product_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PROMO_SELECT = `
  SELECT pr.*, p.name AS product_name
  FROM promotions pr
  LEFT JOIN products p ON p.id = pr.product_id
`;

function uniquePromoSlug(base: string, ignoreId?: number): string {
  const db = getDb();
  const root = slugify(base) || "promocion";
  let candidate = root;
  let i = 2;
  while (true) {
    const row = db
      .prepare("SELECT id FROM promotions WHERE slug = ?")
      .get(candidate) as { id: number } | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${root}-${i++}`;
  }
}

export function listPromotions(onlyCurrentlyActive = false): Promotion[] {
  const db = getDb();
  const rows = db
    .prepare(`${PROMO_SELECT} ORDER BY pr.is_active DESC, pr.created_at DESC`)
    .all() as PromotionRow[];
  const all = rows.map(mapPromotion);
  if (!onlyCurrentlyActive) return all;
  const now = Date.now();
  return all.filter((p) => {
    if (!p.isActive) return false;
    if (p.startsAt && new Date(p.startsAt).getTime() > now) return false;
    if (p.endsAt) {
      const end = new Date(p.endsAt);
      end.setHours(23, 59, 59, 999);
      if (end.getTime() < now) return false;
    }
    return true;
  });
}

export function getPromotionById(id: number): Promotion | null {
  const db = getDb();
  const row = db.prepare(`${PROMO_SELECT} WHERE pr.id = ?`).get(id) as
    | PromotionRow
    | undefined;
  return row ? mapPromotion(row) : null;
}

export interface PromotionInput {
  title: string;
  description: string;
  discountLabel: string;
  productId: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export function createPromotion(input: PromotionInput): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO promotions
        (title, slug, description, discount_label, product_id, starts_at, ends_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      uniquePromoSlug(input.title),
      input.description,
      input.discountLabel,
      input.productId,
      input.startsAt,
      input.endsAt,
      input.isActive ? 1 : 0,
    );
  return Number(result.lastInsertRowid);
}

export function updatePromotion(id: number, input: PromotionInput): void {
  const db = getDb();
  db.prepare(
    `UPDATE promotions SET
       title = ?, slug = ?, description = ?, discount_label = ?, product_id = ?,
       starts_at = ?, ends_at = ?, is_active = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.title,
    uniquePromoSlug(input.title, id),
    input.description,
    input.discountLabel,
    input.productId,
    input.startsAt,
    input.endsAt,
    input.isActive ? 1 : 0,
    id,
  );
}

export function deletePromotion(id: number): void {
  getDb().prepare("DELETE FROM promotions WHERE id = ?").run(id);
}

/* ------------------------------- Preguntas ------------------------------ */

interface FaqRow {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

function mapFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    sortOrder: row.sort_order,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listFaqs(onlyPublished = false): Faq[] {
  const db = getDb();
  const where = onlyPublished ? "WHERE is_published = 1" : "";
  const rows = db
    .prepare(`SELECT * FROM faqs ${where} ORDER BY sort_order, id`)
    .all() as FaqRow[];
  return rows.map(mapFaq);
}

export function getFaqById(id: number): Faq | null {
  const row = getDb().prepare("SELECT * FROM faqs WHERE id = ?").get(id) as
    | FaqRow
    | undefined;
  return row ? mapFaq(row) : null;
}

export interface FaqInput {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
}

export function createFaq(input: FaqInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO faqs (question, answer, category, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.question,
      input.answer,
      input.category,
      input.sortOrder,
      input.isPublished ? 1 : 0,
    );
  return Number(result.lastInsertRowid);
}

export function updateFaq(id: number, input: FaqInput): void {
  getDb()
    .prepare(
      `UPDATE faqs SET question = ?, answer = ?, category = ?, sort_order = ?,
       is_published = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .run(
      input.question,
      input.answer,
      input.category,
      input.sortOrder,
      input.isPublished ? 1 : 0,
      id,
    );
}

export function deleteFaq(id: number): void {
  getDb().prepare("DELETE FROM faqs WHERE id = ?").run(id);
}

/* --------------------------------- MIDES -------------------------------- */

interface MidesRow {
  description: string;
  requirements: string;
  eligibility: string;
  normal_price_cents: number | null;
  benefit_price_cents: number | null;
  valid_from: string;
  valid_until: string;
  extra_conditions: string;
  source_url: string;
  updated_at: string;
}

function mapMides(row: MidesRow): MidesInfo {
  return {
    description: row.description,
    requirements: row.requirements,
    eligibility: row.eligibility,
    normalPriceCents: row.normal_price_cents,
    benefitPriceCents: row.benefit_price_cents,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    extraConditions: row.extra_conditions,
    sourceUrl: row.source_url,
    updatedAt: row.updated_at,
  };
}

export function getMidesInfo(): MidesInfo {
  const row = getDb().prepare("SELECT * FROM mides_info WHERE id = 1").get() as
    | MidesRow
    | undefined;
  if (!row) {
    return {
      description: "",
      requirements: "",
      eligibility: "",
      normalPriceCents: null,
      benefitPriceCents: null,
      validFrom: "",
      validUntil: "",
      extraConditions: "",
      sourceUrl: "",
      updatedAt: "",
    };
  }
  return mapMides(row);
}

export function updateMidesInfo(input: Omit<MidesInfo, "updatedAt">): void {
  getDb()
    .prepare(
      `UPDATE mides_info SET description = ?, requirements = ?, eligibility = ?,
        normal_price_cents = ?, benefit_price_cents = ?, valid_from = ?, valid_until = ?,
        extra_conditions = ?, source_url = ?, updated_at = datetime('now') WHERE id = 1`,
    )
    .run(
      input.description,
      input.requirements,
      input.eligibility,
      input.normalPriceCents,
      input.benefitPriceCents,
      input.validFrom,
      input.validUntil,
      input.extraConditions,
      input.sourceUrl,
    );
}

/* -------------------------------- Reseñas ------------------------------- */

interface ReviewRow {
  id: number;
  display_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  moderated_at: string | null;
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    displayName: row.display_name,
    rating: row.rating,
    comment: row.comment,
    status: row.status as Review["status"],
    createdAt: row.created_at,
    moderatedAt: row.moderated_at,
  };
}

export function listReviews(status?: Review["status"]): Review[] {
  const db = getDb();
  const where = status ? "WHERE status = ?" : "";
  const rows = db
    .prepare(`SELECT * FROM reviews ${where} ORDER BY created_at DESC`)
    .all(...(status ? [status] : [])) as ReviewRow[];
  return rows.map(mapReview);
}

export function createReview(input: {
  displayName: string;
  rating: number;
  comment: string;
}): number {
  const result = getDb()
    .prepare(
      `INSERT INTO reviews (display_name, rating, comment, status)
       VALUES (?, ?, ?, 'pending')`,
    )
    .run(input.displayName, input.rating, input.comment);
  return Number(result.lastInsertRowid);
}

export function setReviewStatus(
  id: number,
  status: Review["status"],
): void {
  getDb()
    .prepare("UPDATE reviews SET status = ?, moderated_at = ? WHERE id = ?")
    .run(status, nowIso(), id);
}

export function deleteReview(id: number): void {
  getDb().prepare("DELETE FROM reviews WHERE id = ?").run(id);
}

export function getApprovedReviewStats(): {
  count: number;
  average: number | null;
} {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS c, AVG(rating) AS avg FROM reviews WHERE status = 'approved'",
    )
    .get() as { c: number; avg: number | null };
  // No mostramos promedio hasta tener una muestra mínima real.
  const average = row.c >= 3 && row.avg !== null ? Math.round(row.avg * 10) / 10 : null;
  return { count: row.c, average };
}
