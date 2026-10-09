import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const SESSION_COOKIE = "bg_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

interface GlobalSecret {
  __brakmarDevSecret?: string;
}
const g = globalThis as unknown as GlobalSecret;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET no está configurado (mínimo 32 caracteres). Definilo en las variables de entorno.",
    );
  }
  if (!g.__brakmarDevSecret) {
    g.__brakmarDevSecret = randomBytes(32).toString("hex");
    console.warn(
      "[BrakMar Gas] SESSION_SECRET no configurado. Usando secreto temporal de desarrollo; las sesiones se invalidan al reiniciar.",
    );
  }
  return g.__brakmarDevSecret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const derived = scryptSync(password, salt, expected.length);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function createSessionToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.sub !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export interface Session {
  username: string;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return { username: payload.sub };
}

export async function setSessionCookie(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function ensureAdminSeed(): void {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM admin_users")
    .get() as { c: number };
  if (row.c > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 10) {
    console.warn(
      "[BrakMar Gas] No hay usuarios administradores. Definí ADMIN_USERNAME y ADMIN_PASSWORD (mínimo 10 caracteres) para crear la cuenta inicial.",
    );
    return;
  }

  db.prepare(
    "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
  ).run(username, hashPassword(password));
  console.log(`[BrakMar Gas] Cuenta administradora "${username}" creada.`);
}

export function verifyCredentials(username: string, password: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT username, password_hash FROM admin_users WHERE username = ?")
    .get(username) as { username: string; password_hash: string } | undefined;
  if (!row) {
    // Consumir tiempo similar para evitar enumeración de usuarios.
    scryptSync(password, "static-salt-value", 64);
    return false;
  }
  return verifyPassword(password, row.password_hash);
}

export async function requireAdminAction(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("No autorizado.");
  }
  return session;
}
