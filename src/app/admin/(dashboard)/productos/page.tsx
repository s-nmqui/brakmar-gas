import Link from "next/link";
import { listProducts } from "@/lib/products-repo";
import { PRODUCT_TYPE_LABELS, AVAILABILITY_LABELS } from "@/lib/config";
import { formatCentsOrConsultar } from "@/lib/money";
import { PageHeader } from "@/components/admin/PageHeader";
import { ActionButton } from "@/components/admin/ActionButton";
import { deleteProductAction } from "@/app/actions/products";
import { Alert, Badge, Card, LinkButton } from "@/components/ui";
import { ProductImage } from "@/components/products/ProductImage";
import { IconEdit, IconPlus, IconTrash } from "@/components/icons";

export const dynamic = "force-dynamic";

const AVAIL_TONE = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  unknown: "neutral",
} as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  const products = listProducts();

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Administrá el catálogo: precios, disponibilidad, imágenes y publicación."
        actions={
          <LinkButton href="/admin/productos/nuevo">
            <IconPlus size={18} /> Nuevo producto
          </LinkButton>
        }
      />

      {sp.ok && <Alert tone="success">Cambios guardados correctamente.</Alert>}
      {sp.deleted && <Alert tone="success">Producto eliminado.</Alert>}

      {products.length === 0 ? (
        <div className="mt-6">
          <Card className="p-8 text-center">
            <p className="text-neutral-600">Todavía no hay productos cargados.</p>
            <div className="mt-4 flex justify-center">
              <LinkButton href="/admin/productos/nuevo">
                <IconPlus size={18} /> Crear el primero
              </LinkButton>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Disponibilidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 shrink-0 overflow-hidden rounded-lg">
                          <ProductImage src={product.imagePath} alt={product.name} sizes="56px" />
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-neutral-500">
                            {product.categoryName ?? "Sin categoría"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {PRODUCT_TYPE_LABELS[product.productType]}
                    </td>
                    <td className="px-4 py-3">
                      {product.promoPriceCents !== null ? (
                        <span>
                          <span className="font-semibold text-brand-700">
                            {formatCentsOrConsultar(product.promoPriceCents)}
                          </span>{" "}
                          <span className="text-xs text-neutral-400 line-through">
                            {formatCentsOrConsultar(product.priceCents)}
                          </span>
                        </span>
                      ) : (
                        formatCentsOrConsultar(product.priceCents)
                      )}
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <Badge tone={AVAIL_TONE[product.availability]}>
                        {AVAILABILITY_LABELS[product.availability]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {product.isPublished ? (
                        <Badge tone="success">Publicado</Badge>
                      ) : (
                        <Badge tone="neutral">Borrador</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                        >
                          <IconEdit size={16} /> Editar
                        </Link>
                        <ActionButton
                          action={deleteProductAction}
                          fields={{ id: product.id }}
                          confirmMessage={`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`}
                        >
                          <IconTrash size={16} /> Eliminar
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
