"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSiteConfigAction } from "@/app/actions/settings";
import type { AdminFormState } from "@/app/actions/content";
import type { SiteConfig } from "@/lib/types";
import { Alert, Button } from "../ui";

const initialState: AdminFormState = { ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar configuración"}
    </Button>
  );
}

export function SettingsForm({ config }: { config: SiteConfig }) {
  const [state, formAction] = useActionState(saveSiteConfigAction, initialState);
  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="companyName" className="field-label">
            Nombre del negocio *
          </label>
          <input
            id="companyName"
            name="companyName"
            required
            maxLength={80}
            defaultValue={config.companyName}
            className="field-input"
          />
          {state.fieldErrors?.companyName && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.companyName}</p>
          )}
        </div>
        <div>
          <label htmlFor="slogan" className="field-label">
            Slogan
          </label>
          <input
            id="slogan"
            name="slogan"
            maxLength={160}
            defaultValue={config.slogan}
            className="field-input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="whatsapp" className="field-label">
            WhatsApp (solo dígitos, con código de país) *
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            required
            inputMode="tel"
            maxLength={20}
            defaultValue={config.whatsapp}
            className="field-input"
            placeholder="59891402056"
          />
          {state.fieldErrors?.whatsapp && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.whatsapp}</p>
          )}
        </div>
        <div>
          <label htmlFor="whatsappDisplay" className="field-label">
            WhatsApp (formato visible en la web)
          </label>
          <input
            id="whatsappDisplay"
            name="whatsappDisplay"
            maxLength={40}
            defaultValue={config.whatsappDisplay}
            className="field-input"
            placeholder="+598 91 402 056"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="schedule" className="field-label">
            Horario de atención
          </label>
          <input
            id="schedule"
            name="schedule"
            maxLength={200}
            defaultValue={config.schedule}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="locality" className="field-label">
            Localidad (para la web)
          </label>
          <input
            id="locality"
            name="locality"
            maxLength={160}
            defaultValue={config.locality}
            className="field-input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address" className="field-label">
            Dirección (opcional)
          </label>
          <input
            id="address"
            name="address"
            maxLength={200}
            defaultValue={config.address}
            className="field-input"
            placeholder="Solo si confirmaste la dirección exacta"
          />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Correo de contacto (opcional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={160}
            defaultValue={config.email}
            className="field-input"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="deliveryInfo" className="field-label">
          Información de entrega
        </label>
        <textarea
          id="deliveryInfo"
          name="deliveryInfo"
          rows={2}
          maxLength={400}
          defaultValue={config.deliveryInfo}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="shippingInfo" className="field-label">
          Envíos a otras localidades
        </label>
        <textarea
          id="shippingInfo"
          name="shippingInfo"
          rows={2}
          maxLength={400}
          defaultValue={config.shippingInfo}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="googleMapsUrl" className="field-label">
          URL del mapa de Google (opcional)
        </label>
        <input
          id="googleMapsUrl"
          name="googleMapsUrl"
          type="url"
          maxLength={400}
          defaultValue={config.googleMapsUrl}
          className="field-input"
          placeholder="https://maps.app.goo.gl/…"
        />
        {state.fieldErrors?.googleMapsUrl && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.googleMapsUrl}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="instagram" className="field-label">
            Instagram (opcional)
          </label>
          <input
            id="instagram"
            name="instagram"
            type="url"
            maxLength={200}
            defaultValue={config.social.instagram}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="facebook" className="field-label">
            Facebook (opcional)
          </label>
          <input
            id="facebook"
            name="facebook"
            type="url"
            maxLength={200}
            defaultValue={config.social.facebook}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="tiktok" className="field-label">
            TikTok (opcional)
          </label>
          <input
            id="tiktok"
            name="tiktok"
            type="url"
            maxLength={200}
            defaultValue={config.social.tiktok}
            className="field-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="midesSourceUrlDefault" className="field-label">
          URL oficial MIDES por defecto (opcional)
        </label>
        <input
          id="midesSourceUrlDefault"
          name="midesSourceUrlDefault"
          type="url"
          maxLength={300}
          defaultValue={config.midesSourceUrlDefault}
          className="field-input"
        />
      </div>

      <SaveButton />
    </form>
  );
}