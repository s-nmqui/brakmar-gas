import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products-repo";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/productos", priority: 0.9 },
    { path: "/servicios", priority: 0.8 },
    { path: "/precios", priority: 0.8 },
    { path: "/promociones", priority: 0.6 },
    { path: "/mides", priority: 0.7 },
    { path: "/como-comprar", priority: 0.7 },
    { path: "/preguntas-frecuentes", priority: 0.6 },
    { path: "/contacto", priority: 0.7 },
    { path: "/ubicacion", priority: 0.5 },
    { path: "/opiniones", priority: 0.5 },
    { path: "/nosotros", priority: 0.6 },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route.priority,
  }));

  for (const product of listProducts({ onlyPublished: true })) {
    entries.push({
      url: `${base}/productos/${product.slug}`,
      lastModified: new Date(product.updatedAt.replace(" ", "T") + "Z"),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
