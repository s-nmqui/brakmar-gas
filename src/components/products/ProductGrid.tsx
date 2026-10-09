import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  whatsapp,
  companyName,
  priorities = 0,
}: {
  products: Product[];
  whatsapp: string;
  companyName: string;
  priorities?: number;
}) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            whatsapp={whatsapp}
            companyName={companyName}
            priority={index < priorities}
          />
        </li>
      ))}
    </ul>
  );
}
