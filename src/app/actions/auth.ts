"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  ensureAdminSeed,
  setSessionCookie,
  verifyCredentials,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/validation";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  ensureAdminSeed();

  const username = cleanText(formData.get("username"), 60);
  const password = cleanText(formData.get("password"), 200);

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "desconocido";
  const limit = checkRateLimit(`login:${ip}`, 8, 15 * 60);
  if (!limit.allowed) {
    return {
      error: "Demasiados intentos. Esperá unos minutos antes de volver a intentar.",
    };
  }

  if (!username || !password) {
    return { error: "Completá usuario y contraseña." };
  }

  if (!verifyCredentials(username, password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await setSessionCookie(username);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}
