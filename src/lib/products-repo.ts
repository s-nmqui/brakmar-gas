import { getDb } from "./db";
import { slugify } from "./slug";
import type { Availability, Category, Product, ProductType } from "./types";

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  category_name: string | null;
  product_type: string;
  description: string;
  price_cents: number | null;
  promo_price_cents: number | null;
  image_path: string | null;
  extra_images: string;
  stock: number;
  low_stock_threshold: number;
  availability: string;
  is_featured: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

function mapProduct(row: ProductRow): Product {
  let extra: string[] = [];
  try {
    const parsed = JSON.parse(row.extra_images);
    if (Array.isArray(parsed)) extra = parsed.filter((x) => typeof x === "string");
  } catch {
    extra = [];
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    categoryName: row.category_name,
    productType: row.product_type as ProductType,
    description: row.description,
    priceCents: row.price_cents,
    promoPriceCents: row.promo_price_cents,
    imagePath: row.image_path,
    extraImages: extra,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    availability: row.availability as Availability,
    isFeatured: row.is_featured === 1,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export function listCategories(): Category[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, name, slug, sort_order FROM categories ORDER BY sort_order, name")
    .all() as Array<{ id: number; name: string; slug: string; sort_order: number }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    sortOrder: r.sort_order,
  }));
}

export interface ProductQuery {
  onlyPublished?: boolean;
  categorySlug?: string;
  productType?: ProductType;
  featuredOnly?: boolean;
  search?: string;
  limit?: number;
}

export function listProducts(query: ProductQuery = {}): Product[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (query.onlyPublished) clauses.push("p.is_published = 1");
  if (query.featuredOnly) clauses.push("p.is_featured = 1");
  if (query.categorySlug) {
    clauses.push("c.slug = ?");
    params.push(query.categorySlug);
  }
  if (query.productType) {
    clauses.push("p.product_type = ?");
    params.push(query.productType);
  }
  if (query.search) {
    clauses.push("(p.name LIKE ? OR p.description LIKE ?)");
    const like = `%${query.search}%`;
    params.push(like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = query.limit ? `LIMIT ${Math.floor(query.limit)}` : "";
  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY p.is_featured DESC, p.name ASC ${limit}`)
    .all(...(params as never[])) as ProductRow[];
  return rows.map(mapProduct);
}

export function getProductBySlug(slug: string, onlyPublished = true): Product | null {
  const db = getDb();
  const where = onlyPublished ? "WHERE p.slug = ? AND p.is_published = 1" : "WHERE p.slug = ?";
  const row = db.prepare(`${SELECT} ${where}`).get(slug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function getProductById(id: number): Product | null {
  const db = getDb();
  const row = db.prepare(`${SELECT} WHERE p.id = ?`).get(id) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export interface ProductInput {
  name: string;
  slug?: string;
  categoryId: number | null;
  productType: ProductType;
  description: string;
  priceCents: number | null;
  promoPriceCents: number | null;
  imagePath: string | null;
  extraImages: string[];
  stock: number;
  lowStockThreshold: number;
  availability: Availability;
  isFeatured: boolean;
  isPublished: boolean;
}

function uniqueSlug(base: string, ignoreId?: number): string {
  const db = getDb();
  const root = slugify(base) || "producto";
  let candidate = root;
  let i = 2;
  while (true) {
    const row = db
      .prepare("SELECT id FROM products WHERE slug = ?")
      .get(candidate) as { id: number } | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${root}-${i++}`;
  }
}

export function createProduct(input: ProductInput): number {
  const db = getDb();
  const slug = uniqueSlug(input.slug || input.name);
  const result = db
    .prepare(
      `INSERT INTO products
        (name, slug, category_id, product_type, description, price_cents, promo_price_cents,
         image_path, extra_images, stock, low_stock_threshold, availability, is_featured, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      slug,
      input.categoryId,
      input.productType,
      input.description,
      input.priceCents,
      input.promoPriceCents,
      input.imagePath,
      JSON.stringify(input.extraImages),
      input.stock,
      input.lowStockThreshold,
      input.availability,
      input.isFeatured ? 1 : 0,
      input.isPublished ? 1 : 0,
    );
  return Number(result.lastInsertRowid);
}

export function updateProduct(id: number, input: ProductInput): void {
  const db = getDb();
  const slug = uniqueSlug(input.slug || input.name, id);
  db.prepare(
    `UPDATE products SET
       name = ?, slug = ?, category_id = ?, product_type = ?, description = ?,
       price_cents = ?, promo_price_cents = ?, image_path = ?, extra_images = ?,
       stock = ?, low_stock_threshold = ?, availability = ?, is_featured = ?,
       is_published = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.name,
    slug,
    input.categoryId,
    input.productType,
    input.description,
    input.priceCents,
    input.promoPriceCents,
    input.imagePath,
    JSON.stringify(input.extraImages),
    input.stock,
    input.lowStockThreshold,
    input.availability,
    input.isFeatured ? 1 : 0,
    input.isPublished ? 1 : 0,
    id,
  );
}

export function updateStock(
  id: number,
  data: { stock: number; availability: Availability; lowStockThreshold: number },
): void {
  const db = getDb();
  db.prepare(
    `UPDATE products SET stock = ?, availability = ?, low_stock_threshold = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(data.stock, data.availability, data.lowStockThreshold, id);
}

export function deleteProduct(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function listLowStock(thresholdOverride?: number): Product[] {
  const products = listProducts();
  return products.filter((p) => {
    const limit = thresholdOverride ?? p.lowStockThreshold;
    return p.stock <= limit || p.availability === "out_of_stock";
  });
}

export function countPublishedProducts(): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM products WHERE is_published = 1")
    .get() as { c: number };
  return row.c;
}
