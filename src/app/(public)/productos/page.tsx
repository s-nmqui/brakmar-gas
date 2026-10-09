import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/settings-repo";
import { listCategories, listProducts } from "@/lib/products-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { IconSearch, IconWhatsApp } from "@/components/icons";

interface SearchParams {
  categoria?: string;
  q?: string;
}

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Productos",
    description:
      "Catálogo de garrafas de 13 kg, envases vacíos, recargas y accesorios en Belén, Salto. Consultá disponibilidad y precios por WhatsApp.",
    path: "/productos",
  });
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const config = getSiteConfig();
  const categories = listCategories();
  const activeCategory = params.categoria ?? "";
  const search = (params.q ?? "").trim();

  const products = listProducts({
    onlyPublished: true,
    categorySlug: activeCategory || undefined,
    search: search || undefined,
  });

  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero consultar por un producto.`,
  );

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Catálogo"
        title="Productos y accesorios"
        description="Elegí tus productos y agregalos al pedido. Si un precio no aparece, es porque todavía no está configurado: consultanos por WhatsApp."
      />

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="list" aria-label="Categorías">
          <Link
            href="/productos"
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              !activeCategory
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/productos?categoria=${cat.slug}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                activeCategory === cat.slug
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <form action="/productos" className="flex w-full max-w-sm items-center gap-2" role="search">
          {activeCategory && <input type="hidden" name="categoria" value={activeCategory} />}
          <label htmlFor="q" className="sr-only">
            Buscar productos
          </label>
          <div className="relative flex-1">
            <IconSearch
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre…"
              className="field-input pl-10"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid
            products={products}
            whatsapp={config.whatsapp}
            companyName={config.companyName}
            priorities={3}
          />
        ) : (
          <EmptyState
            title="No encontramos productos"
            description="Probá con otra categoría o término de búsqueda. También podés consultarnos directamente por WhatsApp."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <LinkButton href="/productos" variant="outline">
                  Ver todo el catálogo
                </LinkButton>
                <LinkButton
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                >
                  <IconWhatsApp size={18} /> Consultar por WhatsApp
                </LinkButton>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
