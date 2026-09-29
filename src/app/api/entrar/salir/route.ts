import { NextResponse } from "next/server";
import { salir } from "@/lib/entrar";

export const dynamic = "force-dynamic";

/** Salir: se borra la sesión del jugador y vuelve a los juegos. */
export async function GET(req: Request) {
  await salir();
  return NextResponse.redirect(new URL("/hoy/jugar", req.url));
}
