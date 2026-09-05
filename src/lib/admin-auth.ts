import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "catdog_admin";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("admin-session").digest("hex");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminSession() {
  const token = expectedToken();
  if (!token) return;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value || value.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(token));
}
