"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "brakmar-cart-v1";
const EMPTY: CartItem[] = [];

let cached: CartItem[] | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function isValidItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.productId === "number" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    (typeof i.unitPriceCents === "number" || i.unitPriceCents === null) &&
    typeof i.quantity === "number" &&
    i.quantity > 0
  );
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cached = EMPTY;
      return EMPTY;
    }
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      cached = EMPTY;
      return EMPTY;
    }
    cached = parsed.filter(isValidItem).slice(0, 100);
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function subscribeStorage(callback: () => void): () => void {
  function onStorage() {
    cached = null;
    callback();
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function writeStorage(next: CartItem[]) {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible */
  }
  emitChange();
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number | null;
  hasUnpricedItems: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeStorage, readStorage, () => EMPTY);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const current = readStorage();
    const existing = current.find((i) => i.productId === item.productId);
    if (existing) {
      writeStorage(
        current.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
            : i,
        ),
      );
      return;
    }
    writeStorage([...current, { ...item, quantity: Math.max(1, quantity) }]);
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    writeStorage(
      readStorage()
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(99, Math.max(0, quantity)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: number) => {
    writeStorage(readStorage().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => writeStorage([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const hasUnpricedItems = items.some((i) => i.unitPriceCents === null);
    const subtotalCents = hasUnpricedItems
      ? null
      : items.reduce((sum, i) => sum + (i.unitPriceCents ?? 0) * i.quantity, 0);
    return {
      items,
      count,
      subtotalCents,
      hasUnpricedItems,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}