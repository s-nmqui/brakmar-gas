import { LinkButton } from "@/components/ui";
import { IconArrowRight, IconWhatsApp } from "@/components/icons";
import { DEFAULT_SITE_CONFIG } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function NotFound() {
  const waHref = buildWhatsAppUrl(
    DEFAULT_SITE_CONFIG.whatsapp,
    `Hola, ${DEFAULT_SITE_CONFIG.companyName}. Quiero hacer una consulta.`,
  );
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-600">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-md text-neutral-600">
        Puede que el enlace haya cambiado o que el producto ya no esté disponible.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/productos">
          Ver productos <IconArrowRight size={18} />
        </LinkButton>
        <LinkButton
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
        >
          <IconWhatsApp size={18} /> Consultar por WhatsApp
        </LinkButton>
      </div>
    </div>
  );
}
