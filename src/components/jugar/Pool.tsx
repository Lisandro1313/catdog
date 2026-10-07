"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";

const W = 360;
const H = 600;
const BANDA = 20;
const R = 10;
const TRONERA = 17;
const TIROS = 10;
const FUERZA_MAX = 1150;
const COLORES = ["#e8c547", "#2f5fb3", "#c23b31", "#6a3d9a", "#e07b2a", "#2e8b57", "#7b1f2b"];

type Bola = { x: number; y: number; vx: number; vy: number; color: string; adentro: boolean; blanca: boolean };
type Props = { onDone: (bolas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

const TRONERAS = [
  { x: BANDA, y: BANDA },
  { x: W - BANDA, y: BANDA },
  { x: BANDA - 2, y: H / 2 },
  { x: W - BANDA + 2, y: H / 2 },
  { x: BANDA, y: H - BANDA },
  { x: W - BANDA, y: H - BANDA },
];

function armarMesa(): Bola[] {
  const bolas: Bola[] = [{ x: W / 2, y: H * 0.76, vx: 0, vy: 0, color: "#f6f0e2", adentro: false, blanca: true }];
  // El triángulo: 1, 2 y 4 bolas, arriba.
  const filas = [1, 2, 4];
  let c = 0;
  filas.forEach((n, fila) => {
    for (let i = 0; i < n; i++) {
      bolas.push({ x: W / 2 + (i - (n - 1) / 2) * (R * 2 + 1), y: H * 0.28 - fila * (R * 1.8), vx: 0, vy: 0, color: COLORES[c++], adentro: false, blanca: false });
    }
  });
  return bolas;
}

/**
 * Embocá: la mesa de pool de la casa, en el celular. Se apoya el dedo en cualquier lado y se tira
 * para atrás, como una gomera: la línea muestra para dónde sale la blanca y con cuánta fuerza.
 * Diez tiros para meter las siete. Meter la blanca resta una.
 */
export function Pool({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [adentro, setAdentro] = useState(0);
  const [tiros, setTiros] = useState(TIROS);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bolas = useRef<Bola[]>([]);
  const apunte = useRef<{ desde: { x: number; y: number }; hasta: { x: number; y: number } } | null>(null);
  const quietas = useRef(true);
  const reported = useRef(false);
  const estado = useRef({ adentro: 0, tiros: TIROS });

  function start() {
    keepAwake();
    reported.current = false;
    bolas.current = armarMesa();
    estado.current = { adentro: 0, tiros: TIROS };
    setAdentro(0);
    setTiros(TIROS);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const ctx = prepararLienzo(canvas.current, W, H);
    if (!ctx) return;
    let raf = 0;
    let antes = performance.now();

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const bs = bolas.current;
      // Varios pasos chicos por cuadro: a fuerza máxima una bola puede atravesar a otra en un paso grande.
      const SUB = 4;
      let moviendo = false;
      for (let s = 0; s < SUB; s++) {
        const h = dt / SUB;
        for (const b of bs) {
          if (b.adentro) continue;
          b.x += b.vx * h;
          b.y += b.vy * h;
          const roce = Math.exp(-1.15 * h);
          b.vx *= roce;
          b.vy *= roce;
          if (Math.hypot(b.vx, b.vy) < 7) {
            b.vx = 0;
            b.vy = 0;
          } else moviendo = true;
          // Troneras antes que bandas: si está en la boca, cae.
          if (TRONERAS.some((p) => Math.hypot(b.x - p.x, b.y - p.y) < TRONERA)) {
            b.adentro = true;
            b.vx = 0;
            b.vy = 0;
            if (b.blanca) {
              estado.current.adentro = Math.max(0, estado.current.adentro - 1);
              buzz();
            } else {
              estado.current.adentro += 1;
              beep(330, 120, "triangle", 0.14);
              setTimeout(() => beep(495, 160, "triangle", 0.14), 90);
              tap(15);
            }
            setAdentro(estado.current.adentro);
            continue;
          }
          if (b.x < BANDA + R) {
            b.x = BANDA + R;
            b.vx = Math.abs(b.vx) * 0.82;
          } else if (b.x > W - BANDA - R) {
            b.x = W - BANDA - R;
            b.vx = -Math.abs(b.vx) * 0.82;
          }
          if (b.y < BANDA + R) {
            b.y = BANDA + R;
            b.vy = Math.abs(b.vy) * 0.82;
          } else if (b.y > H - BANDA - R) {
            b.y = H - BANDA - R;
            b.vy = -Math.abs(b.vy) * 0.82;
          }
        }
        // Choques entre bolas: misma masa, el impulso se reparte sobre la línea que las une.
        for (let i = 0; i < bs.length; i++) {
          const a = bs[i];
          if (a.adentro) continue;
          for (let j = i + 1; j < bs.length; j++) {
            const b = bs[j];
            if (b.adentro) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            if (d === 0 || d >= R * 2) continue;
            const nx = dx / d;
            const ny = dy / d;
            const solape = (R * 2 - d) / 2;
            a.x -= nx * solape;
            a.y -= ny * solape;
            b.x += nx * solape;
            b.y += ny * solape;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel <= 0) continue;
            const imp = rel * 0.96;
            a.vx -= imp * nx;
            a.vy -= imp * ny;
            b.vx += imp * nx;
            b.vy += imp * ny;
            if (rel > 60) beep(900 + Math.random() * 200, 25, "sine", Math.min(0.12, rel / 4000));
          }
        }
      }

      const blanca = bs[0];
      if (!moviendo && !quietas.current) {
        // Terminó el tiro. Si se metió la blanca, vuelve a su lugar.
        if (blanca.adentro) {
          blanca.adentro = false;
          blanca.x = W / 2;
          blanca.y = H * 0.76;
          while (bs.some((o) => o !== blanca && !o.adentro && Math.hypot(o.x - blanca.x, o.y - blanca.y) < R * 2)) blanca.x += R;
        }
        const quedan = bs.filter((b) => !b.blanca && !b.adentro).length;
        if (quedan === 0 || estado.current.tiros <= 0) {
          setPhase("end");
          return;
        }
      }
      quietas.current = !moviendo;

      dibujar(ctx, bs, quietas.current ? apunte.current : null);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(adentro);
    }
  }, [phase, adentro, onDone]);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    return puntoEnLienzo(e, canvas.current!, W, H);
  }

  if (phase === "end") {
    return (
      <Shell title="Embocá" onBack={onBack}>
        <Fin nueva={nueva} game="pool" value={adentro} label={`${adentro} ${adentro === 1 ? "bola" : "bolas"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Taco fino." />
      </Shell>
    );
  }

  return (
    <Shell title="Embocá" onBack={onBack} right={phase === "play" ? <>{adentro} · {tiros} tiros</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🎱
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Apoyá el dedo y tirá para atrás, como una gomera: la línea te muestra para dónde y con cuánta fuerza sale la blanca. Diez tiros para meter las
            siete. Si metés la blanca, resta una.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Armar la mesa
          </button>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="jg-lienzo mt-3"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="Mesa de pool"
          onPointerDown={(e) => {
            if (!quietas.current || estado.current.tiros <= 0) return;
            capturar(e);
            const p = punto(e);
            apunte.current = { desde: p, hasta: p };
          }}
          onPointerMove={(e) => {
            if (apunte.current) apunte.current = { ...apunte.current, hasta: punto(e) };
          }}
          onPointerUp={() => {
            const a = apunte.current;
            apunte.current = null;
            if (!a || !quietas.current) return;
            const dx = a.desde.x - a.hasta.x;
            const dy = a.desde.y - a.hasta.y;
            const largo = Math.hypot(dx, dy);
            if (largo < 12) return; // un toque sin tirar no gasta el tiro
            const fuerza = Math.min(1, largo / 170) * FUERZA_MAX;
            const blanca = bolas.current[0];
            blanca.vx = (dx / largo) * fuerza;
            blanca.vy = (dy / largo) * fuerza;
            quietas.current = false;
            estado.current.tiros -= 1;
            setTiros(estado.current.tiros);
            beep(180, 60, "triangle", 0.15);
          }}
          onPointerCancel={() => {
            apunte.current = null;
          }}
        />
      )}
    </Shell>
  );
}

function dibujar(ctx: CanvasRenderingContext2D, bs: Bola[], apunte: { desde: { x: number; y: number }; hasta: { x: number; y: number } } | null) {
  ctx.fillStyle = "#4a2c1a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1e5b3f";
  ctx.fillRect(BANDA - 6, BANDA - 6, W - (BANDA - 6) * 2, H - (BANDA - 6) * 2);
  // Una luz cálida arriba de la mesa, como en la casa.
  const luz = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H * 0.6);
  luz.addColorStop(0, "rgba(255,230,170,0.10)");
  luz.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b0b0b";
  for (const p of TRONERAS) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, TRONERA, 0, Math.PI * 2);
    ctx.fill();
  }

  const blanca = bs[0];
  if (apunte && !blanca.adentro) {
    const dx = apunte.desde.x - apunte.hasta.x;
    const dy = apunte.desde.y - apunte.hasta.y;
    const largo = Math.hypot(dx, dy);
    if (largo > 4) {
      const f = Math.min(1, largo / 170);
      const ux = dx / largo;
      const uy = dy / largo;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(255,244,224,${0.35 + f * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(blanca.x, blanca.y);
      ctx.lineTo(blanca.x + ux * (60 + f * 220), blanca.y + uy * (60 + f * 220));
      ctx.stroke();
      ctx.setLineDash([]);
      // El taco, del otro lado.
      ctx.strokeStyle = "#c9a96e";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(blanca.x - ux * (R + 6 + f * 26), blanca.y - uy * (R + 6 + f * 26));
      ctx.lineTo(blanca.x - ux * (R + 150 + f * 26), blanca.y - uy * (R + 150 + f * 26));
      ctx.stroke();
    }
  }

  for (const b of bs) {
    if (b.adentro) continue;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(b.x + 2, b.y + 3, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
