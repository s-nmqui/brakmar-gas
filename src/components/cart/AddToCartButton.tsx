"use client";

import { useState } from "react";
import { useCart } from "./cart-context";
import type { Product } from "@/lib/types";
import { Button } from "../ui";
import { IconCheck, IconPlus } from "../icons";

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className,
  label = "Agregar al pedido",
}: {
  product: Pick<Product, "id" | "slug" | "name" | "priceCents" | "promoPriceCents">;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const unit = product.promoPriceCents ?? product.priceCents;

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      className={className}
      onClick={() => {
        add(
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            unitPriceCents: unit,
          },
          quantity,
        );
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      {added ? <IconCheck size={18} /> : <IconPlus size={18} />}
      {added ? "Agregado" : label}
    </Button>
  );
}
