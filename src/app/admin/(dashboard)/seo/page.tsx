import { getSiteConfig } from "@/lib/settings-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { SeoForm } from "@/components/admin/SeoForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminSeoPage() {
  const config = getSiteConfig();
  return (
    <div>
      <PageHeader
        title="Ajustes SEO"
        description="Títulos, descripciones y palabras clave usados en los buscadores y redes sociales."
      />
      <Card className="max-w-3xl p-6">
        <SeoForm config={config} />
      </Card>
    </div>
  );
}