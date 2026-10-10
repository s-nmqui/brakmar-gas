import { listProducts } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { SaleForm } from "@/components/admin/SaleForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminNuevaVentaPage() {
  const products = listProducts();
  return (
    <div>
      <PageHeader
        title="Nueva venta"
        description="Registrá una venta manual. Los totales se calculan automáticamente y el stock se descuenta al guardar."
      />
      <Card className="mt-6 p-5">
        <SaleForm products={products} />
      </Card>
    </div>
  );
}