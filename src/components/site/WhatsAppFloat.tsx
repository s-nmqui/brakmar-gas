import { getSiteConfig } from "@/lib/settings-repo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IconWhatsApp } from "../icons";

export function WhatsAppFloat() {
  const config = getSiteConfig();
  const href = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero hacer una consulta.`,
  );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:h-16 sm:w-16"
      aria-label="Escribir por WhatsApp"
    >
      <IconWhatsApp size={30} />
    </a>
  );
}
