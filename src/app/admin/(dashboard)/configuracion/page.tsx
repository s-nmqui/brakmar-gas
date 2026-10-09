import { getSiteConfig } from "@/lib/settings-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminConfigPage() {
  const config = getSiteConfig();
  return (
    <div>
      <PageHeader
        title="Configuración del sitio"
        description="Datos visibles en todo el sitio: contacto, horarios, información de entrega y redes."
      />
      <Card className="max-w-3xl p-6">
        <SettingsForm config={config} />
      </Card>
    </div>
  );
}