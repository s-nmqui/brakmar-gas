"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useCart } from "./cart-context";
import { cn } from "@/lib/cn";
import { formatCents, formatCentsOrConsultar } from "@/lib/money";
import { buildWhatsAppUrl, formatOrderMessage } from "@/lib/whatsapp";
import {
  createWebOrderAction,
  type OrderActionResult,
} from "@/app/actions/orders";
import { Alert, Button, LinkButton } from "../ui";
import {
  IconMinus,
  IconPlus,
  IconTrash,
  IconWhatsApp,
} from "../icons";

type Modality = "retiro" | "domicilio";

function contentSignature(payload: {
  items: Array<{ productId: number; quantity: number }>;
  name: string;
  phone: string;
  modality: Modality;
}): string {
  const canonical = payload.items
    .map((i) => `${i.productId}:${i.quantity}`)
    .join("|");
  const input = `${canonical}::${payload.name.trim().toLowerCase()}::${payload.phone.replace(/\D/g, "")}::${payload.modality}`;
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return `c${(h >>> 0).toString(36)}`;
}

function sessionNonce(): string {
  try {
    const existing = window.localStorage.getItem("orderNonce");
    if (existing) return existing;
    const n = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    window.localStorage.setItem("orderNonce", n);
    return n;
  } catch {
    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

const initialState: OrderActionResult = { ok: false };

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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [modality, setModality] = useState<Modality>("retiro");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [opened, setOpened] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: number;
    number: string;
    totalEstLabel: string | null;
  } | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [startedAt] = useState(() => Date.now());
  const [nonce] = useState(() => sessionNonce());

  const cartPayload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const signature = useMemo(
    () => contentSignature({ items: cartPayload, name, phone, modality }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, phone, modality],
  );
  const idempotencyKey = useMemo(
    () => `${nonce}:${signature}`.slice(0, 100),
    [nonce, signature],
  );

  const waUrl = useMemo(() => {
    const message = formatOrderMessage(
      { companyName },
      {
        name,
        phone,
        modality,
        orderNumber: confirmedOrder?.number,
        address,
        locality,
        notes,
        items,
        subtotalCents,
        totalCents: subtotalCents,
        totalLabel: confirmedOrder?.totalEstLabel ?? formatCents(subtotalCents) ?? "a confirmar",
      },
      formatCentsOrConsultar,
    );
    return buildWhatsAppUrl(whatsapp, message);
  }, [companyName, whatsapp, name, phone, modality, address, locality, notes, items, subtotalCents, confirmedOrder]);

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
    const phoneDigits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) next.name = "Ingresá tu nombre.";
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      next.phone = "Ingresá un teléfono válido para coordinar la entrega.";
    }
    if (modality === "domicilio") {
      if (address.trim().length < 3) next.address = "Ingresá la dirección de entrega.";
      if (locality.trim().length < 2) next.locality = "Indicá la localidad.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildMessageUrl(overrides?: { orderNumber?: string; totalLabel?: string }) {
    const message = formatOrderMessage(
      { companyName },
      {
        name,
        phone,
        modality,
        orderNumber: overrides?.orderNumber,
        address,
        locality,
        notes,
        items,
        subtotalCents,
        totalCents: subtotalCents,
        totalLabel: overrides?.totalLabel ?? formatCents(subtotalCents) ?? "a confirmar",
      },
      formatCentsOrConsultar,
    );
    return buildWhatsAppUrl(whatsapp, message);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    if (pending) return;

    setPending(true);
    const website = honeypotRef.current?.value ?? "";
    const fd = new FormData();
    fd.set("idempotencyKey", idempotencyKey);
    fd.set("signature", signature);
    fd.set("name", name);
    fd.set("phone", phone);
    fd.set("address", modality === "domicilio" ? address : "");
    fd.set("locality", modality === "domicilio" ? locality : "");
    fd.set("modality", modality);
    fd.set("notes", notes);
    fd.set("items", JSON.stringify(cartPayload));
    fd.set("website", website);
    fd.set("elapsedMs", String(Date.now() - startedAt));

    const res = await createWebOrderAction(initialState, fd);
    setPending(false);

    if (res.ok && res.order) {
      setConfirmedOrder({
        id: res.order.id,
        number: res.order.number,
        totalEstLabel: res.order.totalEstLabel,
      });
      setOpened(true);
      const url = buildMessageUrl({
        orderNumber: res.order.number,
        totalLabel: res.order.totalEstLabel ?? formatCents(subtotalCents) ?? "a confirmar",
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setFormError(
        res.message ?? "No se pudo registrar el pedido. Podés enviarlo igual por WhatsApp.",
      );
      if (res.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...res.fieldErrors }));
      }
    }
  }

  function handleOpenFallback() {
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
        <form onSubmit={handleSubmit}>
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
                <label htmlFor="phone" className="field-label">
                  Teléfono *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field-input"
                  placeholder="099 123 456"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <span className="field-label">¿Cómo preferís recibirlo?</span>
                <div className="flex gap-3">
                  {(["retiro", "domicilio"] as const).map((m) => (
                    <label
                      key={m}
                      className={cn(
                        "flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                        modality === m
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-neutral-300 hover:border-neutral-400",
                      )}
                    >
                      <input
                        type="radio"
                        name="modality"
                        value={m}
                        checked={modality === m}
                        onChange={() => setModality(m)}
                        className="sr-only"
                      />
                      {m === "retiro" ? "Retiro en tienda" : "Entrega a domicilio"}
                    </label>
                  ))}
                </div>
              </div>

              {modality === "domicilio" && (
                <>
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
                </>
              )}

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

              <label className="sr-only" htmlFor="website">
                Dejá este campo vacío
              </label>
              <input
                ref={honeypotRef}
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="sr-only"
                aria-hidden="true"
              />
            </div>

            <div className="mt-5">
              <Button
                type="submit"
                variant="whatsapp"
                size="lg"
                className="w-full"
                disabled={pending}
              >
                <IconWhatsApp size={20} />
                {pending ? "Registrando pedido…" : "Registrar pedido y abrir WhatsApp"}
              </Button>
              <button
                type="button"
                onClick={handleOpenFallback}
                className="mt-2 block w-full text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                ¿No se envió? Abrí WhatsApp manualmente
              </button>
            </div>

            {formError && (
              <div className="mt-4">
                <Alert tone="error">{formError}</Alert>
              </div>
            )}

            {opened && !formError && (
              <div className="mt-4">
                <Alert tone="info">
                  Revisá el mensaje en WhatsApp y enviálo. Tu pedido quedó
                  registrado y {confirmedOrder ? `te llegó como ${confirmedOrder.number}` : "puede tardar un momento en confirmarse"}.{" "}
                  El pago y la forma de entrega se coordinan con {companyName}.
                </Alert>
              </div>
            )}

            {confirmedOrder && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Pedido registrado: <strong>{confirmedOrder.number}</strong>. Conservalo como
                referencia al coordinar la entrega.
              </div>
            )}

            <p className="mt-4 text-xs text-neutral-500">
              Al confirmar, tu pedido queda registrado para que podamos atenderlo. Tus
              datos se usan solo para la gestión del pedido y no se publican.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}