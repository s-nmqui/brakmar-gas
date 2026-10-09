import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { IconInfo, IconMapPin, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Ubicación",
    description:
      "BrakMar Gas en Belén, departamento de Salto. Consultá por WhatsApp la ubicación exacta del local.",
    path: "/ubicacion",
  });
}

export default function UbicacionPage() {
  const config = getSiteConfig();
  const mapsUrl =
    config.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${config.companyName} Belén Salto Uruguay`,
    )}`;

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Ubicación"
        title="Dónde encontrarnos"
        description="Atendemos en Belén, departamento de Salto, Uruguay."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-full min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <IconMapPin size={30} />
            </span>
            {config.googleMapsUrl ? (
              <>
                <h2 className="text-lg font-bold">Encontranos en Google Maps</h2>
                <p className="max-w-md text-sm text-neutral-600">
                  Abrí la ficha de {config.companyName} para ver la ubicación exacta
                  y las indicaciones.
                </p>
                <LinkButton
                  href={config.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en Google Maps
                </LinkButton>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">
                  Ubicación exacta a confirmar
                </h2>
                <p className="max-w-md text-sm text-neutral-600">
                  BrakMar Gas ya figura en Google Maps. Estamos a la espera del
                  enlace exacto de su ficha para incluirlo aquí. Mientras tanto,
                  podés buscar el negocio o consultarnos por WhatsApp.
                </p>
                <LinkButton
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                >
                  Buscar “{config.companyName}” en Google Maps
                </LinkButton>
              </>
            )}
          </Card>
        </div>

        <Card className="flex flex-col p-6">
          <h2 className="font-bold">Localidad</h2>
          <p className="mt-1 text-neutral-600">{config.locality}</p>
          {config.address && (
            <p className="mt-2 text-sm text-neutral-500">Dirección: {config.address}</p>
          )}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <IconInfo size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <p>
              Para coordinar una visita o una entrega, escribinos primero por
              WhatsApp.
            </p>
          </div>
          <div className="mt-auto pt-6">
            <LinkButton
              href={`https://wa.me/${config.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              className="w-full"
            >
              <IconWhatsApp size={18} /> Consultar ubicación
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
