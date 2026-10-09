"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  submitReviewAction,
  initialReviewState,
} from "@/app/actions/reviews";
import { Alert, Button } from "../ui";
import { IconStar } from "../icons";
import { cn } from "@/lib/cn";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Enviando…" : "Enviar opinión"}
    </Button>
  );
}

export function ReviewForm() {
  const [state, formAction] = useActionState(submitReviewAction, initialReviewState);
  const startedAt = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      startedAt.current = null;
    }
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (startedAt.current === null) startedAt.current = Date.now();
    const elapsed = event.currentTarget.querySelector<HTMLInputElement>(
      'input[name="elapsedMs"]',
    );
    if (elapsed) {
      elapsed.value = String(Math.max(0, Date.now() - startedAt.current));
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="elapsedMs" value="0" />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div>
        <label htmlFor="displayName" className="field-label">
          Nombre para mostrar
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={60}
          autoComplete="name"
          className="field-input"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
        />
        {state.fieldErrors?.displayName && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.displayName}</p>
        )}
      </div>

      <fieldset>
        <legend className="field-label">Calificación</legend>
        <div className="flex flex-row-reverse justify-end gap-1">
          {[5, 4, 3, 2, 1].map((value) => (
            <label key={value} className="cursor-pointer" title={`${value} estrellas`}>
              <input
                type="radio"
                name="rating"
                value={value}
                className="peer sr-only"
                required
              />
              <IconStar
                size={30}
                className={cn(
                  "text-neutral-300 transition-colors peer-checked:text-accent-500 hover:text-accent-400",
                )}
              />
              <span className="sr-only">{value} estrellas</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.rating && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.rating}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="comment" className="field-label">
          Tu comentario
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          className="field-input"
          placeholder="Contanos cómo fue tu experiencia con BrakMar Gas."
          aria-invalid={Boolean(state.fieldErrors?.comment)}
        />
        {state.fieldErrors?.comment && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.comment}</p>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Tu opinión quedará pendiente de moderación. Solo publicaremos las
        opiniones aprobadas.
      </p>

      <SubmitButton />
    </form>
  );
}