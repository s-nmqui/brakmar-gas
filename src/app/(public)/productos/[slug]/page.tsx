import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/settings-repo";
import { getProductBySlug, listProducts } from "@/lib/products-repo";
import { buildMetadata, productJsonLd } from "@/lib/seo";
import { PRODUCT_TYPE_LABELS } from "@/lib/config";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductGrid } from "@/components/products/ProductGrid";
import { AvailabilityBadge } from "@/components/products/AvailabilityBadge";
import { Price } from "@/components/products/Price";
import { Badge } from "@/components/ui";
import { IconArrowRight, IconInfo } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug, false);
  const config = getSiteConfig();
  if (!product) {
    return buildMetadata(config, {
      title: "Producto no encontrado",
      path: `/productos/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata(config, {
    title: product.name,
    description: product.description.slice(0, 160),
    path: `/productos/${product.slug}`,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug, true);
  if (!product) notFound();

  const config = getSiteConfig();
  const related = product.categoryId
    ? listProducts({ onlyPublished: true, categorySlug: undefined })
        .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
        .slice(0, 3)
    : [];

  const images = [product.imagePath, ...product.extraImages].filter(
    (x): x is string => Boolean(x),
  );

  return (
    <div className="container-page py-8">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-700">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/productos" className="hover:text-brand-700">Productos</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-neutral-700">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <ProductImage
              src={product.imagePath}
              alt={product.name}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          {images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((src, i) => (
                <li
                  key={`${src}-${i}`}
                  className="overflow-hidden rounded-xl border border-neutral-200"
                >
                  <ProductImage
                    src={src}
                    alt={`${product.name} — imagen ${i + 1}`}
                    sizes="120px"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.categoryName && <Badge tone="brand">{product.categoryName}</Badge>}
            <Badge tone="neutral">{PRODUCT_TYPE_LABELS[product.productType]}</Badge>
            {product.isFeatured && <Badge tone="accent">Destacado</Badge>}
            <AvailabilityBadge availability={product.availability} />
          </div>

          <h1 className="mt-4 text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-3 whitespace-pre-line text-neutral-600">
            {product.description}
          </p>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <Price
              priceCents={product.priceCents}
              promoPriceCents={product.promoPriceCents}
              size="lg"
            />
            <p className="mt-1 text-xs text-neutral-500">
              El precio final y la disponibilidad se confirman por WhatsApp.
            </p>
          </div>

          <div className="mt-6">
            <ProductActions
              product={product}
              whatsapp={config.whatsapp}
              companyName={config.companyName}
            />
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-neutral-700">
            <IconInfo size={20} className="mt-0.5 shrink-0 text-brand-600" />
            <p>
              Las garrafas vacías y las recargas son productos distintos. Revisá el
              tipo de producto antes de pedir. Ante dudas, consultanos.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Productos relacionados</h2>
            <Link
              href="/productos"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver catálogo <IconArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid
              products={related}
              whatsapp={config.whatsapp}
              companyName={config.companyName}
            />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
    </div>
  );
}
