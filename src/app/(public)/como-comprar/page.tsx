import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { IconArrowRight, IconInfo, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Cómo comprar",
    description:
      "Pasos para hacer tu pedido en BrakMar Gas: elegí productos, sumá cantidades, completá tus datos y enviá el pedido por WhatsApp.",
    path: "/como-comprar",
  });
}

const STEPS = [
  { title: "Elegí tus productos", text: "Recorré el catálogo y seleccioná lo que necesitás." },
  { title: "Seleccioná las cantidades", text: "Ajustá la cantidad de cada producto." },
  { title: "Completá tus datos", text: "Nombre, dirección, localidad e instrucciones opcionales." },
  { title: "Revisá el resumen", text: "Verificá productos, cantidades y datos antes de enviar." },
  { title: "Abrí WhatsApp", text: "Se abrirá WhatsApp con el mensaje de tu pedido preparado." },
  { title: "Enviá el mensaje", text: "El pedido se confirma cuando BrakMar Gas te responde." },
];

export default function ComoComprarPage() {
  const config = getSiteConfig();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero hacer un pedido.`,
  );
  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Cómo comprar"
        title="Hacer tu pedido es muy simple"
        description="Armá tu pedido en la web y finalizá por WhatsApp. No hace falta registrarse ni pagar online."
      />

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <Card className="flex h-full flex-col p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                {i + 1}
              </span>
              <h2 className="mt-3 font-bold">{step.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{step.text}</p>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <IconInfo size={20} className="mt-0.5 shrink-0" />
        <p>
          Abrir WhatsApp o preparar el mensaje <strong>no</strong> significa que el
          pedido haya sido recibido ni confirmado automáticamente. El pedido queda
          confirmado recién cuando {config.companyName} te responde.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/productos" size="lg">
          Ver productos <IconArrowRight size={18} />
        </LinkButton>
        <LinkButton
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
        >
          <IconWhatsApp size={20} /> Escribir por WhatsApp
        </LinkButton>
      </div>
    </div>
  );
}
