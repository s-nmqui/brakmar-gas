import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { IconCheck, IconFlame, IconTruck, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Nosotros",
    description:
      "BrakMar Gas es un negocio familiar de Belén, Salto, dedicado a la venta, carga y distribución de garrafas y accesorios.",
    path: "/nosotros",
  });
}

const VALUES = [
  {
    Icon: IconFlame,
    title: "Especialistas en garrafas",
    text: "Nos dedicamos a la venta, carga y distribución de garrafas de gas y accesorios.",
  },
  {
    Icon: IconTruck,
    title: "Cerca de tu casa",
    text: "Entregamos a domicilio en toda la localidad de Belén, en el departamento de Salto.",
  },
  {
    Icon: IconCheck,
    title: "Trato directo",
    text: "Atendemos de forma personalizada y coordinamos cada pedido por WhatsApp.",
  },
];

export default function NosotrosPage() {
  const config = getSiteConfig();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero conocer más sobre ustedes.`,
  );

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Nosotros"
        title={`Sobre ${config.companyName}`}
        description={config.slogan}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4 text-neutral-700">
            <p>
              {config.companyName} es un negocio familiar con local en Belén,
              departamento de Salto, Uruguay. Nos dedicamos a la venta de garrafas
              de gas, a la venta de envases vacíos, a la carga o recarga de
              garrafas y a la venta de accesorios.
            </p>
            <p>
              Nuestro objetivo es simple: que conseguir tu garrafa sea fácil.
              Trabajamos con trato directo, atendemos todos los días y coordinamos
              cada pedido por WhatsApp para confirmar disponibilidad, precio final
              y entrega.
            </p>
            <p>
              Realizamos entregas a domicilio en toda la localidad de Belén. Los
              envíos a otras localidades de Uruguay están sujetos a cobertura,
              disponibilidad y condiciones logísticas que confirmamos al momento
              de cada consulta.
            </p>
            <p className="text-neutral-500">
              Si querés conocer más sobre nuestro servicio, escribinos por
              WhatsApp. Con gusto te respondemos.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {VALUES.map(({ Icon, title, text }) => (
              <Card key={title} className="p-5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={22} />
                </span>
                <h2 className="mt-3 font-bold">{title}</h2>
                <p className="mt-1 text-sm text-neutral-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="h-fit bg-brand-600 p-6 text-white lg:sticky lg:top-28">
          <h2 className="text-xl font-bold">¿Querés hacer un pedido?</h2>
          <p className="mt-2 text-sm text-brand-50">
            Escribinos y coordinamos tu entrega en Belén.
          </p>
          <LinkButton
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            className="mt-5 w-full"
          >
            <IconWhatsApp size={18} /> Escribir por WhatsApp
          </LinkButton>
          <LinkButton
            href="/productos"
            className="mt-3 w-full bg-white text-brand-700 hover:bg-brand-50"
          >
            Ver productos
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
