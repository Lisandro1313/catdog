import { ImageResponse } from "next/og";
import { SITE_NAME, formatPrice, siteUrl } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseMenu, splitDrink } from "@/lib/menu";
import { getUpcomingEvents } from "@/lib/reservations";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La tipografía de la casa, pedida a Google con solo los caracteres que aparecen en el afiche. */
async function loadFont(family: string, text: string, weight = 400): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } },
    ).then((r) => r.text());
    // Satori no lee woff2: se pide el formato que sí entiende.
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Afiche para redes: ?f=cuadrado (publicación) o ?f=historia (historia / estado de WhatsApp).
 *
 * La carta va como en el sitio: número, plato y debajo el cóctel con lo que lleva al lado (el nombre
 * solo no dice nada). En el feed la imagen se ve chica y comprimida, así que todo va en cuerpo grande
 * y bien contrastado. Sale al doble de resolución para que no se pixele al ampliarlo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const story = url.searchParams.get("f") !== "cuadrado";
  const id = url.searchParams.get("id");
  const event = id ? await prisma.event.findFirst({ where: { id, published: true } }) : (await getUpcomingEvents(1))[0];
  if (!event) return new Response("Todavía no hay cena", { status: 404 });

  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const steps = parseMenu(event.menu).slice(0, 6);
  const host = siteUrl().replace(/^https?:\/\//, "");
  const day = `${cap(formatWeekday(event.date))} ${formatDayNumber(event.date)}`;
  const when = `de ${formatMonth(event.date)} · ${formatTime(event.date)} hs`;

  const crudo = [
    SITE_NAME,
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
  // El subset trae solo los caracteres pedidos: las líneas en mayúsculas necesitan sus versiones.
  const text = `${crudo}${crudo.toUpperCase()}`;
  const [regular, bold] = await Promise.all([loadFont("Playfair Display", text, 400), loadFont("Playfair Display", text, 700)]);
  const font = regular ? "Playfair" : "serif";
  const fonts = [
    ...(regular ? [{ name: "Playfair", data: regular, style: "normal" as const, weight: 400 as const }] : []),
    ...(bold ? [{ name: "Playfair", data: bold, style: "normal" as const, weight: 700 as const }] : []),
  ];
  const gold = "#d8b878";

  // Todo se mide sobre un lienzo de 1080 y se emite al doble: nítido aunque lo amplíen.
  const Z = story ? 1.5 : 2;
  const px = (n: number) => Math.round(n * Z);
  const K = steps.length >= 6 ? 0.78 : steps.length >= 5 ? 0.86 : 1;
  // Medidas pensadas para que la carta entre entera: en el cuadrado hay la mitad de alto que en la historia.
  const s = story
    ? { eyebrow: 26, day: 104, when: 42, title: 58, n: 30, dish: 43, drink: 33, note: 27, price: 38, pay: 28, res: 26, host: 44, pad: 136, gapTop: 40, row: 20 }
    : { eyebrow: 21, day: 72, when: 31, title: 42, n: 24, dish: 33, drink: 26, note: 23, price: 30, pay: 23, res: 21, host: 33, pad: 34, gapTop: 22, row: 15 };

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
          padding: `${px(s.pad)}px ${px(62)}px`,
          background: "radial-gradient(ellipse at 50% 32%, #2e2719 0%, #14110e 62%)",
          color: "#f7f1e6",
          fontFamily: font,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: px(story ? 124 : 30),
            bottom: px(story ? 124 : 30),
            left: px(30),
            right: px(30),
            border: `${px(2)}px solid ${gold}`,
            opacity: 0.4,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: px(s.eyebrow), letterSpacing: px(5), textTransform: "uppercase", color: gold, whiteSpace: "nowrap" }}>
          Cena a puertas cerradas · La Plata
        </div>
        <div style={{ display: "flex", fontSize: px(s.day * K), fontWeight: 700, marginTop: px(story ? 14 : 8), lineHeight: 1, color: gold }}>{day}</div>
        <div style={{ display: "flex", fontSize: px(s.when), marginTop: px(8), color: "#efe6d8" }}>{when}</div>
        <div style={{ display: "flex", width: px(150), height: px(2), background: gold, opacity: 0.65, margin: `${px(story ? 22 : 14)}px 0` }} />
        <div style={{ display: "flex", fontSize: px(s.title * K), fontWeight: 700, lineHeight: 1.15, textAlign: "center" }}>{event.title}</div>

        {/* La carta: número, plato y el cóctel que lo acompaña */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: px(story ? 860 : 900), marginTop: px(s.gapTop) }}>
          {steps.map((st, i) => {
            const d = splitDrink(st.drink);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: px(18),
                  padding: `${px(s.row * K)}px 0`,
                  borderTop: i === 0 ? "none" : `${px(1)}px solid rgba(216,184,120,0.22)`,
                }}
              >
                <div style={{ display: "flex", fontSize: px(s.n), color: gold, opacity: 0.85, paddingTop: px(6) }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: px(s.dish * K), lineHeight: 1.22, color: "#f7f1e6" }}>{st.dish}</div>
                  {d.name && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: px(9), marginTop: px(7) }}>
                      <div style={{ display: "flex", fontSize: px(s.drink * K), color: gold, fontStyle: "italic" }}>{d.name}</div>
                      {d.note && <div style={{ display: "flex", fontSize: px(s.note * K), color: "#bdb3a4", lineHeight: 1.3 }}>{d.note}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", fontSize: px(s.price), fontWeight: 700, marginTop: px(s.gapTop), color: "#f7f1e6" }}>
          {formatPrice(event.price)} por persona
        </div>
        <div style={{ display: "flex", fontSize: px(s.pay), marginTop: px(8), color: "#c6bcae" }}>Pocos lugares · efectivo, transferencia o tarjeta</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: px(story ? 22 : 14) }}>
          <div style={{ display: "flex", fontSize: px(s.res), letterSpacing: px(5), textTransform: "uppercase", color: gold }}>Reservá en</div>
          <div style={{ display: "flex", fontSize: px(s.host), fontWeight: 700, marginTop: px(6), color: "#f7f1e6" }}>{host}</div>
        </div>
      </div>
    ),
    {
      width: px(1080),
      height: px(story ? 1920 : 1080),
      fonts: fonts.length ? fonts : undefined,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
