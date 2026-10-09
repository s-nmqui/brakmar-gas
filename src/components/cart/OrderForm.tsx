"use client";

import { useMemo, useState } from "react";
import { useCart } from "./cart-context";
import { cn } from "@/lib/cn";
import { formatCents, formatCentsOrConsultar } from "@/lib/money";
import { buildWhatsAppUrl, formatOrderMessage } from "@/lib/whatsapp";
import { Alert, Button, LinkButton } from "../ui";
import {
  IconMinus,
  IconPlus,
  IconTrash,
  IconWhatsApp,
} from "../icons";

export function OrderForm({
  companyName,
  whatsapp,
}: {
  companyName: string;
  whatsapp: string;
}) {
  const { items, subtotalCents, hasUnpricedItems, setQuantity, remove, clear } =
    useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState(false);

  const waUrl = useMemo(() => {
    const message = formatOrderMessage(
      { companyName },
      {
        name,
        address,
        locality,
        notes,
        items,
        subtotalCents,
        totalCents: subtotalCents,
        totalLabel: formatCents(subtotalCents) ?? "a confirmar",
      },
      formatCentsOrConsultar,
    );
    return buildWhatsAppUrl(whatsapp, message);
  }, [companyName, whatsapp, name, address, locality, notes, items, subtotalCents]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-neutral-800">Tu pedido está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          Agregá productos del catálogo para armar tu pedido y enviarlo por WhatsApp.
        </p>
        <div className="mt-5 flex justify-center">
          <LinkButton href="/productos">Ver productos</LinkButton>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Ingresá tu nombre.";
    if (address.trim().length < 3) next.address = "Ingresá tu dirección.";
    if (locality.trim().length < 2) next.locality = "Indicá tu localidad.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleOpen() {
    if (!validate()) return;
    setOpened(true);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-bold">Productos del pedido</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-neutral-500">
                    {formatCentsOrConsultar(item.unitPriceCents)} c/u
                  </p>
                </div>
                <div className="flex items-center rounded-full border border-neutral-300">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-l-full hover:bg-neutral-100"
                    aria-label={`Quitar una unidad de ${item.name}`}
                  >
                    <IconMinus size={16} />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-r-full hover:bg-neutral-100"
                    aria-label={`Agregar una unidad de ${item.name}`}
                  >
                    <IconPlus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Quitar ${item.name} del pedido`}
                >
                  <IconTrash size={18} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <IconTrash size={16} /> Vaciar pedido
            </Button>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Subtotal</p>
              <p className="text-lg font-bold">
                {subtotalCents === null ? "A confirmar" : formatCents(subtotalCents)}
              </p>
            </div>
          </div>
          {hasUnpricedItems && (
            <p className="mt-2 text-xs text-amber-700">
              Hay productos sin precio configurado. El subtotal se mostrará cuando
              se completen. Igual podés enviar tu pedido.
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-bold">Tus datos</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="field-label">
                Nombre *
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="address" className="field-label">
                Dirección *
              </label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="field-input"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div>
              <label htmlFor="locality" className="field-label">
                Localidad *
              </label>
              <input
                id="locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="field-input"
                placeholder="Belén, Salto"
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.locality)}
              />
              {errors.locality && (
                <p className="mt-1 text-sm text-red-600">{errors.locality}</p>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="field-label">
                Instrucciones (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="field-input"
                placeholder="Referencias de entrega, horarios, etc."
              />
            </div>
          </div>

          <div className={cn("mt-5")}> 
            <Button type="button" variant="whatsapp" size="lg" className="w-full" onClick={handleOpen}>
              <IconWhatsApp size={20} /> Abrir WhatsApp con el pedido
            </Button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              ¿No se abrió? Abrí WhatsApp manualmente
            </a>
          </div>

          {opened && (
            <div className="mt-4">
              <Alert tone="info">
                Revisá el mensaje en WhatsApp y envíalo. El pedido se confirma
                cuando {companyName} te responde. Abrir WhatsApp no confirma el
                pedido automáticamente.
              </Alert>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-500">
            Tus datos se usan solo para preparar el mensaje de WhatsApp y no se
            almacenan en la web.
          </p>
        </div>
      </div>
    </div>
  );
}
