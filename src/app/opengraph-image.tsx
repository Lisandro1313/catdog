import { ImageResponse } from "next/og";
import { SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { getUpcomingEvents } from "@/lib/reservations";

/** Imagen que muestra WhatsApp / Instagram al compartir el link. Se genera con la próxima fecha. */
export const alt = "Cena a puertas cerradas en La Plata";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    // Sin User-Agent de navegador, Google Fonts devuelve TTF (Satori no lee woff2).
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

export default async function Image() {
  const [event] = await getUpcomingEvents(1);
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const headline = event ? `${cap(formatWeekday(event.date))} ${formatDayNumber(event.date)}` : "Próximamente";
  const when = event ? `de ${formatMonth(event.date)} · ${formatTime(event.date)} hs` : "Una cena en una casa de La Plata";
  const sub = event ? `${formatPrice(event.price)} por persona · pocos lugares` : "";
  const menu = event?.title ?? "";
  const soldOut = Boolean(event) && event.free <= 0;

  const text = `${SITE_NAME}${headline}${when}${sub}${menu}Cena a puertas cerradas · La PlataCada plato con su cóctel de autorAgotado · abrimos la próxima fecha0123456789`;
  const playfair = await loadFont("Playfair Display", text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 30%, #2a2419 0%, #141210 65%)",
          color: "#f3ede4",
          fontFamily: playfair ? "Playfair" : "serif",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, textTransform: "uppercase", color: "#c9a96e" }}>
          Cena a puertas cerradas · La Plata
        </div>
        <div style={{ display: "flex", fontSize: 128, marginTop: 24, lineHeight: 1, textAlign: "center" }}>{headline}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 14, color: "#e6dfd3" }}>{when}</div>
        <div style={{ display: "flex", width: 140, height: 2, background: "#c9a96e", marginTop: 30 }} />
        <div style={{ display: "flex", fontSize: 40, marginTop: 26, color: "#f3ede4" }}>{menu}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 12, color: soldOut ? "#d98c74" : "#9a9187" }}>
          {soldOut ? "Agotado · abrimos la próxima fecha" : sub}
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#c9a96e", letterSpacing: 4 }}>
          Cada plato con su cóctel de autor
        </div>
      </div>
    ),
    {
      ...size,
      fonts: playfair ? [{ name: "Playfair", data: playfair, style: "normal", weight: 400 }] : undefined,
    },
  );
}
