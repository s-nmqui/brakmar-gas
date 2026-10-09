import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/settings-repo";
import { listProducts } from "@/lib/products-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCentsOrConsultar } from "@/lib/money";
import { PRODUCT_TYPE_LABELS } from "@/lib/config";
import { Badge, Card, LinkButton, EmptyState, SectionTitle } from "@/components/ui";
import { AvailabilityBadge } from "@/components/products/AvailabilityBadge";
import { IconInfo, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Precios",
    description:
      "Precios de garrafas, recargas y accesorios en Belén, Salto. Los importes se actualizan desde el catálogo. Consultá por WhatsApp los precios a confirmar.",
    path: "/precios",
  });
}

export default function PreciosPage() {
  const config = getSiteConfig();
  const products = listProducts({ onlyPublished: true });
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero consultar precios y disponibilidad.`,
  );

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Precios"
        title="Nuestros precios"
        description="Los precios se muestran tal como están configurados en el catálogo. Si un producto figura como “Consultar precio”, su importe todavía no está cargado: escribinos y te lo confirmamos."
      />

      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Todavía no hay productos publicados"
            description="Estamos actualizando el catálogo. Consultanos por WhatsApp para conocer precios y disponibilidad."
            action={
              <LinkButton href={waHref} target="_blank" rel="noopener noreferrer" variant="whatsapp">
                <IconWhatsApp size={18} /> Consultar por WhatsApp
              </LinkButton>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {products.map((product) => {
            const price = product.promoPriceCents ?? product.priceCents;
            return (
              <Card key={product.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.categoryName && <Badge tone="brand">{product.categoryName}</Badge>}
                    <Badge tone="neutral">{PRODUCT_TYPE_LABELS[product.productType]}</Badge>
                  </div>
                  <h2 className="mt-2 font-bold">
                    <Link href={`/productos/${product.slug}`} className="hover:text-brand-700">
                      {product.name}
                    </Link>
                  </h2>
                  <div className="mt-2">
                    <AvailabilityBadge availability={product.availability} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {price !== null && product.priceCents !== null && product.promoPriceCents !== null && product.promoPriceCents < product.priceCents && (
                    <p className="text-xs text-neutral-400 line-through">
                      {formatCentsOrConsultar(product.priceCents)}
                    </p>
                  )}
                  <p className="text-lg font-bold text-neutral-900">
                    {formatCentsOrConsultar(price)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm text-neutral-700">
        <IconInfo size={20} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p>
            Los precios pueden variar. El importe final y las condiciones de
            entrega se confirman por WhatsApp al momento del pedido.
          </p>
          <Link href="/mides" className="mt-1 inline-block font-semibold text-brand-700 hover:text-brand-800">
            Ver información del beneficio MIDES →
          </Link>
        </div>
      </div>
    </div>
  );
}
