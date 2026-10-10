import { redirect } from "next/navigation";
import { getSaleById } from "@/lib/sales-repo";
import { listProducts } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { SaleForm } from "@/components/admin/SaleForm";
import { Alert, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminEditarVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const saleId = Number(id);
  const sale = Number.isInteger(saleId) && saleId > 0 ? getSaleById(saleId) : null;

  if (!sale || sale.sale.source !== "manual" || sale.sale.status === "cancelled") {
    redirect("/admin/ventas");
  }

  const products = listProducts();

  return (
    <div>
      <PageHeader
        title={`Editar venta ${sale.sale.saleNumber}`}
        description="Corregí los productos, cantidades o precios. El stock se ajusta automáticamente según lo que cambie."
      />
      <Card className="mt-6 p-5">
        <div className="mb-4">
          <Alert tone="info">
            Al guardar, el stock se ajusta entre lo vendido originalmente y los nuevos valores.
            Anular la venta no es posible desde esta pantalla: usá la acción desde la lista.
          </Alert>
        </div>
        <SaleForm products={products} sale={sale} />
      </Card>
    </div>
  );
}