"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { puntosDelVaso } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";
import { emoji, prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";

const W = 360;
const H = 600;
const SALIDA = H - 80;
const FIN_BARRA = 52;
const LARGO = SALIDA - FIN_BARRA;
/** Cuánto frena la barra, en unidades por segundo al cuadrado. */
const ROCE = 520;
const TIROS = 5;

type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Dónde queda el posavasos en cada tiro: cada vez en otro lado, cada vez un poco más lejos. */
const azarBlanco = (tiro: number) => Math.min(0.92, 0.5 + tiro * 0.07 + Math.random() * 0.16);
const reloj = () => performance.now();

/**
 * Deslizá el vaso: como en la barra de un bar de película. Se empuja con el dedo hacia arriba y el
 * vaso sigue solo hasta que frena. Tiene que quedar arriba del posavasos; si se pasa del final de
 * la barra, se cae. Cinco tiros, el posavasos cambia de lugar en cada uno.
 */
export function Vaso({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [puntos, setPuntos] = useState<number[]>([]);
  const [cartel, setCartel] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vaso = useRef({ y: SALIDA, v: 0, andando: false, cayendo: 0 });
  const blanco = useRef(0.6);
  const dedo = useRef<{ y: number; t: number }[]>([]);
  const reported = useRef(false);
  const tirosRef = useRef<number[]>([]);

  function start() {
    keepAwake();
    reported.current = false;
    tirosRef.current = [];
    setPuntos([]);
    setCartel(null);
    vaso.current = { y: SALIDA, v: 0, andando: false, cayendo: 0 };
    blanco.current = azarBlanco(0);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const ctx = prepararLienzo(canvas.current, W, H);
    if (!ctx) return;
    let raf = 0;
    let antes = performance.now();

    const terminarTiro = (pts: number, texto: string) => {
      tirosRef.current = [...tirosRef.current, pts];
      setPuntos(tirosRef.current);
      setCartel(texto);
      setTimeout(() => {
        setCartel(null);
        if (tirosRef.current.length >= TIROS) {
          setPhase("end");
          return;
        }
        vaso.current = { y: SALIDA, v: 0, andando: false, cayendo: 0 };
        blanco.current = azarBlanco(tirosRef.current.length);
      }, 1000);
    };

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const g = vaso.current;
      if (g.andando) {
        g.y -= g.v * dt;
        g.v = Math.max(0, g.v - ROCE * dt);
        if (g.y < FIN_BARRA) {
          g.andando = false;
          g.cayendo = 0.001;
          buzz();
          terminarTiro(0, "¡Se cayó!");
        } else if (g.v === 0) {
          g.andando = false;
          const pts = puntosDelVaso((SALIDA - g.y) / LARGO, blanco.current);
          if (pts >= 95) {
            beep(880, 100);
            setTimeout(() => beep(1320, 180), 90);
            tap(20);
          } else if (pts > 0) beep(520 + pts * 3, 120, "triangle");
          else beep(200, 200, "triangle");
          terminarTiro(pts, pts >= 95 ? `¡Justo! ${pts}` : pts > 0 ? `${pts}` : "Lejos");
        }
      }
      if (g.cayendo > 0 && g.cayendo < 1) g.cayendo = Math.min(1, g.cayendo + dt * 2.5);

      // La barra de madera
      ctx.fillStyle = "#24170f";
      ctx.fillRect(0, 0, W, H);
      const madera = ctx.createLinearGradient(70, 0, W - 70, 0);
      madera.addColorStop(0, "#5a3620");
      madera.addColorStop(0.5, "#7a4a2a");
      madera.addColorStop(1, "#5a3620");
      ctx.fillStyle = madera;
      ctx.fillRect(70, FIN_BARRA - 10, W - 140, SALIDA - FIN_BARRA + 60);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      for (let x = 90; x < W - 70; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, FIN_BARRA - 10);
        ctx.lineTo(x + 6, SALIDA + 50);
        ctx.stroke();
      }
      // El borde del final: de ahí para allá, se cae.
      ctx.fillStyle = "#c9a96e";
      ctx.fillRect(70, FIN_BARRA - 12, W - 140, 3);
      // El posavasos
      const by = SALIDA - blanco.current * LARGO;
      ctx.fillStyle = "rgba(201,169,110,0.25)";
      ctx.beginPath();
      ctx.arc(W / 2, by, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c9a96e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, by, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, by, 10, 0, Math.PI * 2);
      ctx.stroke();
      // El vaso
      ctx.save();
      ctx.globalAlpha = g.cayendo > 0 ? 1 - g.cayendo : 1;
      ctx.translate(W / 2, g.y - g.cayendo * 30);
      ctx.rotate(g.cayendo * 1.2);
      emoji(ctx, "🍺", 0, 0, 44);
      ctx.restore();
      if (!g.andando && g.cayendo === 0 && g.y === SALIDA) {
        ctx.fillStyle = "rgba(255,244,224,0.7)";
        ctx.font = "500 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Empujalo para arriba ↑", W / 2, SALIDA + 44);
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const total = puntos.reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(total);
    }
  }, [phase, total, onDone]);

  function soltar() {
    const g = vaso.current;
    const d = dedo.current;
    dedo.current = [];
    if (g.andando || g.cayendo > 0 || g.y !== SALIDA || d.length < 2) return;
    // La velocidad del empujón: lo que recorrió el dedo en el último instante, para arriba.
    const ahora = reloj();
    const recientes = d.filter((q) => ahora - q.t < 90);
    const desde = recientes[0] ?? d[d.length - 2];
    const hasta = d[d.length - 1];
    const dt = Math.max(0.016, (hasta.t - desde.t) / 1000);
    const v = Math.min(980, Math.max(0, ((desde.y - hasta.y) / dt) * 0.5));
    if (v < 60) return;
    g.v = v;
    g.andando = true;
    beep(140, 90, "sine", 0.1);
  }

  if (phase === "end") {
    return (
      <Shell title="Deslizá el vaso" onBack={onBack}>
        <Fin nueva={nueva} game="vaso" value={total} label={`${total} de 500`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Barra de película." />
      </Shell>
    );
  }

  return (
    <Shell title="Deslizá el vaso" onBack={onBack} right={phase === "play" ? <>{total} · {Math.min(puntos.length + 1, TIROS)}/{TIROS}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍺
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Empujá el vaso por la barra con el dedo, para arriba. Sigue solo hasta que frena: tiene que quedar arriba del posavasos. Si se pasa
            del final, se cae. Cinco tiros.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Servir el primero
          </button>
        </div>
      ) : (
        <div className="relative mt-3">
          <canvas
            ref={canvas}
            className="jg-lienzo"
            style={{ aspectRatio: `${W} / ${H}` }}
            aria-label="La barra"
            onPointerDown={(e) => {
              capturar(e);
              dedo.current = [{ y: puntoEnLienzo(e, e.currentTarget, W, H).y, t: reloj() }];
            }}
            onPointerMove={(e) => {
              if (dedo.current.length === 0) return;
              dedo.current = [...dedo.current.slice(-12), { y: puntoEnLienzo(e, e.currentTarget, W, H).y, t: reloj() }];
            }}
            onPointerUp={soltar}
            onPointerCancel={() => {
              dedo.current = [];
            }}
          />
          {cartel && <p className="jg-lienzo-cartel ap-display">{cartel}</p>}
        </div>
      )}
    </Shell>
  );
}
