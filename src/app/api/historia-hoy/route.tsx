import { ImageResponse } from "next/og";
import { isAdmin } from "@/lib/admin-auth";
import { getBarra } from "@/lib/barra";
import { ZONE } from "@/lib/config";
import { formatWeekday } from "@/lib/dates";
import { loadFont } from "@/lib/fuente-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PLATO = 60;
const MAX_DETALLE = 120;

/**
 * La historia del día: "Hoy, jueves · Bondiola braseada · abrimos a las 18". Se arma desde el panel
 * (Salón → Historia del día) con lo que sale esa noche, y se baja lista para subir.
 *
 * Lo de abajo queda libre a propósito: ahí va el sticker del link, y arriba Instagram pone su barra.
 * Todo se mide sobre 1080×1920 y sale a 1,5x para que no se pixele.
 */
export async function GET(req: Request) {
  // En la compu de desarrollo se puede mirar sin entrar al panel, como /productos.
  if (process.env.NODE_ENV !== "development" && !(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const url = new URL(req.url);
  const barra = await getBarra();
  const plato = (url.searchParams.get("p") ?? "").replace(/\s+/gu, " ").trim().slice(0, MAX_PLATO) || "Bondiola braseada";
  const detalle = (url.searchParams.get("d") ?? "").replace(/\s+/gu, " ").trim().slice(0, MAX_DETALLE);

  const dia = formatWeekday(new Date());
  const hoy = `Hoy, ${dia}`;
  const horario = barra.horario || "Desde las 18 hs";
  const donde = barra.direccion || ZONE;
  const frase = "Si llegaste hasta acá, alguien te contó.";
  const marca = "CATDOG · LA PLATA";

  const texto = [hoy, plato, detalle, horario, donde, frase, marca].join("");
  const [regular, bold] = await Promise.all([loadFont("Playfair Display", texto, 400), loadFont("Playfair Display", texto, 700)]);
  const font = regular ? "Playfair" : "serif";
  const fonts = [
    ...(regular ? [{ name: "Playfair", data: regular, style: "normal" as const, weight: 400 as const }] : []),
    ...(bold ? [{ name: "Playfair", data: bold, style: "normal" as const, weight: 700 as const }] : []),
  ];

  const Z = 1.5;
  const px = (n: number) => Math.round(n * Z);
  const gold = "#d8b878";
  // Un plato largo ("Bondiola braseada con papas rústicas") no puede salirse del cuadro.
  const tamPlato = plato.length > 34 ? 96 : plato.length > 20 ? 118 : 140;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `${px(300)}px ${px(90)}px ${px(420)}px`,
          background: "radial-gradient(ellipse at 50% 38%, #2e2719 0%, #14110e 64%)",
          color: "#f7f1e6",
          fontFamily: font,
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: px(150),
            bottom: px(150),
            left: px(36),
            right: px(36),
            border: `${px(2)}px solid ${gold}`,
            opacity: 0.4,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: px(28), letterSpacing: px(8), color: gold }}>{marca}</div>
        <div style={{ display: "flex", fontSize: px(64), marginTop: px(70), color: gold }}>{hoy}</div>
        <div style={{ display: "flex", width: px(150), height: px(2), background: gold, opacity: 0.65, margin: `${px(40)}px 0` }} />
        <div style={{ display: "flex", fontSize: px(tamPlato), fontWeight: 700, lineHeight: 1.08, justifyContent: "center" }}>{plato}</div>
        {detalle && (
          <div style={{ display: "flex", fontSize: px(44), lineHeight: 1.35, marginTop: px(36), color: "#d9cfbf", justifyContent: "center" }}>
            {detalle}
          </div>
        )}

        <div style={{ display: "flex", fontSize: px(50), marginTop: px(90), color: "#f7f1e6" }}>{horario}</div>
        <div style={{ display: "flex", fontSize: px(34), marginTop: px(12), color: "#bdb3a4" }}>{donde}</div>

        <div style={{ display: "flex", fontSize: px(36), marginTop: px(90), color: gold }}>{frase}</div>
      </div>
    ),
    {
      width: px(1080),
      height: px(1920),
      fonts: fonts.length ? fonts : undefined,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
