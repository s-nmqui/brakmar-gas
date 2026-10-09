"use client";

import Link from "next/link";
import { useCart } from "./cart-context";
import { IconCart } from "../icons";

export function CartButton({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link
      href="/pedido"
      className={
        className ??
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100"
      }
      aria-label={count > 0 ? `Ver pedido (${count} productos)` : "Ver pedido"}
    >
      <IconCart size={22} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
