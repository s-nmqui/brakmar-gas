import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  product_type TEXT NOT NULL DEFAULT 'accesorio',
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  promo_price_cents INTEGER,
  image_path TEXT,
  extra_images TEXT NOT NULL DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  availability TEXT NOT NULL DEFAULT 'unknown',
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_label TEXT NOT NULL DEFAULT '',
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mides_info (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  eligibility TEXT NOT NULL DEFAULT '',
  normal_price_cents INTEGER,
  benefit_price_cents INTEGER,
  valid_from TEXT NOT NULL DEFAULT '',
  valid_until TEXT NOT NULL DEFAULT '',
  extra_conditions TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  moderated_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_number TEXT NOT NULL UNIQUE,
  sale_date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  order_id INTEGER UNIQUE,
  channel TEXT NOT NULL DEFAULT 'local',
  payment_method TEXT,
  modality TEXT NOT NULL DEFAULT 'retiro',
  is_mides INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  stock_applied INTEGER NOT NULL DEFAULT 0,
  stock_reverted INTEGER NOT NULL DEFAULT 0,
  cancelled_at TEXT,
  cancel_reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  cost_cents INTEGER,
  quantity INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  locality TEXT NOT NULL DEFAULT '',
  modality TEXT NOT NULL DEFAULT 'domicilio',
  notes TEXT NOT NULL DEFAULT '',
  total_est_cents INTEGER,
  sale_id INTEGER UNIQUE,
  cancel_reason TEXT NOT NULL DEFAULT '',
  cancelled_at TEXT,
  confirmed_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER,
  quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT NOT NULL DEFAULT '',
  reference_id INTEGER,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id INTEGER,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_channel ON sales(channel);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
`;

interface GlobalDb {
  __brakmarDb?: DatabaseSync;
  __brakmarSeeded?: boolean;
}

const g = globalThis as unknown as GlobalDb;

function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string,
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

export function getDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return path.join(process.cwd(), "data", "brakmar.db");
}

export function getDb(): DatabaseSync {
  if (g.__brakmarDb) return g.__brakmarDb;

  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  ensureColumn(db, "products", "cost_cents", "cost_cents INTEGER");
  ensureColumn(db, "products", "updated_at", "updated_at TEXT NOT NULL DEFAULT (datetime('now'))");

  g.__brakmarDb = db;

  if (!g.__brakmarSeeded) {
    seedIfEmpty(db);
    g.__brakmarSeeded = true;
  }

  return db;
}

export function inTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Ya no hay transacción activa.
    }
    throw err;
  }
}

function seedIfEmpty(db: DatabaseSync): void {
  const settingsRow = db
    .prepare("SELECT COUNT(*) AS c FROM settings")
    .get() as { c: number };
  const categoriesRow = db
    .prepare("SELECT COUNT(*) AS c FROM categories")
    .get() as { c: number };
  const productsRow = db
    .prepare("SELECT COUNT(*) AS c FROM products")
    .get() as { c: number };

  if (settingsRow.c === 0) {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    );
    insert.run("site_config", JSON.stringify({}));
  }

  if (categoriesRow.c === 0) {
    const insert = db.prepare(
      "INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)",
    );
    [
      ["Garrafas", "garrafas", 1],
      ["Envases vacíos", "envases-vacios", 2],
      ["Recargas", "recargas", 3],
      ["Accesorios", "accesorios", 4],
    ].forEach((row) => insert.run(row[0], row[1], row[2]));
  }

  if (productsRow.c === 0) {
    seedProducts(db);
  }

  const faqsRow = db.prepare("SELECT COUNT(*) AS c FROM faqs").get() as {
    c: number;
  };
  if (faqsRow.c === 0) seedFaqs(db);

  const midesRow = db
    .prepare("SELECT COUNT(*) AS c FROM mides_info")
    .get() as { c: number };
  if (midesRow.c === 0) {
    db.prepare(
      `INSERT INTO mides_info (id, description, requirements, eligibility, extra_conditions, source_url)
       VALUES (1, ?, ?, ?, ?, ?)`,
    ).run(
      "BrakMar Gas puede ofrecer el beneficio MIDES para la compra de garrafas. La información oficial sobre requisitos, montos y vigencia debe ser verificada y completada por el responsable del negocio antes de publicarse.",
      "Pendiente de verificar y completar según la normativa oficial vigente.",
      "Pendiente de verificar y completar según la normativa oficial vigente.",
      "Consultá por WhatsApp para confirmar si el beneficio está vigente y cómo aplicarlo en tu compra.",
      "",
    );
  }
}

function categoryId(db: DatabaseSync, slug: string): number | null {
  const row = db
    .prepare("SELECT id FROM categories WHERE slug = ?")
    .get(slug) as { id: number } | undefined;
  return row?.id ?? null;
}

function seedProducts(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT INTO products
      (name, slug, category_id, product_type, description, price_cents, promo_price_cents,
       image_path, extra_images, stock, low_stock_threshold, availability, is_featured, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const items: Array<[string, string, string, string, string, number]> = [
    [
      "Garrafa uruguaya de 13 kg",
      "garrafa-uruguaya-13-kg",
      "garrafas",
      "garrafa_llena",
      "Garrafa de 13 kg en formato uruguayo, con contenido. Consultar disponibilidad y precio actualizado.",
      0,
    ],
    [
      "Garrafa brasileña de 13 kg",
      "garrafa-brasilena-13-kg",
      "garrafas",
      "garrafa_llena",
      "Garrafa de 13 kg en formato brasileño, con contenido. Consultar disponibilidad y precio actualizado.",
      0,
    ],
    [
      "Envase vacío de garrafa de 13 kg",
      "envase-vacio-garrafa-13-kg",
      "envases-vacios",
      "garrafa_vacia",
      "Envase de garrafa de 13 kg sin contenido. Consultar disponibilidad y precio actualizado.",
      0,
    ],
    [
      "Recarga de garrafa de 13 kg",
      "recarga-garrafa-13-kg",
      "recargas",
      "recarga",
      "Carga o recarga de garrafa de 13 kg. Se realiza sobre tu envase en condiciones. Consultar disponibilidad.",
      0,
    ],
    [
      "Válvulas",
      "valvulas",
      "accesorios",
      "accesorio",
      "Válvulas para garrafas. Consultar disponibilidad y compatibilidad.",
      0,
    ],
    [
      "Bases para garrafas",
      "bases-para-garrafas",
      "accesorios",
      "accesorio",
      "Bases para apoyar garrafas. Consultar disponibilidad.",
      0,
    ],
    [
      "Cabezales para garrafas",
      "cabezales-para-garrafas",
      "accesorios",
      "accesorio",
      "Cabezales para garrafas. Consultar disponibilidad y compatibilidad.",
      0,
    ],
    [
      "Gomitas pequeñas",
      "gomitas-pequenas",
      "accesorios",
      "accesorio",
      "Gomitas pequeñas para garrafas. Consultar disponibilidad.",
      0,
    ],
    [
      "Gomitas grandes",
      "gomitas-grandes",
      "accesorios",
      "accesorio",
      "Gomitas grandes para garrafas. Consultar disponibilidad.",
      0,
    ],
  ];

  // tercer argumento: is_featured (1) para los destacados
  for (const [name, slug, cat, type, desc, featured] of items) {
    insert.run(
      name,
      slug,
      categoryId(db, cat),
      type,
      desc,
      null,
      null,
      null,
      "[]",
      0,
      3,
      "unknown",
      featured,
      1,
    );
  }

  db.prepare(
    "UPDATE products SET is_featured = 1 WHERE slug IN (?, ?)",
  ).run("garrafa-uruguaya-13-kg", "recarga-garrafa-13-kg");
}

function seedFaqs(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT INTO faqs (question, answer, category, sort_order, is_published)
     VALUES (?, ?, ?, ?, 1)`,
  );
  const rows: Array<[string, string, string, number]> = [
    [
      "¿Qué garrafas venden?",
      "Trabajamos con garrafas de 13 kg en formato uruguayo y brasileño, además de cargas o recargas y accesorios. Las garrafas disponibles y sus precios se actualizan en el catálogo; si no ves un precio, consultanos por WhatsApp.",
      "Productos",
      1,
    ],
    [
      "¿Cuál es la diferencia entre un envase vacío y una recarga?",
      "Un envase vacío es la garrafa sin contenido. Una recarga es el servicio de carga sobre una garrafa en condiciones. Son productos distintos: revisá la categoría de cada ítem antes de pedir.",
      "Productos",
      2,
    ],
    [
      "¿Qué accesorios tienen disponibles?",
      "Ofrecemos válvulas, bases y cabezales para garrafas, y gomitas pequeñas y grandes. La disponibilidad puede variar; consultanos por WhatsApp.",
      "Productos",
      3,
    ],
    [
      "¿Cómo hago un pedido?",
      "Elegí los productos, sumalos al pedido, completá tus datos y abrí WhatsApp con el mensaje preparado. BrakMar Gas te confirma disponibilidad, precio final y entrega. Enviar el mensaje no confirma automáticamente el pedido.",
      "Pedidos",
      4,
    ],
    [
      "¿Hacen entregas en Belén?",
      "Sí, realizamos entrega a domicilio en toda la localidad de Belén.",
      "Entregas",
      5,
    ],
    [
      "¿Envían a otras localidades?",
      "Los envíos a otras partes de Uruguay están sujetos a cobertura, disponibilidad y condiciones logísticas a confirmar con BrakMar Gas. Consultanos por WhatsApp.",
      "Entregas",
      6,
    ],
    [
      "¿Cuál es el horario de atención?",
      "Atendemos todos los días, de lunes a domingo, de 09:00 a 21:00.",
      "Atención",
      7,
    ],
    [
      "¿Qué medios de pago aceptan?",
      "Los medios de pago están pendientes de confirmación por parte de BrakMar Gas. Consultanos por WhatsApp antes de tu compra.",
      "Pagos",
      8,
    ],
    [
      "¿Cómo funciona el beneficio MIDES?",
      "La información oficial del beneficio MIDES (requisitos, montos y vigencia) se publica únicamente cuando está verificada. Consultanos por WhatsApp para confirmar si aplica a tu compra.",
      "MIDES",
      9,
    ],
    [
      "¿Cómo sé si un producto está disponible?",
      "Cada producto muestra su estado de disponibilidad. Si figura como “Consultar disponibilidad”, escribinos por WhatsApp para confirmarlo al momento de tu pedido.",
      "Productos",
      10,
    ],
  ];
  rows.forEach((r) => insert.run(r[0], r[1], r[2], r[3]));
}
