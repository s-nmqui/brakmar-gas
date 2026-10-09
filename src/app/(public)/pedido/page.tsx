import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { buildMetadata } from "@/lib/seo";
import { OrderForm } from "@/components/cart/OrderForm";
import { SectionTitle } from "@/components/ui";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Mi pedido",
    description:
      "Revisá tu pedido, completá tus datos y envialo por WhatsApp a BrakMar Gas.",
    path: "/pedido",
    noIndex: true,
  });
}

export default function PedidoPage() {
  const config = getSiteConfig();
  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Pedido"
        title="Tu pedido"
        description="Revisá los productos, completá tus datos y abrí WhatsApp con el mensaje listo. El pedido se confirma cuando BrakMar Gas te responde."
      />
      <div className="mt-8">
        <OrderForm companyName={config.companyName} whatsapp={config.whatsapp} />
      </div>
    </div>
  );
}
