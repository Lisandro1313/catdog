"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";
import { capturar, prepararLienzo, puntoEnLienzo } from "./lienzo";
import {
  correrTemblor,
  dibujarFlotantes,
  dibujarParticulas,
  estiloLienzo,
  flotar,
  fondoFijo,
  limitar,
  moverParticulas,
  pocoMovimiento,
  soltar,
  temblar,
  type Flotante,
  type Particula,
  type Temblor,
} from "./efectos";

const W = 360;
const H = 600;
/** La mesa, vista desde arriba. La red cruza por el medio. */
const MESA = { x: 14, y: 74, w: W - 28, h: 436 };
const RED = MESA.y + MESA.h / 2;
/** Las barandas de los costados: ahí rebota la pelota. */
const BARANDA = 6;
const MIN_X = MESA.x + BARANDA;
const MAX_X = MESA.x + MESA.w - BARANDA;
/** Dónde le pega cada uno: el gato arriba, vos abajo (un poco detrás de la mesa, como de verdad). */
const RIVAL_Y = 46;
const PALETA_Y = H - 62;
const RADIO = 7;
const VIDAS = 3;
/** El pique: a qué parte del vuelo la pelota toca la mesa del que recibe. */
const PIQUE = 0.64;

/** Velocidad de la pelota según los golpes: sube parejo al principio y se va aplanando. */
const velocidad = (golpes: number) => 330 + 470 * (1 - Math.exp(-golpes / 32));
/** El ancho de la paleta: se achica de a poco, nunca de golpe. */
const anchoPaleta = (golpes: number) => 60 + 34 * Math.exp(-golpes / 30);

