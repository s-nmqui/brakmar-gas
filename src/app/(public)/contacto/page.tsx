import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import {
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMapPin,
  IconPhone,
  IconTikTok,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Contacto",
    description:
      "Contactá a BrakMar Gas por WhatsApp. Horario de atención, localidad y entregas en Belén, Salto.",
    path: "/contacto",
  });
}

export default function ContactoPage() {
  const config = getSiteConfig();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero contactarme con ustedes.`,
  );

  const social = [
    { href: config.social.instagram, label: "Instagram", Icon: IconInstagram },
    { href: config.social.facebook, label: "Facebook", Icon: IconFacebook },
    { href: config.social.tiktok, label: "TikTok", Icon: IconTikTok },
  ].filter((s) => s.href);

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Contacto"
        title="Hablemos por WhatsApp"
        description="La forma más rápida de contactarnos es por WhatsApp. También podés acercarte al local una vez que confirmemos la dirección."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IconPhone size={24} />
          </span>
          <h2 className="mt-4 font-bold">WhatsApp comercial</h2>
          <p className="mt-1 text-neutral-600">{config.whatsappDisplay}</p>
          <LinkButton
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="sm"
            className="mt-4"
          >
            <IconWhatsApp size={18} /> Escribir ahora
          </LinkButton>
        </Card>

        <Card className="p-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IconClock size={24} />
          </span>
          <h2 className="mt-4 font-bold">Horario de atención</h2>
          <p className="mt-1 text-neutral-600">{config.schedule}</p>
        </Card>

        <Card className="p-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IconMapPin size={24} />
          </span>
          <h2 className="mt-4 font-bold">Localidad</h2>
          <p className="mt-1 text-neutral-600">{config.locality}</p>
          {config.address ? (
            <p className="mt-1 text-sm text-neutral-500">Dirección: {config.address}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">
              La dirección exacta se publicará cuando el negocio la confirme.
            </p>
          )}
        </Card>

        <Card className="p-6 sm:col-span-2 lg:col-span-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IconTruck size={24} />
          </span>
          <h2 className="mt-4 font-bold">Entregas y envíos</h2>
          <p className="mt-1 text-neutral-600">{config.deliveryInfo}</p>
          <p className="mt-2 text-sm text-neutral-500">{config.shippingInfo}</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold">Redes sociales</h2>
          {social.length > 0 ? (
            <div className="mt-4 flex gap-2">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-400">
              Todavía no hay redes sociales configuradas.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
