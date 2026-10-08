"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";
import { Emoji } from "./Emoji";
import { cargarTexturas, dibujarParticulas, moverParticulas, soltar, type Particula, type Textura } from "./efectos";

const ESTRELLA: Textura[] = ["star_02", "star_03", "star_05"];

const W = 360;
const H = 640;
/** La madera de la baranda. El paño empieza donde termina. */
const BANDA = 24;
const R = 11;
const TIROS = 10;
const FUERZA_MAX = 1350;
/** Cuánto hay que tirar del dedo para el tiro a fondo. */
const TIRON_MAX = 190;
/** Frenado del paño: una bola rueda y frena parejo, no se queda patinando para siempre. */
const FRENO = 210;
const REBOTE_BANDA = 0.74;
const REBOTE_BOLA = 0.95;
/** En el saque chocan diez bolas a la vez: con un choque cada 20 ms alcanza para que suene a pool sin saturar. */
let ultimoChoque = 0;
function choque(s: "bola" | "banda", vol: number) {
  const ahora = performance.now();
  if (ahora - ultimoChoque < 20) return;
  ultimoChoque = ahora;
  sonar(s, vol, 0.9 + Math.random() * 0.25);
}
const COLORES = ["#e8c12f", "#2350b0", "#c8322a", "#5f3596", "#e2701f", "#23824f", "#7a1d2b"];
const CABECERA = { x: W / 2, y: H * 0.77 };

