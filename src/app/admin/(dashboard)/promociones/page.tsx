import Link from "next/link";
import { getPromotionById, listPromotions } from "@/lib/content-repo";
import { listProducts } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { PromotionForm } from "@/components/admin/PromotionForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { deletePromotionAction } from "@/app/actions/content";
import { Badge, Card, EmptyState } from "@/components/ui";
import { IconEdit, IconTrash } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const promotions = listPromotions();
  const products = listProducts().map((p) => ({ id: p.id, name: p.name }));
  const editing = sp.edit ? getPromotionById(Number(sp.edit)) : null;

  return (
    <div>
      <PageHeader
        title="Promociones"
        description="Creá promociones que se muestran en la página de promociones y, si están activas, se destacan en el inicio."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-4">
            <h2 className="font-bold">
              {editing ? `Editar: ${editing.title}` : "Nueva promoción"}
            </h2>
            {editing && (
              <Link
                href="/admin/promociones"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Cancelar edición
              </Link>
            )}
          </div>
          <div className="p-5">
            <PromotionForm products={products} promotion={editing} />
          </div>
        </Card>

        <div className="lg:col-span-2">
          {promotions.length === 0 ? (
            <EmptyState
              title="No hay promociones"
              description="Creá tu primera promoción para publicarla en la web."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {promotions.map((promo) => (
                <Card key={promo.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{promo.title}</h3>
                      {promo.discountLabel && (
                        <Badge tone="accent" className="mt-1">
                          {promo.discountLabel}
                        </Badge>
                      )}
                    </div>
                    <Badge tone={promo.isActive ? "success" : "neutral"}>
                      {promo.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  {promo.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                      {promo.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    {promo.productName ?? "Sin producto asociado"}
                    {promo.startsAt || promo.endsAt
                      ? ` · ${promo.startsAt ?? "…"} → ${promo.endsAt ?? "…"}`
                      : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin/promociones?edit=${promo.id}`}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                    >
                      <IconEdit size={16} /> Editar
                    </Link>
                    <ActionButton
                      action={deletePromotionAction}
                      fields={{ id: promo.id }}
                      confirmMessage={`¿Eliminar la promoción "${promo.title}"?`}
                    >
                      <IconTrash size={16} />
                    </ActionButton>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Card className="mt-6 p-5">
        <p className="text-sm text-neutral-600">
          Consejo: para destacar una oferta en el inicio, marcá el producto con un
          precio promocional en <Link href="/admin/productos" className="font-semibold text-brand-700 hover:text-brand-800">Productos</Link> y
          activá “Destacado”.
        </p>
      </Card>
      {products.length === 0 && (
        <p className="mt-2 text-xs text-amber-700">
          No hay productos cargados; podés crear promociones sin asociar producto.
        </p>
      )}
    </div>
  );
}