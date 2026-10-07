"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo } from "./lienzo";

const W = 360;
const H = 540;
const PALETA_Y = H - 46;
const PALETA_ALTO = 12;
const RADIO = 8;
const VIDAS = 3;

type Props = { onDone: (golpes: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * Ping pong, como en la mesa de la casa: la paleta abajo sigue al dedo y la pelota rebota en la
 * mesa. Cada devolución la acelera un poco y la paleta se achica de a poco. Tres errores y afuera.
 *
 * Dónde le pega a la paleta decide para dónde sale: en el centro, derecho; en la punta, cruzada.
 * Es lo que hace que sea un juego de puntería y no solo de reflejos.
 */
export function PingPong({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [golpes, setGolpes] = useState(0);
  const [vidas, setVidas] = useState(VIDAS);
  const canvas = useRef<HTMLCanvasElement>(null);
  const paletaX = useRef(W / 2);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    paletaX.current = W / 2;
    setGolpes(0);
    setVidas(VIDAS);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    if (!ctx) return;

    let hits = 0;
    let lives = VIDAS;
    let pausaHasta = performance.now() + 700;
    const bola = { x: W / 2, y: H * 0.35, vx: 0, vy: 0 };
    const saque = () => {
      bola.x = W / 2;
      bola.y = H * 0.3;
      const ang = (Math.random() * 0.8 - 0.4) * Math.PI * 0.5;
      // Rápido de entrada: a menos de esto, el primer golpe tarda una eternidad en llegar.
      const v = 460;
      bola.vx = Math.sin(ang) * v;
      bola.vy = Math.cos(ang) * v;
    };
    saque();

    let raf = 0;
    let antes = performance.now();
    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const ancho = Math.max(46, 92 - hits * 1.2);

      if (t >= pausaHasta) {
        const yAntes = bola.y;
        bola.x += bola.vx * dt;
        bola.y += bola.vy * dt;
        if (bola.x < RADIO) {
          bola.x = RADIO;
          bola.vx = Math.abs(bola.vx);
          beep(520, 40, "square", 0.05);
        } else if (bola.x > W - RADIO) {
          bola.x = W - RADIO;
          bola.vx = -Math.abs(bola.vx);
          beep(520, 40, "square", 0.05);
        }
        if (bola.y < RADIO + 6) {
          bola.y = RADIO + 6;
          bola.vy = Math.abs(bola.vy);
          beep(440, 40, "square", 0.05);
        }
        // La paleta: pega si la pelota viene bajando y en este cuadro cruzó su borde de arriba. Se mira
        // el cruce y no solo dónde quedó: rápida, la pelota avanza en un cuadro más de lo que mide la paleta.
        const izq = paletaX.current - ancho / 2;
        const cruzo = yAntes + RADIO <= PALETA_Y + PALETA_ALTO && bola.y + RADIO >= PALETA_Y;
        if (bola.vy > 0 && cruzo && bola.x >= izq - RADIO && bola.x <= izq + ancho + RADIO) {
          const offset = Math.max(-1, Math.min(1, (bola.x - paletaX.current) / (ancho / 2)));
          const v = Math.min(900, Math.hypot(bola.vx, bola.vy) * 1.065);
          const ang = offset * 1.05; // hasta unos 60 grados
          bola.vx = Math.sin(ang) * v;
          bola.vy = -Math.abs(Math.cos(ang) * v);
          bola.y = PALETA_Y - RADIO;
          hits += 1;
          setGolpes(hits);
          beep(660 + Math.min(hits, 30) * 12, 60, "square", 0.08);
          tap(8);
        }
        if (bola.y > H + RADIO) {
          lives -= 1;
          setVidas(lives);
          buzz();
          if (lives <= 0) {
            setPhase("end");
            return;
          }
          saque();
          pausaHasta = t + 800;
        }
      }

      // La mesa
      ctx.fillStyle = "#123a5c";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2, 4);
      ctx.lineTo(W / 2, H - 4);
      ctx.stroke();
      // La red
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(0, H / 2 - 2, W, 4);
      // La paleta
      ctx.fillStyle = "#c9a96e";
      ctx.beginPath();
      ctx.roundRect(paletaX.current - ancho / 2, PALETA_Y, ancho, PALETA_ALTO, 6);
      ctx.fill();
      // La pelota, con su sombra
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(bola.x + 3, bola.y + 5, RADIO, RADIO * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4e0";
      ctx.beginPath();
      ctx.arc(bola.x, bola.y, RADIO, 0, Math.PI * 2);
      ctx.fill();
      if (t < pausaHasta) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "600 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("¡Saque!", W / 2, H * 0.62);
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(golpes);
    }
  }, [phase, golpes, onDone]);

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canvas.current) return;
    const { x } = puntoEnLienzo(e, canvas.current, W, H);
    paletaX.current = Math.max(30, Math.min(W - 30, x));
  }

  if (phase === "end") {
    return (
      <Shell title="Ping pong" onBack={onBack}>
        <Fin nueva={nueva} game="pingpong" value={golpes} label={`${golpes} ${golpes === 1 ? "golpe" : "golpes"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Mano firme." />
      </Shell>
    );
  }

  return (
    <Shell
      title="Ping pong"
      onBack={onBack}
      right={
        phase === "play" ? (
          <>
            {golpes} · {"●".repeat(vidas)}
            {"○".repeat(VIDAS - vidas)}
          </>
        ) : null
      }
    >
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🏓
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Mové el dedo para llevar la paleta y devolvé la pelota. Donde le pegás decide para dónde sale. Cada golpe la acelera. Tres errores y
            afuera.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Sacar
          </button>
        </div>
      ) : (
        <canvas ref={canvas} className="jg-lienzo mt-3" style={{ aspectRatio: `${W} / ${H}` }} onPointerDown={mover} onPointerMove={mover} aria-label="Mesa de ping pong" />
      )}
    </Shell>
  );
}
