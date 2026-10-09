import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-context";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BrakMar Gas | Garrafas y accesorios en Belén, Salto",
    template: "%s | BrakMar Gas",
  },
  description:
    "Venta, carga y recarga de garrafas de gas y accesorios en Belén, Salto. Entrega a domicilio en toda la localidad. Pedidos por WhatsApp.",
  keywords:
    "garrafas en Belén, garrafa de 13 kg en Belén, venta de garrafas en Salto, garrafas a domicilio en Belén, accesorios para garrafas en Salto, BrakMar Gas",
  applicationName: "BrakMar Gas",
  authors: [{ name: "BrakMar Gas" }],
  openGraph: {
    type: "website",
    locale: "es_UY",
    siteName: "BrakMar Gas",
    title: "BrakMar Gas | Garrafas y accesorios en Belén, Salto",
    description:
      "Venta, carga y recarga de garrafas de gas y accesorios en Belén. Entrega a domicilio. Pedidos por WhatsApp.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d21f26",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="flex min-h-full flex-col bg-white">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
