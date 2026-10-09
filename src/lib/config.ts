import type { ProductType, SiteConfig } from "./types";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  garrafa_llena: "Garrafa llena",
  garrafa_vacia: "Envase vacío",
  recarga: "Carga / recarga",
  accesorio: "Accesorio",
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  companyName: "BrakMar Gas",
  slogan: "BrakMar Gas, tu garrafa siempre cerca",
  whatsapp: "59891402056",
  whatsappDisplay: "+598 91 402 056",
  schedule: "Todos los días, de lunes a domingo, de 09:00 a 21:00",
  locality: "Belén, departamento de Salto, Uruguay",
  address: "",
  deliveryInfo: "Entrega a domicilio en toda la localidad de Belén.",
  shippingInfo:
    "Envíos a otras partes de Uruguay sujetos a cobertura, disponibilidad y condiciones logísticas a confirmar con BrakMar Gas.",
  email: "",
  googleMapsUrl: "",
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
  seo: {
    defaultTitle: "BrakMar Gas | Garrafas y accesorios en Belén, Salto",
    titleTemplate: "%s | BrakMar Gas",
    defaultDescription:
      "Venta, carga y recarga de garrafas de gas y accesorios en Belén, Salto. Entrega a domicilio en toda la localidad. Pedidos por WhatsApp.",
    keywords:
      "garrafas en Belén, garrafa de 13 kg en Belén, venta de garrafas en Salto, garrafas a domicilio en Belén, accesorios para garrafas en Salto, BrakMar Gas",
  },
  midesSourceUrlDefault: "",
};

export const AVAILABILITY_LABELS = {
  in_stock: "Disponible",
  low_stock: "Últimas unidades",
  out_of_stock: "Agotado",
  unknown: "Consultar disponibilidad",
} as const;
