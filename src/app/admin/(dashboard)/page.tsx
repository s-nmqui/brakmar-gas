import Link from "next/link";
import {
  countPublishedProducts,
  listLowStock,
  listProducts,
} from "@/lib/products-repo";
import {
  listPromotions,
  listReviews,
} from "@/lib/content-repo";
import { PageHeader, StatCard } from "@/components/admin/PageHeader";
import { Card, LinkButton, Stars } from "@/components/ui";
import { IconArrowRight, IconPackage, IconTag } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  const products = listProducts();
  const published = countPublishedProducts();
  const lowStock = listLowStock();
  const pendingReviews = listReviews("pending");
  const activePromos = listPromotions(true);

  return (
    <div>
      <PageHeader
        title="Panel de administración"
        description="Resumen del contenido y del estado de tu catálogo."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={products.length} hint={`${published} publicados`} />
        <StatCard
          label="Stock bajo"
          value={lowStock.length}
          tone={lowStock.length > 0 ? "warning" : "neutral"}
          hint="Productos al límite o agotados"
        />
        <StatCard
          label="Reseñas pendientes"
          value={pendingReviews.length}
          tone={pendingReviews.length > 0 ? "brand" : "neutral"}
          hint="Esperando moderación"
        />
        <StatCard label="Promociones activas" value={activePromos.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Accesos rápidos</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/admin/productos/nuevo">
              <IconPackage size={18} /> Nuevo producto
            </LinkButton>
            <LinkButton href="/admin/promociones" variant="outline">
              <IconTag size={18} /> Gestionar promociones
            </LinkButton>
            <LinkButton href="/admin/stock" variant="outline">
              Actualizar stock
            </LinkButton>
            <LinkButton href="/admin/configuracion" variant="outline">
              Configuración del sitio
            </LinkButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Reseñas pendientes</h2>
            <Link
              href="/admin/resenas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver todas <IconArrowRight size={16} />
            </Link>
          </div>
          {pendingReviews.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No hay reseñas pendientes de moderación.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingReviews.slice(0, 4).map((review) => (
                <li key={review.id} className="rounded-xl border border-neutral-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{review.displayName}</span>
                    <Stars rating={review.rating} size={14} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                    {review.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
