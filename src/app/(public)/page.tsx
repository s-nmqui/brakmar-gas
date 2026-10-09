import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/settings-repo";
import { listProducts } from "@/lib/products-repo";
import { listFaqs } from "@/lib/content-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionTitle, LinkButton, Card } from "@/components/ui";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFlame,
  IconRefresh,
  IconShield,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    path: "/",
  });
}

const SERVICES = [
  {
    Icon: IconFlame,
    title: "Venta de garrafas",
    text: "Garrafas de 13 kg en formato uruguayo y brasileño, con y sin contenido.",
  },
  {
    Icon: IconRefresh,
    title: "Cargas y recargas",
    text: "Recargá tu garrafa de 13 kg de forma simple, coordinando por WhatsApp.",
  },
  {
    Icon: IconShield,
    title: "Accesorios",
    text: "Válvulas, bases, cabezales y gomitas para el cuidado de tu garrafa.",
  },
  {
    Icon: IconTruck,
    title: "Entrega a domicilio",
    text: "Llevamos tu pedido a toda la localidad de Belén, en el departamento de Salto.",
  },
];

const BENEFITS = [
  "Atención cercana de un negocio familiar de Belén.",
  "Pedidos simples y rápidos por WhatsApp.",
  "Entrega a domicilio en toda la localidad.",
  "Catálogo con disponibilidad y precios actualizados.",
];

const STEPS = [
  "Elegí los productos que necesitás.",
  "Sumalos a tu pedido con las cantidades.",
  "Completá tus datos de entrega.",
  "Revisá el resumen de tu pedido.",
  "Abrí WhatsApp con el mensaje listo.",
  "Enviá el mensaje y esperá la confirmación.",
];

export default function HomePage() {
  const config = getSiteConfig();
  const featured = listProducts({ onlyPublished: true, featuredOnly: true, limit: 6 });
  const fallback = listProducts({ onlyPublished: true, limit: 3 });
  const products = featured.length > 0 ? featured : fallback;
  const faqs = listFaqs(true).slice(0, 4);
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero hacer una consulta o pedido.`,
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-neutral-100 bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div className="container-page relative py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                <IconTruck size={14} /> Entrega a domicilio en Belén
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                Garrafas de gas y accesorios en{" "}
                <span className="text-brand-600">Belén, Salto</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-neutral-600">
                {config.companyName} vende garrafas, envases vacíos, cargas y
                accesorios. Hacé tu pedido por WhatsApp y coordinamos la entrega.
                {" "}
                <span className="font-medium text-neutral-700">{config.slogan}</span>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <LinkButton href="/productos" size="lg">
                  Ver productos
                  <IconArrowRight size={18} />
                </LinkButton>
                <LinkButton
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  <IconWhatsApp size={20} />
                  Pedir por WhatsApp
                </LinkButton>
              </div>
              <dl className="mt-8 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2 text-neutral-700">
                  <IconTruck size={18} className="text-brand-600" />
                  Entrega en Belén
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <IconClock size={18} className="text-brand-600" />
                  Todos los días 9–21 h
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <IconWhatsApp size={18} className="text-brand-600" />
                  Pedidos por WhatsApp
                </div>
              </dl>
            </div>

            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-bold">Hacé tu pedido en simples pasos</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Armá tu pedido en la web y enviá el resumen por WhatsApp.
              </p>
              <ol className="mt-5 space-y-3">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-neutral-700">{step}</span>
                  </li>
                ))}
              </ol>
              <LinkButton href="/como-comprar" variant="outline" className="mt-6 w-full">
                Ver cómo comprar
              </LinkButton>
            </Card>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Productos destacados"
              title="Lo que tenemos para vos"
              description="Revisá el catálogo. Si un producto no muestra precio, escribinos y te lo confirmamos."
            />
            <LinkButton href="/productos" variant="outline">
              Ver todo el catálogo
              <IconArrowRight size={18} />
            </LinkButton>
          </div>
          <div className="mt-8">
            <ProductGrid
              products={products}
              whatsapp={config.whatsapp}
              companyName={config.companyName}
              priorities={3}
            />
          </div>
        </div>
      </section>

      <section className="section bg-neutral-50">
        <div className="container-page">
          <SectionTitle
            eyebrow="Servicios"
            title="Todo para tu garrafa, en un mismo lugar"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ Icon, title, text }) => (
              <Card key={title} className="p-5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/servicios" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
              Conocer todos los servicios <IconArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Por qué elegirnos"
              title="Un negocio de Belén, cerca tuyo"
              description="Trabajamos para que conseguir tu garrafa sea fácil, rápido y sin vueltas."
            />
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-neutral-700">
                  <IconCheck size={20} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <LinkButton href="/nosotros" variant="outline" className="mt-7">
              Conocé {config.companyName}
            </LinkButton>
          </div>
          <Card className="border-brand-100 bg-brand-50/50 p-6 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              <IconShield size={26} />
            </span>
            <h3 className="mt-4 text-xl font-bold">Beneficio MIDES</h3>
            <p className="mt-2 text-sm text-neutral-700">
              Puede aplicar a la compra de garrafas. La información oficial
              (requisitos, montos y vigencia) se publica cuando está verificada.
              Consultanos y te orientamos.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/mides">Ver información MIDES</LinkButton>
              <LinkButton href={waHref} target="_blank" rel="noopener noreferrer" variant="outline">
                <IconWhatsApp size={18} /> Consultar
              </LinkButton>
            </div>
          </Card>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="section bg-neutral-50">
          <div className="container-page">
            <SectionTitle
              eyebrow="Preguntas frecuentes"
              title="Dudas comunes antes de comprar"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <Card key={faq.id} className="p-5">
                  <h3 className="font-bold">{faq.question}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{faq.answer}</p>
                </Card>
              ))}
            </div>
            <div className="mt-6">
              <LinkButton href="/preguntas-frecuentes" variant="outline">
                Ver todas las preguntas
              </LinkButton>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-page">
          <div className="rounded-3xl bg-brand-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              ¿Necesitás una garrafa hoy?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-50">
              Escribinos por WhatsApp. Coordinamos disponibilidad, precio final y
              entrega en Belén.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <LinkButton
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
              >
                <IconWhatsApp size={20} /> Escribir por WhatsApp
              </LinkButton>
              <LinkButton
                href="/productos"
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Ver productos
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
