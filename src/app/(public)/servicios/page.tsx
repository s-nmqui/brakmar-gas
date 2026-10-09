import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import {
  IconFlame,
  IconInfo,
  IconRefresh,
  IconShield,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Servicios",
    description:
      "Venta de garrafas, envases vacíos, cargas y recargas, accesorios y entrega a domicilio en Belén, Salto. Envíos nacionales sujetos a confirmación.",
    path: "/servicios",
  });
}

const SERVICES = [
  {
    Icon: IconFlame,
    title: "Venta de garrafas",
    text: "Garrafas de 13 kg en formato uruguayo y brasileño. Consultá disponibilidad y precio actualizado.",
  },
  {
    Icon: IconShield,
    title: "Venta de envases vacíos",
    text: "Envases de garrafa de 13 kg sin contenido, para quienes necesitan reponer su envase.",
  },
  {
    Icon: IconRefresh,
    title: "Cargas y recargas",
    text: "Carga o recarga de garrafas de 13 kg. Se realiza sobre tu envase en condiciones.",
  },
  {
    Icon: IconShield,
    title: "Accesorios",
    text: "Válvulas, bases, cabezales y gomitas pequeñas y grandes para garrafas.",
  },
  {
    Icon: IconTruck,
    title: "Entrega a domicilio en Belén",
    text: "Coordinamos la entrega en toda la localidad de Belén, departamento de Salto.",
  },
  {
    Icon: IconInfo,
    title: "Envíos a otras localidades",
    text: "Los envíos dentro de Uruguay están sujetos a cobertura, disponibilidad y condiciones logísticas a confirmar.",
  },
];

export default function ServiciosPage() {
  const config = getSiteConfig();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero consultar por sus servicios.`,
  );
  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Servicios"
        title="Qué ofrecemos"
        description="Estos son los servicios confirmados de BrakMar Gas. Para detalles de disponibilidad, precios y entrega, consultanos por WhatsApp."
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ Icon, title, text }) => (
          <Card key={title} className="p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={26} />
            </span>
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-neutral-600">{text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
        <IconInfo size={20} className="mt-0.5 shrink-0 text-brand-600" />
        <p>
          Por seguridad, no publicamos instrucciones para manipular instalaciones
          de gas. Si tenés dudas sobre el uso o la conexión de tu garrafa,
          consultanos y te orientamos.
        </p>
      </div>

      <div className="mt-8">
        <LinkButton
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
        >
          <IconWhatsApp size={20} /> Consultar por WhatsApp
        </LinkButton>
      </div>
    </div>
  );
}
