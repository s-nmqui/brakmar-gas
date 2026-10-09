import Link from "next/link";
import { getSiteConfig } from "@/lib/settings-repo";
import { NAV_ITEMS } from "./nav";
import { Logo } from "./Logo";
import {
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMapPin,
  IconPhone,
  IconTikTok,
  IconTruck,
  IconWhatsApp,
} from "../icons";

export function Footer() {
  const config = getSiteConfig();
  const year = new Date().getFullYear();
  const social = [
    { href: config.social.instagram, label: "Instagram", Icon: IconInstagram },
    { href: config.social.facebook, label: "Facebook", Icon: IconFacebook },
    { href: config.social.tiktok, label: "TikTok", Icon: IconTikTok },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-900 text-neutral-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="rounded-2xl bg-white/5 p-3 inline-block">
            <Logo compact />
          </div>
          <p className="mt-4 max-w-xs text-sm text-neutral-400">{config.slogan}</p>
          {social.length > 0 && (
            <div className="mt-4 flex gap-2">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Navegación
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Contacto
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <IconPhone size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                {config.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <IconClock size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <span>{config.schedule}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <IconMapPin size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <span>{config.locality}</span>
            </li>
            {config.email && (
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 text-brand-400">@</span>
                <a
                  href={`mailto:${config.email}`}
                  className="transition-colors hover:text-white"
                >
                  {config.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Entregas
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            <li className="flex items-start gap-2.5">
              <IconTruck size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <span>{config.deliveryInfo}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <IconWhatsApp size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <span>{config.shippingInfo}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {year} {config.companyName}. Todos los derechos reservados.
          </p>
          <p>
            Los pedidos se confirman por WhatsApp. Los precios y la disponibilidad
            pueden actualizarse.
          </p>
        </div>
      </div>
    </footer>
  );
}