type Bola = { x: number; y: number; vx: number; vy: number; color: string; n: number; adentro: boolean; cayendo: number; blanca: boolean };
type Tronera = { x: number; y: number; boca: number; caza: number };
type Props = { onDone: (bolas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * Las troneras están un poco afuera del paño, como en una mesa de verdad: la bola entra por la boca
 * (ahí la banda no rebota) y cae cuando llega al agujero. Las del medio tienen la boca más chica:
 * de costado y pegado a la banda, la bola pasa de largo.
 */
const TRONERAS: Tronera[] = [
  { x: BANDA - 4, y: BANDA - 4, boca: 30, caza: 17 },
  { x: W - BANDA + 4, y: BANDA - 4, boca: 30, caza: 17 },
  { x: BANDA - 7, y: H / 2, boca: 21, caza: 16 },
  { x: W - BANDA + 7, y: H / 2, boca: 21, caza: 16 },
  { x: BANDA - 4, y: H - BANDA + 4, boca: 30, caza: 17 },
  { x: W - BANDA + 4, y: H - BANDA + 4, boca: 30, caza: 17 },
];

function armarMesa(): Bola[] {
  const bola = (x: number, y: number, n: number): Bola => ({ x, y, vx: 0, vy: 0, color: COLORES[n - 1], n, adentro: false, cayendo: 0, blanca: false });
  const bolas: Bola[] = [{ x: CABECERA.x, y: CABECERA.y, vx: 0, vy: 0, color: "#f4eedf", n: 0, adentro: false, cayendo: 0, blanca: true }];
  // Siete bolas en flor: una al medio y seis alrededor, tocándose. Abre bien con un buen tiro.
  const cx = W / 2;
  const cy = H * 0.27;
  const orden = [3, 6, 2, 7, 4, 5];
  bolas.push(bola(cx, cy, 1));
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    bolas.push(bola(cx + Math.cos(a) * (R * 2 + 0.4), cy + Math.sin(a) * (R * 2 + 0.4), orden[k]));
  }
  return bolas;
}

/** Hasta dónde llega la blanca en línea recta: la primera bola que toca, o la banda. */
function trazar(bs: Bola[], ux: number, uy: number): { t: number; bola: Bola | null } {
  const c = bs[0];
  let t = Infinity;
  let bola: Bola | null = null;
  for (const b of bs) {
    if (b.blanca || b.adentro) continue;
    const dx = b.x - c.x;
    const dy = b.y - c.y;
    const proy = dx * ux + dy * uy;
    if (proy <= 0) continue;
    const perp2 = dx * dx + dy * dy - proy * proy;
    if (perp2 > 4 * R * R) continue;
    const tb = proy - Math.sqrt(4 * R * R - perp2);
    if (tb < t) {
      t = tb;
      bola = b;
    }
  }
  const lim = (pos: number, u: number, min: number, max: number) => (u > 0 ? (max - pos) / u : u < 0 ? (min - pos) / u : Infinity);
  const tBanda = Math.min(lim(c.x, ux, BANDA + R, W - BANDA - R), lim(c.y, uy, BANDA + R, H - BANDA - R));
  return tBanda < t ? { t: tBanda, bola: null } : { t, bola };
}

/**
 * Embocá: la mesa de pool de la casa, en el celular. Se apoya el dedo en cualquier lado y se tira
 * para atrás, como una gomera. La guía muestra qué bola va a tocar la blanca y para dónde sale cada
 * una, como cuando uno se agacha a mirar el tiro. Diez tiros para meter las siete; meter la blanca
 * resta una.
 */
export function Pool({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["bola", "banda", "tronera", "golpe", "acierto"]);
    cargarTexturas([...ESTRELLA, "light_01"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [adentro, setAdentro] = useState(0);
  const [tiros, setTiros] = useState(TIROS);
  const [embocadas, setEmbocadas] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const bolas = useRef<Bola[]>([]);
  const apunte = useRef<{ desde: { x: number; y: number }; hasta: { x: number; y: number } } | null>(null);
  const quietas = useRef(true);
  const reported = useRef(false);
  const estado = useRef({ adentro: 0, tiros: TIROS, metioEnElTiro: 0, blancaAdentro: false });

  function start() {
    keepAwake();
    reported.current = false;
    bolas.current = armarMesa();
    estado.current = { adentro: 0, tiros: TIROS, metioEnElTiro: 0, blancaAdentro: false };
    quietas.current = true;
    setAdentro(0);
    setTiros(TIROS);
    setEmbocadas([]);
    setAviso("");
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const ctx = prepararLienzo(canvas.current, W, H);
    if (!ctx) return;
    let raf = 0;
    let antes = performance.now();
    /** Las estrellitas que saltan de la tronera cuando entra una bola. */
    const part: Particula[] = [];

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const bs = bolas.current;
      // Pasos chicos: a fuerza máxima una bola puede atravesar a otra en un paso grande.
      const SUB = 8;
      let moviendo = false;
      for (let s = 0; s < SUB; s++) {
        const h = dt / SUB;
        for (const b of bs) {
          if (b.adentro) continue;
          const v = Math.hypot(b.vx, b.vy);
          if (v === 0) continue;
          b.x += b.vx * h;
          b.y += b.vy * h;
          const nueva = Math.max(0, v - FRENO * h) * Math.exp(-0.25 * h);
          if (nueva < 5) {
            b.vx = 0;
            b.vy = 0;
          } else {
            b.vx *= nueva / v;
            b.vy *= nueva / v;
            moviendo = true;
          }

          const cae = TRONERAS.find((p) => Math.hypot(b.x - p.x, b.y - p.y) < p.caza);
          if (cae) {
            b.adentro = true;
            b.cayendo = 1;
            b.x = cae.x;
            b.y = cae.y;
            b.vx = 0;
            b.vy = 0;
            if (b.blanca) {
              estado.current.blancaAdentro = true;
              buzz();
            } else {
              estado.current.adentro += 1;
              estado.current.metioEnElTiro += 1;
              sonar("tronera", 0.65, 0.95 + Math.random() * 0.1);
              soltar(part, cae.x, cae.y, 10, { color: ["#ffd36e", "#fff4e0", "#e0c283"], vel: 170, r: 3, dura: 0.7, roce: 2.2, sprite: ESTRELLA, luz: true, giro: 5 });
              soltar(part, cae.x, cae.y, 1, { color: "#ffe7a8", vel: 0, r: 16, dura: 0.4, sprite: "light_01", luz: true });
              setTimeout(() => beep(495, 160, "triangle", 0.1), 160);
              tap(15);
              setAdentro(estado.current.adentro);
              const n = b.n;
              setEmbocadas((e) => [...e, n]);
            }
            continue;
          }

          const enLaBoca = TRONERAS.some((p) => Math.hypot(b.x - p.x, b.y - p.y) < p.boca);
          if (!enLaBoca) {
            const golpe = (vel: number) => vel > 120 && choque("banda", Math.min(0.55, 0.12 + vel / 2400));
            if (b.x < BANDA + R) {
              b.x = BANDA + R;
              golpe(Math.abs(b.vx));
              b.vx = Math.abs(b.vx) * REBOTE_BANDA;
            } else if (b.x > W - BANDA - R) {
              b.x = W - BANDA - R;
              golpe(Math.abs(b.vx));
              b.vx = -Math.abs(b.vx) * REBOTE_BANDA;
            }
            if (b.y < BANDA + R) {
              b.y = BANDA + R;
              golpe(Math.abs(b.vy));
              b.vy = Math.abs(b.vy) * REBOTE_BANDA;
            } else if (b.y > H - BANDA - R) {
              b.y = H - BANDA - R;
              golpe(Math.abs(b.vy));
              b.vy = -Math.abs(b.vy) * REBOTE_BANDA;
            }
          } else {
            // Adentro de la boca no hay banda, pero tampoco se sale de la mesa: la madera la frena.
            const min = BANDA - 14;
            if (b.x < min || b.x > W - min) b.vx = -b.vx * 0.5;
            if (b.y < min || b.y > H - min) b.vy = -b.vy * 0.5;
            b.x = Math.min(W - min, Math.max(min, b.x));
            b.y = Math.min(H - min, Math.max(min, b.y));
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
            const imp = (rel * (1 + REBOTE_BOLA)) / 2;
            a.vx -= imp * nx;
            a.vy -= imp * ny;
            b.vx += imp * nx;
            b.vy += imp * ny;
            moviendo = true;
            if (rel > 40) choque("bola", Math.min(0.7, 0.12 + rel / 1600));
          }
        }
      }

      // Las que cayeron se achican en el agujero.
      for (const b of bs) if (b.cayendo > 0) b.cayendo = Math.max(0, b.cayendo - dt * 5);

      const blanca = bs[0];
      if (!moviendo && !quietas.current) {
        // Terminó el tiro.
        const e = estado.current;
        if (e.blancaAdentro) {
          e.adentro = Math.max(0, e.adentro - 1);
          setAdentro(e.adentro);
          setAviso("Se metió la blanca: resta una.");
          e.blancaAdentro = false;
          blanca.adentro = false;
          blanca.cayendo = 0;
          blanca.x = CABECERA.x;
          blanca.y = CABECERA.y;
          while (bs.some((o) => o !== blanca && !o.adentro && Math.hypot(o.x - blanca.x, o.y - blanca.y) < R * 2.2)) blanca.x += R;
        } else if (e.metioEnElTiro >= 2) setAviso(`¡${e.metioEnElTiro} de un tiro!`);
        else if (e.metioEnElTiro === 1) setAviso("Adentro.");
        else setAviso("");
        e.metioEnElTiro = 0;
        const quedan = bs.filter((b) => !b.blanca && !b.adentro).length;
        if (quedan === 0 || e.tiros <= 0) {
          setTimeout(() => setPhase("end"), 500);
          dibujar(ctx, bs, null);
          dibujarParticulas(ctx, part);
          quietas.current = true;
          return;
        }
      }
      quietas.current = !moviendo;

      moverParticulas(part, dt);
      dibujar(ctx, bs, quietas.current ? apunte.current : null);
      dibujarParticulas(ctx, part);
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
    <Shell title="Embocá" onBack={onBack} right={phase === "play" ? <>{tiros} {tiros === 1 ? "tiro" : "tiros"}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🎱" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Apoyá el dedo en cualquier lado y tirá para atrás, como una gomera. La guía te muestra a qué bola le pega la blanca y para dónde sale.
            Cuanto más tirás, más fuerte. Diez tiros para meter las siete; si metés la blanca, resta una.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Armar la mesa
          </button>
        </div>
      ) : (
        <>
          <div className="jg-pool-bandeja" aria-label={`${adentro} adentro`}>
            {COLORES.map((c, i) => {
              const n = i + 1;
              const ya = embocadas.includes(n);
              return (
                <span key={n} className={`jg-pool-bola ${ya ? "is-in" : ""}`} style={{ background: ya ? c : undefined }}>
                  {n}
                </span>
              );
            })}
            <span className="jg-pool-aviso" aria-live="polite">
              {aviso}
            </span>
          </div>
          <canvas
            ref={canvas}
            className="jg-lienzo mt-2"
            // El ancho sale del alto disponible: con sólo max-height, en un celular bajo la mesa quedaba aplastada.
            style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, calc(72dvh * ${W} / ${H}))` }}
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
              if (largo < 14) return; // un toque sin tirar no gasta el tiro
              // La fuerza crece más rápido al final: los tiros suaves se pueden dosificar.
              const f = Math.min(1, largo / TIRON_MAX);
              const fuerza = (0.12 + 0.88 * f * f) * FUERZA_MAX;
              const blanca = bolas.current[0];
              blanca.vx = (dx / largo) * fuerza;
              blanca.vy = (dy / largo) * fuerza;
              quietas.current = false;
              estado.current.tiros -= 1;
              setTiros(estado.current.tiros);
              setAviso("");
              sonar("golpe", 0.25 + f * 0.3, 1.1 - f * 0.15);
              tap(10 + f * 20);
            }}
            onPointerCancel={() => {
              apunte.current = null;
            }}
          />
        </>
      )}
    </Shell>
  );
}

function dibujar(ctx: CanvasRenderingContext2D, bs: Bola[], apunte: { desde: { x: number; y: number }; hasta: { x: number; y: number } } | null) {
  // La baranda de madera.
  const madera = ctx.createLinearGradient(0, 0, W, 0);
  madera.addColorStop(0, "#3d2213");
  madera.addColorStop(0.5, "#5b3620");
  madera.addColorStop(1, "#3d2213");
  ctx.fillStyle = madera;
  ctx.fillRect(0, 0, W, H);

  // El paño, con la luz de la lámpara arriba.
  ctx.fillStyle = "#1c6446";
  ctx.fillRect(BANDA, BANDA, W - BANDA * 2, H - BANDA * 2);
  const luz = ctx.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H / 2, H * 0.62);
  luz.addColorStop(0, "rgba(255,236,180,0.16)");
  luz.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = luz;
  ctx.fillRect(BANDA, BANDA, W - BANDA * 2, H - BANDA * 2);
  // El borde de goma de las bandas.
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(BANDA + 1.5, BANDA + 1.5, W - BANDA * 2 - 3, H - BANDA * 2 - 3);

  // Los diamantes de la baranda, para apuntar a banda.
  ctx.fillStyle = "rgba(240,226,190,0.75)";
  for (let k = 1; k <= 3; k++) {
    const x = BANDA + ((W - BANDA * 2) * k) / 4;
    for (const y of [BANDA / 2, H - BANDA / 2]) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const k of [1, 2, 3, 5, 6, 7]) {
    const y = BANDA + ((H - BANDA * 2) * k) / 8;
    for (const x of [BANDA / 2, W - BANDA / 2]) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // La línea de cabecera, de donde sale la blanca.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(BANDA, CABECERA.y);
  ctx.lineTo(W - BANDA, CABECERA.y);
  ctx.stroke();

  for (const p of TRONERAS) {
    ctx.fillStyle = "#2a1a10";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.caza + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#070707";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.caza, 0, Math.PI * 2);
    ctx.fill();
  }

  // Las que están cayendo, achicándose en el agujero.
  for (const b of bs) if (b.adentro && b.cayendo > 0) bolaDibujo(ctx, b, R * b.cayendo, false);

  const blanca = bs[0];
  if (apunte && !blanca.adentro) guia(ctx, bs, apunte);

  for (const b of bs) if (!b.adentro) bolaDibujo(ctx, b, R, true);

  if (apunte && !blanca.adentro) taco(ctx, blanca, apunte);
}

function bolaDibujo(ctx: CanvasRenderingContext2D, b: Bola, r: number, sombra: boolean) {
  if (sombra) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(b.x + 2.5, b.y + 3.5, r, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
  g.addColorStop(0, b.blanca ? "#ffffff" : aclarar(b.color));
  g.addColorStop(1, b.color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!b.blanca && r > 6) {
    ctx.fillStyle = "#fbf7ee";
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = `700 ${Math.round(r * 0.72)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(b.n), b.x, b.y + 0.5);
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(b.x - r * 0.38, b.y - r * 0.42, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function aclarar(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.min(255, ((n >> s) & 255) + 70);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function direccion(apunte: { desde: { x: number; y: number }; hasta: { x: number; y: number } }) {
  const dx = apunte.desde.x - apunte.hasta.x;
  const dy = apunte.desde.y - apunte.hasta.y;
  const largo = Math.hypot(dx, dy);
  return largo < 4 ? null : { ux: dx / largo, uy: dy / largo, f: Math.min(1, largo / TIRON_MAX) };
}

/** La guía: hasta dónde va la blanca, la bola fantasma donde toca, y para dónde salen las dos. */
function guia(ctx: CanvasRenderingContext2D, bs: Bola[], apunte: { desde: { x: number; y: number }; hasta: { x: number; y: number } }) {
  const d = direccion(apunte);
  if (!d) return;
  const c = bs[0];
  const { t, bola } = trazar(bs, d.ux, d.uy);
  const fx = c.x + d.ux * t;
  const fy = c.y + d.uy * t;

  ctx.setLineDash([5, 6]);
  ctx.strokeStyle = "rgba(255,248,230,0.75)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x + d.ux * R, c.y + d.uy * R);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255,248,230,0.8)";
  ctx.beginPath();
  ctx.arc(fx, fy, R, 0, Math.PI * 2);
  ctx.stroke();

  if (bola) {
    // La bola tocada sale por la línea que une los centros; la blanca, de costado.
    const nx = (bola.x - fx) / (R * 2);
    const ny = (bola.y - fy) / (R * 2);
    ctx.strokeStyle = bola.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bola.x + nx * R, bola.y + ny * R);
    ctx.lineTo(bola.x + nx * (R + 80), bola.y + ny * (R + 80));
    ctx.stroke();
    const dot = d.ux * nx + d.uy * ny;
    const tx = d.ux - dot * nx;
    const ty = d.uy - dot * ny;
    const tl = Math.hypot(tx, ty);
    if (tl > 0.05) {
      ctx.strokeStyle = "rgba(255,248,230,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + (tx / tl) * 50 * tl, fy + (ty / tl) * 50 * tl);
      ctx.stroke();
    }
  } else {
    // Contra la banda: el rebote, cortito.
    const rx = fx <= BANDA + R + 0.5 || fx >= W - BANDA - R - 0.5 ? -d.ux : d.ux;
    const ry = fy <= BANDA + R + 0.5 || fy >= H - BANDA - R - 0.5 ? -d.uy : d.uy;
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = "rgba(255,248,230,0.4)";
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + rx * 60, fy + ry * 60);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // La fuerza, en una barrita abajo.
  const ancho = 120;
  const x0 = W / 2 - ancho / 2;
  const y0 = H - BANDA / 2 - 3;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x0, y0, ancho, 6);
  ctx.fillStyle = d.f > 0.85 ? "#e0623a" : "#e8c27a";
  ctx.fillRect(x0, y0, ancho * d.f, 6);
}

function taco(ctx: CanvasRenderingContext2D, c: Bola, apunte: { desde: { x: number; y: number }; hasta: { x: number; y: number } }) {
  const d = direccion(apunte);
  if (!d) return;
  const atras = R + 5 + d.f * 34;
  const largo = 230;
  const x1 = c.x - d.ux * atras;
  const y1 = c.y - d.uy * atras;
  const x2 = c.x - d.ux * (atras + largo);
  const y2 = c.y - d.uy * (atras + largo);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1 + 3, y1 + 4);
  ctx.lineTo(x2 + 3, y2 + 4);
  ctx.stroke();
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, "#f2e6cc");
  g.addColorStop(0.04, "#f2e6cc");
  g.addColorStop(0.05, "#c99a5b");
  g.addColorStop(0.7, "#8a5a2e");
  g.addColorStop(0.72, "#1d1410");
  g.addColorStop(1, "#1d1410");
  ctx.strokeStyle = g;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineCap = "butt";
}