type Props = { onDone: (golpes: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * Ping pong contra el gato de la casa: la paleta abajo sigue al dedo y la pelota pica en la mesa.
 * Dónde le pega a la paleta decide para dónde sale (centro derecho, punta cruzada) y si la movés al
 * pegarle, le das efecto y la pelota dobla. El gato devuelve todo, pero cada vez más rápido y más
 * abierto. Tres errores y afuera.
 */
export function PingPong({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [golpes, setGolpes] = useState(0);
  const [vidas, setVidas] = useState(VIDAS);
  const canvas = useRef<HTMLCanvasElement>(null);
  /** Dónde quiere ir la paleta (el dedo). La paleta lo sigue suave, sin saltos. */
  const objetivo = useRef(W / 2);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    objetivo.current = W / 2;
    setGolpes(0);
    setVidas(VIDAS);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    if (!ctx) return;
    const fondo = fondoFijo(cv, W, H, pintarMesa);
    const quieto = pocoMovimiento();
    const timers: ReturnType<typeof setTimeout>[] = [];

    let hits = 0;
    let lives = VIDAS;
    let fin = 0;
    let pausaHasta = performance.now() + 900;
    let sacar = true;
    let haciaMi = true;
    let pico = 1;
    const bola = { x: W / 2, y: RIVAL_Y + 14, vx: 0, vy: 0, efecto: 0, giro: 0, z: 16 };
    const vuelo = { y0: RIVAL_Y, y1: PALETA_Y, pico: false };
    const rival = { x: W / 2, golpe: 0 };
    const paleta = { x: W / 2, v: 0, golpe: 0 };
    const estela: { x: number; y: number }[] = [];
    const part: Particula[] = [];
    const flot: Flotante[] = [];
    const temblor: Temblor = { f: 0 };

    /** El gato le pega: apunta a algún lado de tu mitad, cada vez más abierto. */
    const tiroDelGato = (saque: boolean) => {
      const abierto = 40 + Math.min(105, hits * 2.6);
      const tx = limitar(W / 2 + (Math.random() * 2 - 1) * abierto, MIN_X + 24, MAX_X - 24);
      const v = velocidad(hits) * (saque ? 0.85 : 1);
      const dx = tx - bola.x;
      const dy = PALETA_Y - bola.y;
      const d = Math.hypot(dx, dy);
      bola.vx = (dx / d) * v;
      bola.vy = (dy / d) * v;
      // Más adelante el gato también le pone efecto, de a poco.
      const conEfecto = !saque && hits > 12 && Math.random() < Math.min(0.45, (hits - 12) / 40);
      bola.efecto = conEfecto ? (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 130) : 0;
      vuelo.y0 = bola.y;
      vuelo.y1 = PALETA_Y;
      vuelo.pico = false;
      haciaMi = true;
      rival.golpe = 1;
      beep(1150, 26, "square", 0.04);
      beep(480, 50, "triangle", 0.07);
    };

    let raf = 0;
    let antes = performance.now();
    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const ancho = anchoPaleta(hits);

      // La paleta sigue al dedo, suave pero sin demora; su velocidad es la que da el efecto.
      const xAntes = paleta.x;
      const objetivoX = limitar(objetivo.current, MIN_X + ancho / 2 - 10, MAX_X - ancho / 2 + 10);
      paleta.x += (objetivoX - paleta.x) * (1 - Math.exp(-dt * 30));
      if (dt > 0) paleta.v = paleta.v * 0.6 + ((paleta.x - xAntes) / dt) * 0.4;
      paleta.golpe = Math.max(0, paleta.golpe - dt * 6);
      rival.golpe = Math.max(0, rival.golpe - dt * 6);

      // El gato va a buscar la pelota cuando viene para él; si no, vuelve al medio.
      const rivalVa = haciaMi ? W / 2 + (bola.x - W / 2) * 0.3 : bola.x;
      const maxRival = (640 + hits * 5) * dt;
      rival.x += limitar(rivalVa - rival.x, -maxRival, maxRival);

      if (sacar) {
        bola.x = rival.x + 10;
        bola.y = RIVAL_Y + 16;
        bola.z = 16;
        if (t >= pausaHasta && !fin) {
          sacar = false;
          tiroDelGato(true);
        }
      } else if (!fin || bola.y < H + 40) {
        const yAntes = bola.y;
        bola.vx += bola.efecto * dt;
        bola.efecto *= Math.exp(-dt * 1.1);
        bola.giro += bola.efecto * dt * 0.08 + dt * 4;
        bola.x += bola.vx * dt;
        bola.y += bola.vy * dt;
        if (bola.x < MIN_X + RADIO || bola.x > MAX_X - RADIO) {
          bola.x = limitar(bola.x, MIN_X + RADIO, MAX_X - RADIO);
          bola.vx = -bola.vx;
          bola.efecto *= -0.5;
          beep(700, 30, "square", 0.04);
          soltar(part, bola.x, bola.y, 5, { color: "#fff4e0", vel: 90, r: 1.6, dura: 0.25 });
        }

        // Altura de la pelota: sale de la paleta, pica una vez en la mesa del otro y sube hasta la paleta.
        const p = limitar((bola.y - vuelo.y0) / (vuelo.y1 - vuelo.y0), 0, 1.4);
        bola.z = p < PIQUE ? 16 * (1 - p / PIQUE) + 34 * Math.sin((Math.PI * p) / PIQUE) : 16 * Math.sin((Math.PI / 2) * Math.min(1.4, (p - PIQUE) / (1 - PIQUE)));
        if (!vuelo.pico && p >= PIQUE) {
          vuelo.pico = true;
          beep(haciaMi ? 900 : 760, 18, "sine", 0.07);
          soltar(part, bola.x, bola.y, 4, { color: "rgba(255,255,255,0.7)", vel: 40, r: 1.4, dura: 0.3 });
        }

        if (haciaMi && !fin) {
          // Tu golpe: se mira si en este cuadro cruzó la línea de la paleta, así a toda velocidad no la atraviesa.
          const cruzo = yAntes <= PALETA_Y && bola.y >= PALETA_Y;
          if (cruzo && Math.abs(bola.x - paleta.x) <= ancho / 2 + RADIO + 3) {
            const offset = limitar((bola.x - paleta.x) / (ancho / 2), -1, 1);
            const ang = offset * 0.95;
            const v = velocidad(hits + 1);
            bola.vx = Math.sin(ang) * v;
            bola.vy = -Math.cos(ang) * v;
            bola.y = PALETA_Y - 1;
            bola.efecto = limitar(paleta.v * 0.5, -330, 330);
            vuelo.y0 = PALETA_Y;
            vuelo.y1 = RIVAL_Y;
            vuelo.pico = false;
            haciaMi = false;
            hits += 1;
            pico = 1.45;
            paleta.golpe = 1;
            setGolpes(hits);
            const centro = Math.abs(offset) < 0.18;
            beep(centro ? 1500 : 1300, 24, "square", 0.05);
            beep(560 + Math.min(hits, 40) * 8, 60, "triangle", 0.11);
            tap(centro ? 14 : 8);
            soltar(part, bola.x, PALETA_Y - 4, centro ? 14 : 8, { color: ["#fff4e0", "#ffd38a"], vel: 220, r: 2, dura: 0.35, dir: -Math.PI / 2, abanico: 2.2 });
            if (Math.abs(bola.efecto) > 160) flotar(flot, bola.x, PALETA_Y - 34, "¡Con efecto!", "#9fd6ff", 15, 0.7);
            if (hits % 10 === 0) {
              flotar(flot, W / 2, RED + 70, `¡${hits}!`, "#ffd36e", 40, 1.1);
              soltar(part, W / 2, RED + 70, 26, { color: ["#ffd36e", "#fff4e0", "#ff9d5c"], vel: 260, r: 2.6, dura: 0.8, g: 260 });
              [0, 90, 180].forEach((d, i) => timers.push(setTimeout(() => beep(660 * [1, 1.25, 1.5][i], 110, "triangle", 0.1), d)));
            }
          }
        } else if (!haciaMi && bola.y <= RIVAL_Y + 8) {
          // El gato devuelve: siempre llega, la gracia es que cada vez cuesta más devolverle.
          rival.x += (bola.x - rival.x) * 0.85;
          bola.y = RIVAL_Y + 8;
          tiroDelGato(false);
        }

        if (haciaMi && !fin && bola.y > H + 16) {
          lives -= 1;
          setVidas(lives);
          buzz();
          temblar(temblor, 9);
          flotar(flot, limitar(bola.x, 60, W - 60), PALETA_Y - 40, lives > 0 ? "¡Se te pasó!" : "¡Afuera!", "#ff7a63", 22);
          if (lives <= 0) {
            fin = t;
            timers.push(setTimeout(() => setPhase("end"), 1000));
          } else {
            sacar = true;
            pausaHasta = t + 1000;
            bola.efecto = 0;
          }
        }
      }

      const vis = { x: bola.x, y: bola.y - bola.z * 0.55 };
      estela.push(vis);
      if (estela.length > 11) estela.shift();
      moverParticulas(part, dt);
      pico += (1 - pico) * (1 - Math.exp(-dt * 10));

      // ---- Dibujo ----
      const sac = correrTemblor(temblor, dt, quieto);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      ctx.drawImage(fondo, 0, 0, W, H);

      // El marcador, grande y suave en la mitad del gato.
      ctx.save();
      ctx.translate(W / 2, MESA.y + MESA.h * 0.24);
      ctx.scale(pico, pico);
      ctx.globalAlpha = 0.2 + (pico - 1) * 0.8;
      ctx.fillStyle = "#fff4e0";
      ctx.font = "800 64px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(hits), 0, 0);
      ctx.restore();

      dibujarPaleta(ctx, rival.x, RIVAL_Y, 74, "#242424", false, rival.golpe);

      // Sombra en la mesa, estela y pelota (más grande cuanto más alta).
      const sombra = Math.max(0.35, 1 - bola.z / 70);
      ctx.fillStyle = `rgba(0,0,0,${0.28 * sombra})`;
      ctx.beginPath();
      ctx.ellipse(bola.x + bola.z * 0.15, bola.y + 2, RADIO * sombra, RADIO * 0.7 * sombra, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!sacar) {
        for (let i = 0; i < estela.length - 1; i++) {
          const k = (i + 1) / estela.length;
          ctx.globalAlpha = k * 0.35;
          ctx.fillStyle = Math.abs(bola.efecto) > 120 ? "#9fd6ff" : "#ffe3b0";
          ctx.beginPath();
          ctx.arc(estela[i].x, estela[i].y, RADIO * k * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      const r = RADIO * (1 + bola.z / 110);
      const g = ctx.createRadialGradient(vis.x - r * 0.35, vis.y - r * 0.4, r * 0.15, vis.x, vis.y, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#f0b766");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(vis.x, vis.y, r, 0, Math.PI * 2);
      ctx.fill();
      // La costura gira: así se ve el efecto.
      ctx.strokeStyle = "rgba(160,90,30,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(vis.x, vis.y, r * 0.85, r * 0.35, bola.giro, 0, Math.PI * 2);
      ctx.stroke();

      dibujarPaleta(ctx, paleta.x, PALETA_Y, ancho, "#c7322b", true, paleta.golpe);

      dibujarParticulas(ctx, part);
      dibujarFlotantes(ctx, flot, dt, W);

      if (sacar && !fin) {
        const falta = Math.max(0, pausaHasta - t);
        ctx.globalAlpha = Math.min(1, falta / 250);
        ctx.fillStyle = "#fff4e0";
        ctx.font = "700 18px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hits === 0 && lives === VIDAS ? "Saca el gato" : "¡Saque!", W / 2, RED + 56);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(golpes);
    }
  }, [phase, golpes, onDone]);

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canvas.current) return;
    objetivo.current = puntoEnLienzo(e, canvas.current, W, H).x;
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
            Jugás contra el gato de la casa. Deslizá el dedo para mover la paleta: si le pegás con la punta sale cruzada, y si la movés al pegarle,
            dobla. Cada golpe va más rápido. Tres errores y afuera.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            A la mesa
          </button>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="jg-lienzo mt-3"
          style={estiloLienzo(W, H)}
          onPointerDown={(e) => {
            capturar(e);
            mover(e);
          }}
          onPointerMove={mover}
          aria-label="Mesa de ping pong"
        />
      )}
    </Shell>
  );
}

/** Una paleta vista desde arriba: la goma, el canto de madera y el mango del lado del jugador. */
function dibujarPaleta(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, goma: string, mia: boolean, golpe: number) {
  const adelante = (mia ? -1 : 1) * golpe * 5;
  const alto = 15;
  const top = y - alto / 2 + adelante;
  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.roundRect(x - ancho / 2 + 3, top + 5, ancho, alto, alto / 2);
  ctx.fill();
  // El mango
  const mx = x - 5;
  const my = mia ? top + alto - 2 : top - 16;
  const m = ctx.createLinearGradient(mx, 0, mx + 10, 0);
  m.addColorStop(0, "#9a6a3a");
  m.addColorStop(0.5, "#d6a46a");
  m.addColorStop(1, "#8a5a2e");
  ctx.fillStyle = m;
  ctx.beginPath();
  ctx.roundRect(mx, my, 10, 18, 3);
  ctx.fill();
  // El canto
  ctx.fillStyle = "#d9a967";
  ctx.beginPath();
  ctx.roundRect(x - ancho / 2 - 1.5, top - 1.5, ancho + 3, alto + 3, (alto + 3) / 2);
  ctx.fill();
  // La goma, con su brillo
  const g = ctx.createLinearGradient(0, top, 0, top + alto);
  g.addColorStop(0, mia ? "#ef5a4c" : "#4a4a4a");
  g.addColorStop(1, goma);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - ancho / 2, top, ancho, alto, alto / 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.14 + golpe * 0.4})`;
  ctx.beginPath();
  ctx.roundRect(x - ancho / 2 + 6, top + 2.5, ancho - 12, 3.5, 2);
  ctx.fill();
}

/** La mesa, pintada una sola vez: el piso del bar, la mesa azul con sus líneas, las barandas y la red. */
function pintarMesa(ctx: CanvasRenderingContext2D) {
  const piso = ctx.createLinearGradient(0, 0, 0, H);
  piso.addColorStop(0, "#1b130e");
  piso.addColorStop(1, "#2a1d14");
  ctx.fillStyle = piso;
  ctx.fillRect(0, 0, W, H);
  // Baldosas del piso, apenas.
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Sombra de la mesa en el piso
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.roundRect(MESA.x + 4, MESA.y + 10, MESA.w, MESA.h, 6);
  ctx.fill();

  const mesa = ctx.createLinearGradient(0, MESA.y, 0, MESA.y + MESA.h);
  mesa.addColorStop(0, "#1f5d8c");
  mesa.addColorStop(0.5, "#1a527d");
  mesa.addColorStop(1, "#16476d");
  ctx.fillStyle = mesa;
  ctx.beginPath();
  ctx.roundRect(MESA.x, MESA.y, MESA.w, MESA.h, 4);
  ctx.fill();
  // La luz de la lámpara del bar
  const luz = ctx.createRadialGradient(W / 2, RED, 20, W / 2, RED, MESA.h * 0.7);
  luz.addColorStop(0, "rgba(255,240,205,0.16)");
  luz.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = luz;
  ctx.fillRect(MESA.x, MESA.y, MESA.w, MESA.h);

  // Líneas: el borde y la del medio (la de dobles).
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(MESA.x + BARANDA + 4, MESA.y + 4, MESA.w - (BARANDA + 4) * 2, MESA.h - 8);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.moveTo(W / 2, MESA.y + 4);
  ctx.lineTo(W / 2, MESA.y + MESA.h - 4);
  ctx.stroke();

  // Las barandas de madera de los costados.
  for (const bx of [MESA.x, MESA.x + MESA.w - BARANDA]) {
    const b = ctx.createLinearGradient(bx, 0, bx + BARANDA, 0);
    b.addColorStop(0, "#5b3620");
    b.addColorStop(0.5, "#9a6a3a");
    b.addColorStop(1, "#5b3620");
    ctx.fillStyle = b;
    ctx.fillRect(bx, MESA.y, BARANDA, MESA.h);
  }

  // La red: sombra, malla, faja blanca y los postes.
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(MESA.x, RED + 4, MESA.w, 8);
  ctx.fillStyle = "rgba(20,20,20,0.45)";
  ctx.fillRect(MESA.x - 4, RED - 6, MESA.w + 8, 9);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 0.8;
  for (let x = MESA.x - 2; x < MESA.x + MESA.w + 4; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, RED - 6);
    ctx.lineTo(x, RED + 3);
    ctx.stroke();
  }
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(MESA.x - 4, RED - 8, MESA.w + 8, 3);
  ctx.fillStyle = "#2b2b2b";
  for (const px of [MESA.x - 9, MESA.x + MESA.w + 2]) {
    ctx.beginPath();
    ctx.roundRect(px, RED - 10, 7, 14, 2);
    ctx.fill();
  }

  // El nombre de la casa, gastado en la madera de abajo.
  ctx.fillStyle = "rgba(255,244,224,0.08)";
  ctx.font = "800 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CATDOG", W / 2, MESA.y + MESA.h * 0.76);
}
