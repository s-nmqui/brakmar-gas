import Link from "next/link";
import { PRODUCT_TYPE_LABELS } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCents } from "@/lib/money";
import type { Product } from "@/lib/types";
import { Badge, Card, LinkButton } from "../ui";
import { AddToCartButton } from "../cart/AddToCartButton";
import { IconWhatsApp } from "../icons";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";
import { AvailabilityBadge } from "./AvailabilityBadge";

export function ProductCard({
  product,
  whatsapp,
  companyName,
  priority = false,
}: {
  product: Product;
  whatsapp: string;
  companyName: string;
  priority?: boolean;
}) {
  const unit = product.promoPriceCents ?? product.priceCents;
  const waHref = buildWhatsAppUrl(
    whatsapp,
    `Hola, ${companyName}. Quiero consultar por: ${product.name}${
      unit !== null ? ` (${formatCents(unit)})` : ""
    }.`,
  );

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/productos/${product.slug}`} className="block">
        <ProductImage
          src={product.imagePath}
          alt={product.name}
          priority={priority}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {product.categoryName && <Badge tone="brand">{product.categoryName}</Badge>}
          <Badge tone="neutral">{PRODUCT_TYPE_LABELS[product.productType]}</Badge>
          {product.isFeatured && <Badge tone="accent">Destacado</Badge>}
        </div>
        <h3 className="text-base font-bold leading-snug">
          <Link href={`/productos/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600">
          {product.description}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2">
            <Price priceCents={product.priceCents} promoPriceCents={product.promoPriceCents} />
            <AvailabilityBadge availability={product.availability} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <AddToCartButton
              product={product}
              size="sm"
              className="flex-1"
              label="Agregar"
            />
            <LinkButton
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="sm"
              aria-label={`Consultar ${product.name} por WhatsApp`}
              className="px-2.5"
            >
              <IconWhatsApp size={18} />
            </LinkButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
