import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { listFaqs } from "@/lib/content-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Preguntas frecuentes",
    description:
      "Respuestas sobre garrafas, envases vacíos, recargas, accesorios, pedidos, entregas en Belén, envíos, horarios, medios de pago y beneficio MIDES.",
    path: "/preguntas-frecuentes",
  });
}

export default function FaqPage() {
  const config = getSiteConfig();
  const faqs = listFaqs(true);
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Tengo una consulta.`,
  );

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        description="Estas son las dudas más comunes. Si no encontrás tu respuesta, escribinos por WhatsApp."
      />

      {faqs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Todavía no hay preguntas publicadas"
            description="Estamos preparando esta sección. Mientras tanto, consultanos por WhatsApp."
            action={
              <LinkButton href={waHref} target="_blank" rel="noopener noreferrer" variant="whatsapp">
                <IconWhatsApp size={18} /> Consultar por WhatsApp
              </LinkButton>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-lg font-bold text-neutral-900">{category}</h2>
              <div className="mt-3 space-y-3">
                {faqs
                  .filter((f) => f.category === category)
                  .map((faq) => (
                    <Card key={faq.id} className="overflow-hidden">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-neutral-800 marker:content-none">
                          {faq.question}
                          <span className="shrink-0 text-brand-600 transition-transform group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <div className="border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600">
                          {faq.answer}
                        </div>
                      </details>
                    </Card>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-neutral-50 p-6 text-center">
        <p className="font-semibold text-neutral-800">¿Tenés otra consulta?</p>
        <div className="mt-4 flex justify-center">
          <LinkButton href={waHref} target="_blank" rel="noopener noreferrer" variant="whatsapp">
            <IconWhatsApp size={18} /> Escribir por WhatsApp
          </LinkButton>
        </div>
      </div>

      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  );
}
