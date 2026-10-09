"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveFaqAction, type AdminFormState } from "@/app/actions/content";
import type { Faq } from "@/lib/types";
import { Alert, Button } from "../ui";

const initialState: AdminFormState = { ok: false };
const CATEGORIES = ["General", "Productos", "Pedidos", "Entregas", "Pagos", "Atención", "MIDES"];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar pregunta"}
    </Button>
  );
}

export function FaqForm({ faq }: { faq?: Faq | null }) {
  const [state, formAction] = useActionState(saveFaqAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div>
        <label htmlFor="question" className="field-label">
          Pregunta *
        </label>
        <input
          id="question"
          name="question"
          required
          maxLength={300}
          defaultValue={faq?.question ?? ""}
          className="field-input"
        />
        {state.fieldErrors?.question && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.question}</p>
        )}
      </div>

      <div>
        <label htmlFor="answer" className="field-label">
          Respuesta *
        </label>
        <textarea
          id="answer"
          name="answer"
          required
          rows={4}
          maxLength={2000}
          defaultValue={faq?.answer ?? ""}
          className="field-input"
        />
        {state.fieldErrors?.answer && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.answer}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="category" className="field-label">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={faq?.category ?? "General"}
            className="field-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="field-label">
            Orden
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={faq?.sortOrder ?? 0}
            className="field-input"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={faq ? faq.isPublished : true}
              className="h-4 w-4"
            />
            Publicada
          </label>
        </div>
      </div>

      <SaveButton />
    </form>
  );
}