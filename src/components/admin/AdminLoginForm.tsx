"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Alert, Button } from "../ui";
import { Logo } from "../site/Logo";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ingresá con tu cuenta de administrador.
        </p>
        <form action={formAction} className="mt-6 space-y-4">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <div>
            <label htmlFor="username" className="field-label">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              required
              autoComplete="username"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>
          <SubmitButton />
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-neutral-400">
        Acceso restringido. Las credenciales se configuran mediante variables de
        entorno.
      </p>
    </div>
  );
}
