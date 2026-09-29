import { NextResponse } from "next/server";
import { entrar, googleConfigurado, guardarSesion, leerState, perfilDesdeCodigo, urlDeGoogle } from "@/lib/entrar";

export const dynamic = "force-dynamic";

/**
 * La puerta de Google, ida y vuelta en la misma dirección.
 *
 * Sin `code` es la ida: se manda a Google. Con `code` es la vuelta: se cambia por el perfil, se
 * anota al jugador y se vuelve a donde estaba.
 */
export async function GET(req: Request) {
  if (!googleConfigurado()) return NextResponse.redirect(new URL("/hoy/jugar?entrar=no", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // La ida.
  if (!code) {
    const volverA = url.searchParams.get("volver") ?? "/hoy/jugar";
    return NextResponse.redirect(urlDeGoogle(volverA));
  }

  // La vuelta. Si el state no lo firmamos nosotros, el viaje no salió de acá.
  const state = leerState(url.searchParams.get("state"));
  if (!state) return NextResponse.redirect(new URL("/hoy/jugar?entrar=error", req.url));

  const perfil = await perfilDesdeCodigo(code);
  if (!perfil) return NextResponse.redirect(new URL(`${state.destino}?entrar=error`, req.url));

  const jugador = await entrar(perfil);
  await guardarSesion(jugador);
  return NextResponse.redirect(new URL(state.destino, req.url));
}
