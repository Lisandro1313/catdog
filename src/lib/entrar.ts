import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { siteUrl } from "./config";
import { dayKey } from "./juegos";

/**
 * Entrar con Google, para jugar.
 *
 * Está escrito a mano y no con una librería de autenticación por dos razones: solo hay un proveedor
 * y lo único que necesitamos es un nombre, y la librería del caso choca con la versión de nodemailer
 * que usa el sitio para los mails. Son cien líneas y usan el mismo cookie firmado que ya usa el panel.
 *
 * De la persona se guarda lo justo para saber quién viene y cuántas veces. El mail queda como
 * identidad, no para escribirle.
 */

const COOKIE = "catdog_jugador";
const DIAS = 120;

export type Jugador = { id: string; nombre: string; foto: string | null };

function secreto(): string | null {
  return process.env.APP_SECRET ?? process.env.ADMIN_PASSWORD ?? null;
}

function firmar(payload: string): string {
  const s = secreto();
  if (!s) throw new Error("Falta APP_SECRET");
  return createHmac("sha256", s).update(payload).digest("hex");
}

function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Si están las credenciales de Google. Sin esto, la puerta no existe y se juega como antes. */
export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && secreto());
}

function redirectUri(): string {
  return `${siteUrl()}/api/entrar/google`;
}

/**
 * A dónde mandarlo para que entre. El `state` va firmado: es lo que impide que alguien arme el
 * viaje de vuelta desde otro lado.
 */
export function urlDeGoogle(volverA: string): string {
  const nonce = randomBytes(12).toString("base64url");
  const destino = volverA.startsWith("/") ? volverA : "/hoy/jugar";
  const payload = Buffer.from(JSON.stringify({ nonce, destino })).toString("base64url");
  const state = `${payload}.${firmar(payload)}`;
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

/** Lee el state de vuelta. Devuelve a dónde seguir, o null si no lo firmamos nosotros. */
export function leerState(state: string | null): { destino: string } | null {
  if (!state) return null;
  const punto = state.lastIndexOf(".");
  if (punto < 0) return null;
  const payload = state.slice(0, punto);
  if (!igual(state.slice(punto + 1), firmar(payload))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { destino?: string };
    return { destino: d.destino?.startsWith("/") ? d.destino : "/hoy/jugar" };
  } catch {
    return null;
  }
}

type PerfilGoogle = { sub: string; email: string; name: string; picture?: string };

/**
 * Cambia el código por el perfil. El token que devuelve Google se valida contra Google mismo, y se
 * chequea que haya sido emitido para esta aplicación: sin eso, cualquiera podría traer un token de
 * otra app y entrar.
 */
export async function perfilDesdeCodigo(code: string): Promise<PerfilGoogle | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) return null;

  const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
  if (!info.ok) return null;
  const d = (await info.json()) as { sub?: string; aud?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string };
  if (!d.sub || d.aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (d.email_verified !== true && d.email_verified !== "true") return null;
  return { sub: d.sub, email: d.email ?? "", name: d.name?.trim() || "Alguien", picture: d.picture };
}

/**
 * Anota al jugador y le cuenta la noche. Una misma noche no suma dos veces, aunque entre y salga
 * varias veces.
 */
export async function entrar(perfil: PerfilGoogle): Promise<Jugador> {
  const hoy = dayKey();
  const previo = await prisma.jugador.findUnique({ where: { googleSub: perfil.sub } });
  const nuevaNoche = previo?.ultimaDia !== hoy;
  const j = await prisma.jugador.upsert({
    where: { googleSub: perfil.sub },
    update: {
      email: perfil.email,
      nombre: perfil.name,
      foto: perfil.picture ?? null,
      ultimaDia: hoy,
      ...(nuevaNoche ? { noches: { increment: 1 } } : {}),
    },
    create: { googleSub: perfil.sub, email: perfil.email, nombre: perfil.name, foto: perfil.picture ?? null, ultimaDia: hoy, noches: 1 },
  });
  return { id: j.id, nombre: j.nombre, foto: j.foto };
}

export async function guardarSesion(j: Jugador) {
  const payload = Buffer.from(JSON.stringify({ ...j, t: Date.now() })).toString("base64url");
  const store = await cookies();
  store.set(COOKIE, `${payload}.${firmar(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * DIAS,
  });
}

export async function salir() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Quién está jugando ahora, si entró. */
export async function jugadorActual(): Promise<Jugador | null> {
  if (!secreto()) return null;
  const store = await cookies();
  const valor = store.get(COOKIE)?.value;
  if (!valor) return null;
  const punto = valor.lastIndexOf(".");
  if (punto < 0) return null;
  const payload = valor.slice(0, punto);
  if (!igual(valor.slice(punto + 1), firmar(payload))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Jugador> & { t?: number };
    if (!d.id || !d.nombre) return null;
    if (typeof d.t !== "number" || Date.now() - d.t > DIAS * 24 * 60 * 60 * 1000) return null;
    return { id: d.id, nombre: d.nombre, foto: d.foto ?? null };
  } catch {
    return null;
  }
}
