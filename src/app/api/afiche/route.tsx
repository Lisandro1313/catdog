import { ImageResponse } from "next/og";
import { SITE_NAME, formatPrice, siteUrl } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseMenu, splitDrink } from "@/lib/menu";
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
  const event = id ? await prisma.event.findFirst({ where: { id, published: true } }) : (await getUpcomingEvents(1))[0];
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

  const text = [
    SITE_NAME,
    title,
    day,
    when,
    event.title,
    ...steps.flatMap((st) => [st.dish, st.drink ?? ""]),
    formatPrice(event.price),
    host,
    "Cena a puertas cerradas · La Plata",
    "por persona · pocos lugares",
    "Efectivo, transferencia o tarjeta en la puerta",
    "Reservá en",
    "0123456789",
  ].join("");
  const playfair = await loadFont("Playfair Display", text);
  const font = playfair ? "Playfair" : "serif";
  const gold = "#c9a96e";

  // El cuadrado tiene la mitad de alto: todo se achica, y con carta larga un poco más.
  const S = story ? 1 : 0.62;
  const K = steps.length >= 5 ? 0.86 : 1;

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
          padding: story ? "170px 70px" : "54px 60px",
          background: "radial-gradient(ellipse at 50% 35%, #2a2419 0%, #141210 60%)",
          color: "#f3ede4",
          fontFamily: font,
        }}
      >
        {/* marco */}
        <div
          style={{
            position: "absolute",
            top: story ? 150 : 32,
            bottom: story ? 150 : 32,
            left: 32,
            right: 32,
            border: `2px solid ${gold}`,
            opacity: 0.35,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: 20 * S + 7, letterSpacing: 6, textTransform: "uppercase", color: gold, whiteSpace: "nowrap" }}>
          Cena a puertas cerradas · La Plata
        </div>
        <div style={{ display: "flex", fontSize: 96 * S, marginTop: 18 * S, lineHeight: 1, color: gold }}>{day}</div>
        <div style={{ display: "flex", fontSize: 34 * S + 6, marginTop: 10, color: "#e6dfd3" }}>{when}</div>
        <div style={{ display: "flex", width: 150, height: 2, background: gold, opacity: 0.6, margin: `${26 * S}px 0` }} />
        <div style={{ display: "flex", fontSize: 54 * S + 6, lineHeight: 1.1, color: "#f3ede4", textAlign: "center" }}>{event.title}</div>

        {/* La carta, igual que en el sitio: número, plato y debajo el cóctel */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: story ? 800 : 820, marginTop: 34 * S * K }}>
          {steps.map((st, i) => {
            const d = splitDrink(st.drink);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 18,
                  padding: `${16 * S * K}px 0`,
                  borderTop: i === 0 ? "none" : "1px solid rgba(201,169,110,0.18)",
                }}
              >
                <div style={{ display: "flex", fontSize: 26 * S + 4, color: gold, opacity: 0.8, paddingTop: 4 }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 34 * S * K + 6, lineHeight: 1.25, color: "#f3ede4" }}>{st.dish}</div>
                  {d.name && (
                    <div style={{ display: "flex", fontSize: 27 * S * K + 4, marginTop: 6, color: gold, fontStyle: "italic" }}>{d.name}</div>
                  )}
                  {d.note && (
                    <div style={{ display: "flex", fontSize: 22 * S * K + 3, marginTop: 3, color: "#9a9187", lineHeight: 1.35 }}>{d.note}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", fontSize: 30 * S + 6, marginTop: 34 * S, color: "#cfc6b8" }}>
          {formatPrice(event.price)} por persona · pocos lugares
        </div>
        <div style={{ display: "flex", fontSize: 22 * S + 5, marginTop: 8, color: "#9a9187" }}>Efectivo, transferencia o tarjeta en la puerta</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 26 * S }}>
          <div style={{ display: "flex", fontSize: 20 * S + 6, letterSpacing: 6, textTransform: "uppercase", color: gold }}>Reservá en</div>
          <div style={{ display: "flex", fontSize: 34 * S + 8, marginTop: 6, color: "#f3ede4" }}>{host}</div>
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
