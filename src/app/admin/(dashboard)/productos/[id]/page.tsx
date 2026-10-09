import { notFound } from "next/navigation";
import { getProductById, listCategories } from "@/lib/products-repo";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(Number(id));
  if (!product) notFound();
  const categories = listCategories();

  return (
    <div>
      <PageHeader title="Editar producto" description={product.name} />
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
