"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";
import { emoji, prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";

const W = 360;
const H = 600;
const GRAVEDAD = 900;
const VIDAS = 3;
const FRUTAS = ["🍋", "🍊", "🍓", "🍋", "🍊", "🥝", "🍍", "🍉"];

type Cosa = { x: number; y: number; vx: number; vy: number; e: string; r: number; botella: boolean; giro: number; vg: number };
type Pedazo = { x: number; y: number; vx: number; vy: number; e: string; vida: number; lado: -1 | 1 };
type Props = { onDone: (frutas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Distancia de un punto a un segmento: el corte es la línea entre dos lecturas del dedo, no solo el punto. */
function distSegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Cortá la fruta: saltan limones, naranjas, frutillas; se cortan deslizando el dedo. Si una cae
 * entera, perdés una vida. Las botellas no se tocan: cortar una termina el juego.
 */
export function Fruta({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [cortadas, setCortadas] = useState(0);
  const [vidas, setVidas] = useState(VIDAS);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dedo = useRef<{ x: number; y: number; t: number }[]>([]);
  const apretado = useRef(false);
  const reported = useRef(false);
  const total = useRef(0);

  function start() {
    keepAwake();
    reported.current = false;
    total.current = 0;
    setCortadas(0);
    setVidas(VIDAS);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const ctx = prepararLienzo(canvas.current, W, H);
    if (!ctx) return;
    const cosas: Cosa[] = [];
    const pedazos: Pedazo[] = [];
    let vidasLocal = VIDAS;
    let proxima = performance.now() + 500;
    const arranque = performance.now();
    let termino = 0;
    let raf = 0;
    let antes = performance.now();

    const lanzar = (t: number) => {
      const segs = (t - arranque) / 1000;
      const cuantas = 1 + (Math.random() < Math.min(0.6, segs / 60) ? 1 : 0) + (Math.random() < Math.min(0.3, segs / 120) ? 1 : 0);
      for (let k = 0; k < cuantas; k++) {
        const botella = Math.random() < Math.min(0.2, 0.08 + segs / 400);
        const x = 50 + Math.random() * (W - 100);
        cosas.push({
          x,
          y: H + 30,
          vx: (W / 2 - x) * (0.4 + Math.random() * 0.5),
          vy: -(760 + Math.random() * 200),
          e: botella ? "🍾" : FRUTAS[Math.floor(Math.random() * FRUTAS.length)],
          r: botella ? 22 : 26,
          botella,
          giro: 0,
          vg: (Math.random() - 0.5) * 6,
        });
      }
      proxima = t + Math.max(480, 1150 - segs * 12) + Math.random() * 300;
    };

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      if (!termino && t >= proxima) lanzar(t);

      // El corte: los últimos tramos que hizo el dedo. Tienen que ser recientes y largos: dejar el
      // dedo quieto y esperar a que la fruta pase por abajo no es cortar.
      const d = dedo.current;
      const tramos: [{ x: number; y: number }, { x: number; y: number }][] = [];
      for (let k = Math.max(1, d.length - 4); k < d.length; k++) {
        if (t - d[k].t < 90 && Math.hypot(d[k].x - d[k - 1].x, d[k].y - d[k - 1].y) > 4) tramos.push([d[k - 1], d[k]]);
      }
      for (const [a, b] of !termino && apretado.current ? tramos : []) {
        for (let i = cosas.length - 1; i >= 0 && !termino; i--) {
          const c = cosas[i];
          if (distSegmento(c.x, c.y, a.x, a.y, b.x, b.y) > c.r) continue;
          cosas.splice(i, 1);
          if (c.botella) {
            buzz();
            termino = t;
            setTimeout(() => setPhase("end"), 700);
            break;
          }
          total.current += 1;
          setCortadas(total.current);
          beep(700 + Math.random() * 300, 70, "triangle", 0.1);
          tap(8);
          const nx = b.y - a.y;
          const ny = -(b.x - a.x);
          const n = Math.hypot(nx, ny) || 1;
          for (const lado of [-1, 1] as const) {
            pedazos.push({ x: c.x, y: c.y, vx: c.vx * 0.5 + (nx / n) * 140 * lado, vy: c.vy * 0.4 + (ny / n) * 140 * lado, e: c.e, vida: 1, lado });
          }
        }
      }

      for (let i = cosas.length - 1; i >= 0; i--) {
        const c = cosas[i];
        c.vy += GRAVEDAD * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.giro += c.vg * dt;
        if (c.y > H + 60 && c.vy > 0) {
          cosas.splice(i, 1);
          if (!c.botella && !termino) {
            vidasLocal -= 1;
            setVidas(vidasLocal);
            beep(160, 220, "sawtooth", 0.08);
            if (vidasLocal <= 0) {
              termino = t;
              setTimeout(() => setPhase("end"), 500);
            }
          }
        }
      }
      for (let i = pedazos.length - 1; i >= 0; i--) {
        const p = pedazos[i];
        p.vy += GRAVEDAD * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vida -= dt * 1.4;
        if (p.vida <= 0) pedazos.splice(i, 1);
      }

      // La tabla de picar
      ctx.fillStyle = "#3b2618";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 2;
      for (let y = 14; y < H; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(W * 0.3, y + 6, W * 0.7, y - 6, W, y + 2);
        ctx.stroke();
      }
      for (const c of cosas) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.giro);
        emoji(ctx, c.e, 0, 0, c.r * 2);
        ctx.restore();
      }
      for (const p of pedazos) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        // Cada mitad muestra solo su lado de la fruta.
        ctx.rect(p.lado < 0 ? -30 : 0, -30, 30, 60);
        ctx.clip();
        emoji(ctx, p.e, 0, 0, 52);
        ctx.restore();
      }
      // La estela del dedo
      const ahora = t;
      const estela = dedo.current.filter((q) => ahora - q.t < 140);
      if (estela.length >= 2) {
        ctx.strokeStyle = "rgba(255,244,224,0.85)";
        ctx.lineCap = "round";
        for (let i = 1; i < estela.length; i++) {
          ctx.lineWidth = 2 + (i / estela.length) * 5;
          ctx.beginPath();
          ctx.moveTo(estela[i - 1].x, estela[i - 1].y);
          ctx.lineTo(estela[i].x, estela[i].y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(cortadas);
    }
  }, [phase, cortadas, onDone]);

  function leer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canvas.current) return;
    const p = puntoEnLienzo(e, canvas.current, W, H);
    dedo.current = [...dedo.current.slice(-10), { ...p, t: performance.now() }];
  }

  if (phase === "end") {
    return (
      <Shell title="Cortá la fruta" onBack={onBack}>
        <Fin nueva={nueva} game="fruta" value={cortadas} label={`${cortadas} ${cortadas === 1 ? "fruta" : "frutas"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Cuchillo de la casa." />
      </Shell>
    );
  }

  return (
    <Shell
      title="Cortá la fruta"
      onBack={onBack}
      right={
        phase === "play" ? (
          <>
            {cortadas} · {"●".repeat(vidas)}
            {"○".repeat(VIDAS - vidas)}
          </>
        ) : null
      }
    >
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍋
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Saltan limones, naranjas y frutillas: cortalas deslizando el dedo. Si una cae entera, perdés una vida. Las botellas no se tocan.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Afilar el cuchillo
          </button>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="jg-lienzo mt-3"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="Tabla de picar"
          onPointerDown={(e) => {
            capturar(e);
            apretado.current = true;
            dedo.current = [];
            leer(e);
          }}
          onPointerMove={(e) => apretado.current && leer(e)}
          onPointerUp={() => {
            apretado.current = false;
          }}
          onPointerCancel={() => {
            apretado.current = false;
          }}
        />
      )}
    </Shell>
  );
}
