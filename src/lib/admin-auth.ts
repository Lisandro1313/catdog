import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "catdog_admin";
const SESSION_DAYS = 30;

export type Session = {
  /** Nombre con el que se firma cada movimiento. */
  name: string;
  /** master = entró con la contraseña maestra; user = con su usuario. */
  role: "master" | "user";
};

// --- Secretos ---------------------------------------------------------------

function secret(): string | null {
  return process.env.APP_SECRET ?? process.env.ADMIN_PASSWORD ?? null;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function safeEqual(a: string, b: string): boolean {
  // Se comparan los hashes y no los textos: asi el resultado no depende del largo de la contrasena real.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** La contraseña maestra (variable ADMIN_PASSWORD). Siempre entra, por si se pierde un usuario. */
export function checkMaster(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return safeEqual(input, password);
}

// --- Contraseñas de usuarios (scrypt, sin dependencias) -----------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(candidate, hash);
}

export async function verifyUser(name: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return false;
  return verifyPassword(password, user.passwordHash);
}

// --- Sesión firmada (cookie) -----------------------------------------------

function sign(payload: string): string {
  const s = secret();
  if (!s) throw new Error("Falta ADMIN_PASSWORD/APP_SECRET");
  return createHmac("sha256", s).update(payload).digest("hex");
}

export async function setSession(session: Session) {
  const payload = Buffer.from(JSON.stringify({ ...session, t: Date.now() })).toString("base64url");
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  if (!secret()) return null;
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session> & { t?: number };
    if (!data.name || (data.role !== "master" && data.role !== "user")) return null;
    if (typeof data.t !== "number" || Date.now() - data.t > SESSION_DAYS * 24 * 60 * 60 * 1000) return null;
    return { name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession()) !== null;
}

/** Nombre para firmar movimientos. Con la maestra, el nombre lo elige en el formulario. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Sin sesión");
  return s;
}

// Compatibilidad con código anterior.
export const checkPassword = checkMaster;
export const setAdminSession = () => setSession({ name: "Admin", role: "master" });
export const clearAdminSession = clearSession;
