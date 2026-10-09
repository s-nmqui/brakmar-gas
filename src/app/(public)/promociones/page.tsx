import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { listPromotions } from "@/lib/content-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Badge, Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { IconTag, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Promociones",
    description:
      "Promociones vigentes de BrakMar Gas en Belén, Salto. Si no hay promociones activas, consultanos por WhatsApp.",
    path: "/promociones",
  });
}

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  const fmt = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" });
  };
  if (startsAt && endsAt) return `Del ${fmt(startsAt)} al ${fmt(endsAt)}`;
  if (endsAt) return `Hasta el ${fmt(endsAt)}`;
  if (startsAt) return `Desde el ${fmt(startsAt)}`;
  return null;
}

export default function PromocionesPage() {
  const config = getSiteConfig();
  const promotions = listPromotions(true);
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero consultar por promociones vigentes.`,
  );

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Promociones"
        title="Promociones vigentes"
        description="Publicamos únicamente promociones reales y activas. Si en este momento no hay ninguna, consultanos por WhatsApp."
      />

      <div className="mt-8">
        {promotions.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2">
            {promotions.map((promo) => {
              const range = formatRange(promo.startsAt, promo.endsAt);
              return (
                <li key={promo.id}>
                  <Card className="flex h-full flex-col p-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                        <IconTag size={22} />
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {promo.discountLabel && (
                          <Badge tone="accent">{promo.discountLabel}</Badge>
                        )}
                        {promo.productName && <Badge tone="brand">{promo.productName}</Badge>}
                      </div>
                    </div>
                    <h2 className="mt-4 text-lg font-bold">{promo.title}</h2>
                    {promo.description && (
                      <p className="mt-2 text-sm text-neutral-600">{promo.description}</p>
                    )}
                    {range && (
                      <p className="mt-3 text-xs font-medium text-neutral-500">{range}</p>
                    )}
                    <div className="mt-auto pt-5">
                      <LinkButton
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="whatsapp"
                        size="sm"
                      >
                        <IconWhatsApp size={18} /> Aprovechar por WhatsApp
                      </LinkButton>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No hay promociones activas en este momento"
            description="Podés consultarnos por WhatsApp para conocer precios y novedades. Publicaremos aquí cualquier promoción vigente."
            action={
              <LinkButton href={waHref} target="_blank" rel="noopener noreferrer" variant="whatsapp">
                <IconWhatsApp size={18} /> Consultar por WhatsApp
              </LinkButton>
            }
          />
        )}
      </div>
    </div>
  );
}
