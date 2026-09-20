import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { argentinaDay } from "@/lib/dates";

/** Rutas que se cuentan (las que llevan TrackVisit o el embudo de la reserva). Cualquier otra se ignora. */
const KNOWN = new Set(["/", "/fechas", "/hoy", "/hoy/jugar", "/reservar"]);

/** Cuenta una visita. Sin cookies ni datos personales: solo día + ruta. */
export async function POST(req: NextRequest) {
  let path = "/";
  try {
    const body = (await req.json()) as { path?: string };
    if (typeof body.path === "string" && KNOWN.has(body.path)) path = body.path;
    else if (typeof body.path === "string") return NextResponse.json({ ok: true });
  } catch {
    // sin body: cuenta como home
  }
  // No contamos las visitas del panel ni las del entorno local (la base es la misma que en producción).
  if (path.startsWith("/admin") || process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true });

  const day = argentinaDay();
  await prisma.pageView.upsert({
    where: { day_path: { day, path } },
    update: { count: { increment: 1 } },
    create: { day, path, count: 1 },
  });
  return NextResponse.json({ ok: true });
}
