import { getMidesInfo } from "@/lib/content-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { MidesForm } from "@/components/admin/MidesForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminMidesPage() {
  const mides = getMidesInfo();
  return (
    <div>
      <PageHeader
        title="Beneficio MIDES"
        description="Publicá información verificada del beneficio MIDES para garrafas. Si no está confirmada, dejá los campos sin completar."
      />
      <Card className="max-w-3xl p-6">
        <p className="mb-5 text-xs text-neutral-400">
          Última actualización: {mides.updatedAt || "sin datos"}
        </p>
        <MidesForm mides={mides} />
      </Card>
    </div>
  );
}