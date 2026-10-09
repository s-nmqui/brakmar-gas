import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings-repo";
import { getApprovedReviewStats, listReviews } from "@/lib/content-repo";
import { buildMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, SectionTitle, Stars, EmptyState, LinkButton } from "@/components/ui";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { IconWhatsApp } from "@/components/icons";

export function generateMetadata(): Metadata {
  const config = getSiteConfig();
  return buildMetadata(config, {
    title: "Opiniones de clientes",
    description:
      "Opiniones reales de clientes de BrakMar Gas en Belén, Salto. Compartí tu experiencia; las opiniones se publican luego de ser moderadas.",
    path: "/opiniones",
  });
}

function formatDate(value: string): string {
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function OpinionesPage() {
  const config = getSiteConfig();
  const reviews = listReviews("approved");
  const stats = getApprovedReviewStats();
  const waHref = buildWhatsAppUrl(
    config.whatsapp,
    `Hola, ${config.companyName}. Quiero dejar mi opinión.`,
  );

  return (
    <div className="container-page py-10">
      <SectionTitle
        eyebrow="Opiniones"
        title="Lo que dicen nuestros clientes"
        description="Publicamos únicamente opiniones reales y aprobadas. Compartí tu experiencia: tu opinión queda pendiente de moderación antes de publicarse."
      />

      {stats.average !== null && (
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-2xl font-extrabold">{stats.average.toFixed(1)}</span>
          <Stars rating={stats.average} size={18} />
          <span className="text-sm text-neutral-500">
            ({stats.count} {stats.count === 1 ? "opinión" : "opiniones"})
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {reviews.length > 0 ? (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{review.displayName}</p>
                      <Stars rating={review.rating} size={16} />
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(review.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-neutral-700">
                      {review.comment}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Todavía no hay opiniones publicadas"
              description="Aún no contamos con opiniones aprobadas. Podés ser la primera persona en compartir tu experiencia con BrakMar Gas."
              action={
                <LinkButton href="#dejar-opinion">Dejar mi opinión</LinkButton>
              }
            />
          )}
        </div>

        <div id="dejar-opinion" className="lg:sticky lg:top-28 lg:h-fit">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Dejá tu opinión</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Contanos cómo fue tu experiencia.
            </p>
            <div className="mt-5">
              <ReviewForm />
            </div>
            {reviews.length === 0 && (
              <div className="mt-5 border-t border-neutral-100 pt-5 text-sm text-neutral-500">
                También podés escribirnos directo:{" "}
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                >
                  <IconWhatsApp size={16} /> WhatsApp
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
