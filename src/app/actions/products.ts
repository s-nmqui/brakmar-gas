"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  updateStock,
} from "@/lib/products-repo";
import { requireAdminAction } from "@/lib/auth";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { parsePriceToCents } from "@/lib/money";
import {
  cleanText,
  isNonEmpty,
  normalizeAvailability,
  parseIntSafe,
  stripControlChars,
} from "@/lib/validation";
import type { ProductType } from "@/lib/types";

export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const PRODUCT_TYPES: ProductType[] = [
  "garrafa_llena",
  "garrafa_vacia",
  "recarga",
  "accesorio",
];

function parseProductType(value: string): ProductType {
  return (PRODUCT_TYPES as string[]).includes(value)
    ? (value as ProductType)
    : "accesorio";
}

export async function saveProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminAction();

  const idRaw = parseIntSafe(formData.get("id"), 0);
  const id = idRaw > 0 ? idRaw : null;
  const existing = id ? getProductById(id) : null;

  const name = stripControlChars(cleanText(formData.get("name"), 120));
  const description = stripControlChars(cleanText(formData.get("description"), 2000));
  const categoryIdRaw = parseIntSafe(formData.get("categoryId"), 0);
  const categoryId = categoryIdRaw > 0 ? categoryIdRaw : null;
  const productType = parseProductType(cleanText(formData.get("productType"), 30));
  const priceRaw = cleanText(formData.get("price"), 30);
  const promoRaw = cleanText(formData.get("promoPrice"), 30);
  const priceCents = priceRaw ? parsePriceToCents(priceRaw) : null;
  const promoPriceCents = promoRaw ? parsePriceToCents(promoRaw) : null;
  const stock = Math.max(0, parseIntSafe(formData.get("stock"), 0));
  const lowStockThreshold = Math.max(
    0,
    parseIntSafe(formData.get("lowStockThreshold"), 3),
  );
  const availability = normalizeAvailability(formData.get("availability"));
  const isFeatured = formData.get("isFeatured") === "on";
  const isPublished = formData.get("isPublished") === "on";
  const extraText = cleanText(formData.get("extraImages"), 2000);

  const fieldErrors: Record<string, string> = {};
  if (!isNonEmpty(name)) fieldErrors.name = "El nombre es obligatorio.";
  if (priceRaw && priceCents === null) {
    fieldErrors.price = "El precio debe ser un número válido.";
  }
  if (promoRaw && promoPriceCents === null) {
    fieldErrors.promoPrice = "El precio promocional debe ser un número válido.";
  }

  let imagePath = cleanText(formData.get("imagePath"), 300) || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const upload = await saveUploadedImage(file);
    if (upload.error) {
      fieldErrors.image = upload.error;
    } else if (upload.path) {
      deleteUploadedImage(existing?.imagePath ?? null);
      imagePath = upload.path;
    }
  }
  if (formData.get("removeImage") === "on") {
    deleteUploadedImage(existing?.imagePath ?? imagePath);
    imagePath = null;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  const extraImages = extraText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.startsWith("/"))
    .slice(0, 6);

  const input = {
    name,
    categoryId,
    productType,
    description,
    priceCents,
    promoPriceCents,
    imagePath,
    extraImages,
    stock,
    lowStockThreshold,
    availability,
    isFeatured,
    isPublished,
  };

  if (id && existing) {
    updateProduct(id, input);
  } else {
    createProduct(input);
  }

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/precios");
  revalidatePath("/");
  redirect("/admin/productos?ok=1");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id > 0) {
    const product = getProductById(id);
    if (product) deleteUploadedImage(product.imagePath);
    deleteProduct(id);
  }
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  redirect("/admin/productos?deleted=1");
}

export async function updateStockAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminAction();
  const id = parseIntSafe(formData.get("id"), 0);
  if (id <= 0) return { ok: false, message: "Producto inválido." };
  const stock = Math.max(0, parseIntSafe(formData.get("stock"), 0));
  const lowStockThreshold = Math.max(
    0,
    parseIntSafe(formData.get("lowStockThreshold"), 3),
  );
  const availability = normalizeAvailability(formData.get("availability"));
  updateStock(id, { stock, availability, lowStockThreshold });
  revalidatePath("/admin/stock");
  revalidatePath("/productos");
  return { ok: true, message: "Stock actualizado." };
}
