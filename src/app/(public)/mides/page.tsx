import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { getMidesInfo } from "@/lib/content-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCents } from "@/lib/money";
import { Card, LinkButton, SectionTitle } from "@/components/ui";
import { IconCheck, IconInfo, IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Beneficio MIDES",
    description:
      "Información sobre el beneficio MIDES para la compra de garrafas con BrakMar Gas en Belén, Salto. Requisitos y vigencia sujetos a verificación oficial.",
    path: "/mides",
  });
}

export default function MidesPage() {
  const config = getSiteConfig();
  const mides = getMidesInfo();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero consultar por el beneficio MIDES.`,
  );

  const hasPrices = mides.normalPriceCents !== null || mides.benefitPriceCents !== null;
  const sourceUrl = mides.sourceUrl || config.midesSourceUrlDefault;

  const rows = [
    { label: "Requisitos oficiales", value: mides.requirements },
    { label: "Condiciones de elegibilidad", value: mides.eligibility },
    { label: "Condiciones adicionales", value: mides.extraConditions },
  ];

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Beneficio MIDES"
        title="Beneficio para la compra de garrafas"
        description="Reunimos aquí la información del beneficio MIDES. La publicamos tal como fue verificada por el negocio."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start gap-3">
            <IconInfo size={22} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-neutral-700">
              {mides.description ||
                "La descripción del beneficio todavía no fue completada por el negocio."}
            </p>
          </div>

          <dl className="mt-6 space-y-5">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                  {row.label}
                </dt>
                <dd className="mt-1 text-neutral-700">
                  {row.value || (
                    <span className="text-neutral-400">
                      Pendiente de verificar y completar.
                    </span>
                  )}
                </dd>
              </div>
            ))}
            {(mides.validFrom || mides.validUntil) && (
              <div>
                <dt className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                  Vigencia
                </dt>
                <dd className="mt-1 text-neutral-700">
                  {mides.validFrom && <span>Desde {mides.validFrom}. </span>}
                  {mides.validUntil && <span>Hasta {mides.validUntil}.</span>}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="flex flex-col p-6">
          <h2 className="font-bold">Precios con beneficio</h2>
          {hasPrices ? (
            <ul className="mt-4 space-y-4">
              {mides.normalPriceCents !== null && (
                <li>
                  <p className="text-sm text-neutral-500">Precio normal</p>
                  <p className="text-lg font-semibold">{formatCents(mides.normalPriceCents)}</p>
                </li>
              )}
              {mides.benefitPriceCents !== null && (
                <li>
                  <p className="text-sm text-neutral-500">Precio con beneficio</p>
                  <p className="text-lg font-semibold text-brand-700">
                    {formatCents(mides.benefitPriceCents)}
                  </p>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Los importes asociados al beneficio todavía no están configurados.
              Consultanos por WhatsApp.
            </p>
          )}

          <div className="mt-auto pt-6">
            <LinkButton
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              className="w-full"
            >
              <IconWhatsApp size={18} /> Consultar beneficio
            </LinkButton>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ver fuente oficial
              </a>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <IconCheck size={20} className="mt-0.5 shrink-0" />
        <p>
          La aplicación o elegibilidad del beneficio depende de la normativa
          vigente y de tu situación particular. Confirmá siempre los requisitos y
          la vigencia antes de la compra.
        </p>
      </div>
    </div>
  );
}
