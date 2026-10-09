import Link from "next/link";
import { getFaqById, listFaqs } from "@/lib/content-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { FaqForm } from "@/components/admin/FaqForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { deleteFaqAction } from "@/app/actions/content";
import { Badge, Card, EmptyState } from "@/components/ui";
import { IconEdit, IconPlus, IconTrash } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const faqs = listFaqs();
  const editing = sp.edit ? getFaqById(Number(sp.edit)) : null;

  const groups = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    const list = groups.get(faq.category) ?? [];
    list.push(faq);
    groups.set(faq.category, list);
  }

  return (
    <div>
      <PageHeader
        title="Preguntas frecuentes"
        description="Las preguntas publicadas se muestran en /preguntas-frecuentes."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-4">
            <h2 className="font-bold">
              {editing ? `Editar pregunta` : "Nueva pregunta"}
            </h2>
            {editing && (
              <Link
                href="/admin/faq"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Cancelar
              </Link>
            )}
          </div>
          <div className="p-5">
            <FaqForm faq={editing} />
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {faqs.length === 0 ? (
            <EmptyState
              title="No hay preguntas"
              description="Creá la primera pregunta frecuente para tus clientes."
            />
          ) : (
            Array.from(groups.entries()).map(([category, items]) => (
              <div key={category}>
                <h2 className="mb-3 font-bold">{category}</h2>
                <div className="grid gap-3">
                  {items.map((faq) => (
                    <Card key={faq.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {faq.question}{" "}
                          {!faq.isPublished && <Badge tone="neutral">Oculta</Badge>}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/admin/faq?edit=${faq.id}`}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                        >
                          <IconEdit size={16} />
                        </Link>
                        <ActionButton
                          action={deleteFaqAction}
                          fields={{ id: faq.id }}
                          confirmMessage="¿Eliminar esta pregunta?"
                        >
                          <IconTrash size={16} />
                        </ActionButton>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
          {faqs.length > 0 && (
            <p className="text-xs text-neutral-500">
              <IconPlus size={12} /> Tip: el orden de aparición se controla con el campo
              “Orden”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}