"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProductAction, type FormState } from "@/app/actions/products";
import { PRODUCT_TYPE_LABELS, AVAILABILITY_LABELS } from "@/lib/config";
import { centsToInput } from "@/lib/money";
import type { Category, Product, ProductType } from "@/lib/types";
import { Alert, Button, LinkButton } from "../ui";
import { ProductImage } from "../products/ProductImage";
import type { Availability } from "@/lib/types";

const initialState: FormState = { ok: false };

const PRODUCT_TYPE_OPTIONS = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];
const AVAILABILITY_OPTIONS = Object.keys(AVAILABILITY_LABELS) as Availability[];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product | null;
}) {
  const [state, formAction] = useActionState(saveProductAction, initialState);
  const isEdit = Boolean(product);

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="imagePath" value={product?.imagePath ?? ""} />

      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <label htmlFor="name" className="field-label">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              defaultValue={product?.name ?? ""}
              className="field-input"
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={product?.description ?? ""}
              className="field-input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className="field-label">
                Categoría
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId ?? ""}
                className="field-input"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="productType" className="field-label">
                Tipo de producto
              </label>
              <select
                id="productType"
                name="productType"
                defaultValue={product?.productType ?? "accesorio"}
                className="field-input"
              >
                {PRODUCT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {PRODUCT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="price" className="field-label">
                Precio (UYU)
              </label>
              <input
                id="price"
                name="price"
                inputMode="decimal"
                placeholder="Ej.: 950"
                defaultValue={centsToInput(product?.priceCents)}
                className="field-input"
              />
              <FieldError message={state.fieldErrors?.price} />
            </div>
            <div>
              <label htmlFor="promoPrice" className="field-label">
                Precio promocional
              </label>
              <input
                id="promoPrice"
                name="promoPrice"
                inputMode="decimal"
                placeholder="Opcional"
                defaultValue={centsToInput(product?.promoPriceCents)}
                className="field-input"
              />
              <FieldError message={state.fieldErrors?.promoPrice} />
            </div>
            <div>
              <label htmlFor="availability" className="field-label">
                Disponibilidad
              </label>
              <select
                id="availability"
                name="availability"
                defaultValue={product?.availability ?? "unknown"}
                className="field-input"
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {AVAILABILITY_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stock" className="field-label">
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min={0}
                max={100000}
                defaultValue={product?.stock ?? 0}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="lowStockThreshold" className="field-label">
                Aviso de stock bajo
              </label>
              <input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min={0}
                max={1000}
                defaultValue={product?.lowStockThreshold ?? 3}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="extraImages" className="field-label">
              Imágenes adicionales (rutas, una por línea)
            </label>
            <textarea
              id="extraImages"
              name="extraImages"
              rows={3}
              placeholder="/uploads/imagen-2.jpg"
              defaultValue={(product?.extraImages ?? []).join("\n")}
              className="field-input"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Solo se aceptan rutas internas que empiecen con <code>/</code>.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="field-label">Imagen principal</p>
            <div className="overflow-hidden rounded-xl">
              <ProductImage
                src={product?.imagePath ?? null}
                alt={product?.name ?? "Vista previa"}
                sizes="300px"
              />
            </div>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="mt-3 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            <FieldError message={state.fieldErrors?.image} />
            {product?.imagePath && (
              <label className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <input type="checkbox" name="removeImage" className="h-4 w-4" />
                Quitar imagen actual
              </label>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              PNG, JPG, WEBP o AVIF. Máximo 3 MB.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={product ? product.isPublished : true}
                className="h-4 w-4"
              />
              Publicado
            </label>
            <label className="mt-3 flex items-center gap-3 text-sm font-semibold text-neutral-700">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={product?.isFeatured ?? false}
                className="h-4 w-4"
              />
              Destacado en inicio
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton label={isEdit ? "Guardar cambios" : "Crear producto"} />
            <LinkButton href="/admin/productos" variant="outline">
              Cancelar
            </LinkButton>
          </div>
        </div>
      </div>
    </form>
  );
}
