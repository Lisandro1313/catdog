import { ImageResponse } from "next/og";
import { SITE_NAME, formatPrice, siteUrl } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseMenu } from "@/lib/menu";
import { getUpcomingEvents } from "@/lib/reservations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Afiche listo para redes con la próxima cena: ?f=historia (1080×1920, historia de Instagram /
 * estado de WhatsApp) o ?f=cuadrado (1080×1080, publicación). Texto dentro de la zona segura
 * (250 px arriba y abajo en la historia). ?id=<cena> para otra fecha.
 */
async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": "curl/8" },
    }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!url || url.includes("woff2")) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const story = url.searchParams.get("f") !== "cuadrado";
  const id = url.searchParams.get("id");
  const event = id ? await prisma.event.findUnique({ where: { id } }) : (await getUpcomingEvents(1))[0];
  if (!event) return new Response("Todavía no hay cena", { status: 404 });

  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const W = 1080;
  const H = story ? 1920 : 1080;
  const steps = parseMenu(event.menu).slice(0, 6);
  const host = siteUrl().replace(/^https?:\/\//, "");
  const day = `${cap(formatWeekday(event.date))} ${formatDayNumber(event.date)}`;
  const when = `de ${formatMonth(event.date)} · ${formatTime(event.date)} hs`;
  const count = await prisma.event.count({ where: { published: true, unlisted: false } });
  const title = count <= 1 ? "Apertura" : "Próxima cena";

  const text = [SITE_NAME, title, day, when, event.title, ...steps.map((s) => s.dish), formatPrice(event.price), host, "Cena a puertas cerradas · La Plata", "por persona · pocos lugares", "Reservá en", "0123456789"].join("");
  const playfair = await loadFont("Playfair Display", text);
  const font = playfair ? "Playfair" : "serif";
  const gold = "#c9a96e";

  const S = story ? 1 : 0.62; // escala de tipografías para el cuadrado

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
          padding: story ? "250px 80px" : "70px 80px",
          background: "radial-gradient(ellipse at 50% 35%, #2a2419 0%, #141210 60%)",
          color: "#f3ede4",
          fontFamily: font,
        }}
      >
        {/* marco */}
        <div
          style={{
            position: "absolute",
            top: story ? 215 : 40,
            bottom: story ? 215 : 40,
            left: 40,
            right: 40,
            border: `2px solid ${gold}`,
            opacity: 0.35,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: 22 * S + 8, letterSpacing: 6, textTransform: "uppercase", color: gold, whiteSpace: "nowrap" }}>
          Cena a puertas cerradas · La Plata
        </div>
        <div style={{ display: "flex", fontSize: 150 * S, marginTop: 30 * S, lineHeight: 1 }}>{title}</div>
        <div style={{ display: "flex", width: 160, height: 2, background: gold, margin: `${40 * S}px 0` }} />
        <div style={{ display: "flex", fontSize: 110 * S, lineHeight: 1, color: gold }}>{day}</div>
        <div style={{ display: "flex", fontSize: 40 * S + 6, marginTop: 14, color: "#e6dfd3" }}>{when}</div>

        <div style={{ display: "flex", fontSize: 44 * S + 4, marginTop: 60 * S, color: "#f3ede4" }}>{event.title}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 * S, gap: 12 * S }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", fontSize: 30 * S + 4, color: "#cfc6b8", textAlign: "center", maxWidth: 860 }}>
              {s.dish}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 34 * S + 4, marginTop: 60 * S, color: "#9a9187" }}>
          {formatPrice(event.price)} por persona · pocos lugares
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 * S }}>
          <div style={{ display: "flex", fontSize: 24 * S + 6, letterSpacing: 6, textTransform: "uppercase", color: gold }}>Reservá en</div>
          <div style={{ display: "flex", fontSize: 40 * S + 8, marginTop: 8, color: "#f3ede4" }}>{host}</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: playfair ? [{ name: "Playfair", data: playfair, style: "normal", weight: 400 }] : undefined,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
