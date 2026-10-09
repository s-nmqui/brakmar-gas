import { listReviews } from "@/lib/content-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { ActionButton } from "@/components/admin/ActionButton";
import {
  deleteReviewAction,
  moderateReviewAction,
} from "@/app/actions/content";
import { Badge, Card, EmptyState, Stars } from "@/components/ui";
import { IconCheck, IconClose, IconTrash, IconRefresh } from "@/components/icons";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-UY");
}

function ReviewCard({ review, hasBadge }: { review: Review; hasBadge?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold">{review.displayName}</span>
          <Stars rating={review.rating} size={14} />
        </div>
        {hasBadge && (
          <Badge tone={review.status === "approved" ? "success" : review.status === "rejected" ? "danger" : "warning"}>
            {review.status}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">{formatDate(review.createdAt)}</p>
      <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{review.comment}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
        {review.status !== "approved" && (
          <ActionButton
            action={moderateReviewAction}
            fields={{ id: review.id, status: "approved" }}
            variant="primary"
          >
            <IconCheck size={16} /> Aprobar
          </ActionButton>
        )}
        {review.status !== "rejected" && (
          <ActionButton
            action={moderateReviewAction}
            fields={{ id: review.id, status: "rejected" }}
            variant="outline"
          >
            <IconClose size={16} /> Rechazar
          </ActionButton>
        )}
        {review.status === "pending" ? (
          <span />
        ) : (
          <ActionButton
            action={moderateReviewAction}
            fields={{ id: review.id, status: "pending" }}
            variant="subtle"
          >
            <IconRefresh size={16} /> Volver a pendiente
          </ActionButton>
        )}
        <ActionButton
          action={deleteReviewAction}
          fields={{ id: review.id }}
          confirmMessage="¿Eliminar esta reseña?"
          className="ml-auto"
        >
          <IconTrash size={16} />
        </ActionButton>
      </div>
    </Card>
  );
}

function Section({
  title,
  count,
  reviews,
}: {
  title: string;
  count: number;
  reviews: Review[];
}) {
  if (reviews.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 font-bold">
        {title} <span className="text-neutral-400">({count})</span>
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const all = listReviews();
  const pending = all.filter((r) => r.status === "pending");
  const approved = all.filter((r) => r.status === "approved");
  const rejected = all.filter((r) => r.status === "rejected");

  return (
    <div>
      <PageHeader
        title="Reseñas"
        description="Las opiniones se publican en /opiniones solo después de ser aprobadas."
      />
      {all.length === 0 ? (
        <EmptyState
          title="No hay reseñas"
          description="Cuando los clientes dejen opiniones, aparecerán aquí para moderarlas."
        />
      ) : (
        <div className="space-y-8">
          <Section title="Pendientes de moderación" count={pending.length} reviews={pending} />
          <Section title="Aprobadas" count={approved.length} reviews={approved} />
          <Section title="Rechazadas" count={rejected.length} reviews={rejected} />
        </div>
      )}
    </div>
  );
}