import type { Metadata } from "next";
import { getSiteUrl } from "./site";
import type { Product, SiteConfig } from "./types";

export function buildMetadata(
  config: SiteConfig,
  options: {
    title?: string;
    description?: string;
    path?: string;
    noIndex?: boolean;
  },
): Metadata {
  const siteUrl = getSiteUrl();
  const title = options.title
    ? config.seo.titleTemplate.replace("%s", options.title)
    : config.seo.defaultTitle;
  const description = options.description || config.seo.defaultDescription;
  const canonical = options.path ? `${siteUrl}${options.path}` : siteUrl;
  return {
    title,
    description,
    keywords: config.seo.keywords,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    robots: options.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: config.companyName,
      locale: "es_UY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function localBusinessJsonLd(config: SiteConfig) {
  const siteUrl = getSiteUrl();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: config.companyName,
    description: config.seo.defaultDescription,
    slogan: config.slogan,
    url: siteUrl,
    telephone: `+${config.whatsapp}`,
    areaServed: ["Belén", "Salto", "Uruguay"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Belén",
      addressRegion: "Salto",
      addressCountry: "UY",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "21:00",
      },
    ],
  };
  // Sólo incluimos dirección exacta si fue confirmada por el negocio.
  if (config.address) {
    (data.address as Record<string, unknown>).streetAddress = config.address;
  }
  if (config.googleMapsUrl) {
    data.hasMap = config.googleMapsUrl;
  }
  return data;
}

export function productJsonLd(product: Product) {
  const siteUrl = getSiteUrl();
  const price = product.promoPriceCents ?? product.priceCents;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${siteUrl}/productos/${product.slug}`,
    category: product.categoryName ?? undefined,
  };
  if (price !== null) {
    data.offers = {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency: "UYU",
      availability:
        product.availability === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `${siteUrl}/productos/${product.slug}`,
    };
  }
  return data;
}
