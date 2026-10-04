import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { argentinaDay } from "@/lib/dates";
import { deDeLaRuta, esRutaDeAccion } from "@/lib/origen";

/**
 * Rutas que se cuentan (las que llevan TrackVisit o el embudo de la reserva). Cualquier otra se ignora.
 * /precios queda afuera a propósito: es el cartel de la tablet de la casa y contarlo inflaría todo.
 */
const KNOWN = new Set(["/", "/fechas", "/hoy", "/hoy/jugar", "/reservar", "/eventos", "/productos", "/carta"]);

/**
 * Qué se cuenta: una ruta conocida, esa misma ruta con su `?de=` (de dónde llegó), o un clic
 * de los que se miden. Cualquier otra cosa se ignora: el cuerpo lo escribe el navegador.
 */
function aceptada(ruta: string): boolean {
  if (esRutaDeAccion(ruta)) return true;
  const de = deDeLaRuta(ruta);
  if (!de) return KNOWN.has(ruta);
  return KNOWN.has(ruta.slice(0, ruta.indexOf("?de=")));
}

/** Cuenta una visita. Sin cookies ni datos personales: solo día + ruta. */
export async function POST(req: NextRequest) {
  let path = "/";
  try {
    const body = (await req.json()) as { path?: string };
    if (typeof body.path === "string" && aceptada(body.path)) path = body.path;
    else if (typeof body.path === "string") return NextResponse.json({ ok: true });
  } catch {
    // sin body: cuenta como home
  }
  // No contamos las visitas del panel ni las del entorno local (la base es la misma que en producción).
  if (path.startsWith("/admin") || process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true });
  // Un contador, no una métrica: con 60 por IP cada 15 minutos alcanza y no se infla desde un script.
  if (!(await allowRequest("visita", 60))) return NextResponse.json({ ok: true });

  const day = argentinaDay();
  await prisma.pageView.upsert({
    where: { day_path: { day, path } },
    update: { count: { increment: 1 } },
    create: { day, path, count: 1 },
  });
  return NextResponse.json({ ok: true });
}
