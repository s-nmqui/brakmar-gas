"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSeoAction } from "@/app/actions/settings";
import type { AdminFormState } from "@/app/actions/content";
import type { SiteConfig } from "@/lib/types";
import { Alert, Button } from "../ui";

const initialState: AdminFormState = { ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar ajustes SEO"}
    </Button>
  );
}

export function SeoForm({ config }: { config: SiteConfig }) {
  const [state, formAction] = useActionState(saveSeoAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div>
        <label htmlFor="defaultTitle" className="field-label">
          Título por defecto *
        </label>
        <input
          id="defaultTitle"
          name="defaultTitle"
          required
          maxLength={160}
          defaultValue={config.seo.defaultTitle}
          className="field-input"
        />
        {state.fieldErrors?.defaultTitle && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.defaultTitle}</p>
        )}
      </div>

      <div>
        <label htmlFor="titleTemplate" className="field-label">
          Plantilla de títulos *
        </label>
        <input
          id="titleTemplate"
          name="titleTemplate"
          required
          maxLength={160}
          defaultValue={config.seo.titleTemplate}
          className="field-input"
          placeholder="%s | BrakMar Gas"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Usá <code>%s</code> como lugar donde va el título de cada página.
        </p>
        {state.fieldErrors?.titleTemplate && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.titleTemplate}</p>
        )}
      </div>

      <div>
        <label htmlFor="defaultDescription" className="field-label">
          Descripción por defecto
        </label>
        <textarea
          id="defaultDescription"
          name="defaultDescription"
          rows={3}
          maxLength={320}
          defaultValue={config.seo.defaultDescription}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="keywords" className="field-label">
          Palabras clave (separadas por coma)
        </label>
        <textarea
          id="keywords"
          name="keywords"
          rows={3}
          maxLength={500}
          defaultValue={config.seo.keywords}
          className="field-input"
        />
      </div>

      <SaveButton />
    </form>
  );
}