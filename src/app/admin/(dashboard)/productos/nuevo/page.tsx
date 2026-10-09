import { listCategories } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  const categories = listCategories();
  return (
    <div>
      <PageHeader
        title="Nuevo producto"
        description="Completá los datos del producto. Se publica según el estado elegido."
      />
      <ProductForm categories={categories} product={null} />
    </div>
  );
}
