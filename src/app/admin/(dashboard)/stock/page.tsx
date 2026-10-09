import { listProducts } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { StockRow } from "@/components/admin/StockRow";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminStockPage() {
  const products = listProducts();
  return (
    <div>
      <PageHeader
        title="Stock"
        description="Actualizá el stock, el aviso de stock bajo y la disponibilidad de cada producto."
      />
      {products.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description="Creá productos en el catálogo para poder administrar su stock."
        />
      ) : (
        <Card className="mt-6 overflow-hidden">
          {products.map((product) => (
            <StockRow key={product.id} product={product} />
          ))}
        </Card>
      )}
    </div>
  );
}
