"use client";

import { useState } from "react";

type Props = {
  title: string;
  dateLabel: string;
  lines: string[];
  score: { hits: number; total: number; stars: number } | null;
  siteHost: string;
};

/** Parte una línea larga en varias que entren en `max` px. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}

/** Dibuja la tarjeta (formato historia, 1080×1920) con la carta de la noche y el puntaje. */
function draw({ title, dateLabel, lines, score, siteHost }: Props): HTMLCanvasElement {
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#14100d");
  bg.addColorStop(1, "#241a13");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Marco fino dorado
  ctx.strokeStyle = "rgba(201,169,110,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a96e";
  ctx.font = "500 34px Georgia, serif";
  ctx.fillText("✦  ESTUVE EN  ✦", W / 2, 230);
  ctx.fillStyle = "#f3ebdd";
  ctx.font = "italic 700 120px Georgia, serif";
  ctx.fillText("CatDog", W / 2, 380);
  ctx.fillStyle = "#c9a96e";
  ctx.font = "500 36px Georgia, serif";
  ctx.fillText(title.toUpperCase(), W / 2, 460);
  ctx.fillStyle = "rgba(243,235,221,0.7)";
  ctx.font = "400 32px Georgia, serif";
  ctx.fillText(dateLabel, W / 2, 515);

  let y = 640;
  ctx.font = "400 40px Georgia, serif";
  for (const l of lines.slice(0, 7)) {
    const rows = wrap(ctx, l, W - 260);
    for (const r of rows) {
      ctx.fillStyle = r.startsWith("con ") ? "#c9a96e" : "#f3ebdd";
      ctx.font = r.startsWith("con ") ? "italic 400 34px Georgia, serif" : "400 40px Georgia, serif";
      ctx.fillText(r, W / 2, y);
      y += r.startsWith("con ") ? 44 : 52;
    }
    y += 26;
    if (y > 1450) break;
  }

  if (score) {
    ctx.fillStyle = "rgba(201,169,110,0.15)";
    ctx.fillRect(160, 1500, W - 320, 170);
    ctx.fillStyle = "#f3ebdd";
    ctx.font = "700 64px Georgia, serif";
    ctx.fillText(`${score.hits} de ${score.total}`, W / 2, 1575);
    ctx.fillStyle = "#c9a96e";
    ctx.font = "400 30px Georgia, serif";
    ctx.fillText(`ingredientes escondidos · ${score.stars} ✦`, W / 2, 1630);
  }

  ctx.fillStyle = "rgba(243,235,221,0.6)";
  ctx.font = "400 30px Georgia, serif";
  ctx.fillText("Una cena a puertas cerradas en La Plata", W / 2, 1760);
  ctx.fillStyle = "#c9a96e";
  ctx.fillText(siteHost, W / 2, 1810);
  return c;
}

/** Botón que arma la tarjeta y la comparte (o la descarga si el celular no puede compartir archivos). */
export function TarjetaButton(props: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const c = draw(props);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      if (!blob) throw new Error("no blob");
      const file = new File([blob], "catdog.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "CatDog", text: `Estuve en CatDog · ${props.title}` });
      } else {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = "catdog.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMsg("Se descargó la tarjeta. Subila a tus historias.");
      }
    } catch {
      setMsg("No se pudo armar la tarjeta en este navegador.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button className="btn btn-ghost btn-sm" type="button" onClick={go} disabled={busy}>
        {busy ? "Armando…" : "Tarjeta para historias"}
      </button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
