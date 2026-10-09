"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button, LinkButton } from "../ui";
import { useCart } from "../cart/cart-context";
import { cn } from "@/lib/cn";
import { IconCheck, IconMinus, IconPlus, IconWhatsApp } from "../icons";

export function ProductActions({
  product,
  whatsapp,
  companyName,
}: {
  product: Product;
  whatsapp: string;
  companyName: string;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const unit = product.promoPriceCents ?? product.priceCents;

  const waHref = buildWhatsAppUrl(
    whatsapp,
    [
      `Hola, ${companyName}. Quiero pedir:`,
      `* ${product.name} x ${quantity}${
        unit !== null ? ` (${formatCents(unit)} c/u)` : ""
      }`,
      "",
      "¿Me confirman disponibilidad, precio final y entrega? Gracias.",
    ].join("\n"),
  );

  const canOrder = product.availability !== "out_of_stock";

  return (
    <div className="space-y-5">
      <div>
        <span className="field-label">Cantidad</span>
        <div className="inline-flex items-center rounded-full border border-neutral-300">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-l-full text-neutral-700 hover:bg-neutral-100"
            aria-label="Quitar una unidad"
          >
            <IconMinus size={18} />
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => {
              const n = Number(e.target.value);
              setQuantity(Number.isFinite(n) ? Math.min(99, Math.max(1, Math.round(n))) : 1);
            }}
            className="h-11 w-14 border-x border-neutral-300 bg-white text-center text-base font-semibold outline-none"
            aria-label="Cantidad"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-r-full text-neutral-700 hover:bg-neutral-100"
            aria-label="Agregar una unidad"
          >
            <IconPlus size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          size="lg"
          disabled={!canOrder}
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
          {added ? <IconCheck size={20} /> : <IconPlus size={20} />}
          {added ? "Agregado al pedido" : "Agregar al pedido"}
        </Button>
        <LinkButton
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
          className={cn(!canOrder && "pointer-events-none opacity-60")}
        >
          <IconWhatsApp size={20} />
          Pedir por WhatsApp
        </LinkButton>
      </div>

      {!canOrder && (
        <p className="text-sm font-medium text-red-600">
          Por el momento este producto figura como agotado. Escribinos para
          consultar reposición.
        </p>
      )}
      {unit === null && canOrder && (
        <p className="text-sm text-neutral-500">
          El precio todavía no está configurado. Podés consultarlo por WhatsApp.
        </p>
      )}
    </div>
  );
}
