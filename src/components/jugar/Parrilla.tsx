"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { puntoDelCorte } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo } from "./lienzo";
import { Emoji } from "./Emoji";
import {
  cargarTexturas,
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
  type Textura,
} from "./efectos";

const HUMO: Textura[] = ["smoke_01", "smoke_04", "smoke_07", "smoke_09"];
const CHISPA: Textura[] = ["spark_01", "spark_02", "spark_04"];
const LLAMA: Textura[] = ["flame_01", "flame_03", "flame_05"];

const W = 360;
const H = 500;
const DURACION = 60;
/** Pasado este punto el corte se quema solo, aunque no lo toques. */
const SE_QUEMA = 1.25;
/** La parrilla y sus seis lugares (dos columnas, tres filas). */
const GRILLA = { x: 14, y: 64, w: W - 28, h: H - 78 };
const COLS = 2;
const FILAS = 3;
const CELDA_W = GRILLA.w / COLS;
const CELDA_H = GRILLA.h / FILAS;
const LUGARES = COLS * FILAS;
const LARGO = 116;
const GROSOR = 30;

/** Cada chori tarda entre 4,5 y 7,5 segundos: hay que mirarlo, no contar. */
const tiempoDeCoccion = () => 4500 + Math.random() * 3000;
const centro = (i: number) => ({ x: GRILLA.x + CELDA_W * ((i % COLS) + 0.5), y: GRILLA.y + CELDA_H * (Math.floor(i / COLS) + 0.5) });
/** Cada lugar con su inclinación, para que la parrilla no parezca una planilla. */
const INCLINA = [-0.1, 0.08, 0.06, -0.07, -0.05, 0.1];

type Corte = { desde: number; dura: number; puesto: number; chispa: number } | null;
type Sacado = { x: number; y: number; coccion: number; ang: number; t: number };
type Juego = {
  inicio: number;
  cortes: Corte[];
  puntos: number;
  racha: number;
  part: Particula[];
  flot: Flotante[];
  sacados: Sacado[];
  temblor: Temblor;
  golpe: number;
  fin: boolean;
};
type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** El color del chori según el punto: rosado crudo, dorado, tostado justo, marrón pasado y negro. */
function colorDe(c: number): [number, number, number] {
  const tramos: [number, [number, number, number]][] = [
    [0, [232, 146, 146]],
    [0.45, [222, 140, 96]],
    [0.7, [196, 112, 52]],
    [0.86, [152, 74, 30]],
    [1.0, [98, 46, 22]],
    [1.25, [26, 20, 18]],
  ];
  if (c <= 0) return tramos[0][1];
  for (let i = 1; i < tramos.length; i++) {
    const [b, cb] = tramos[i];
    const [a, ca] = tramos[i - 1];
    if (c <= b) {
      const f = (c - a) / (b - a);
      return [0, 1, 2].map((k) => Math.round(ca[k] + (cb[k] - ca[k]) * f)) as [number, number, number];
    }
  }
  return [26, 20, 18];
}
const rgb = (c: [number, number, number], k = 0) =>
  k >= 0 ? `rgb(${c.map((v) => Math.round(v + (255 - v) * k)).join(",")})` : `rgb(${c.map((v) => Math.round(v * (1 + k))).join(",")})`;

function sumar(j: Juego, n: number, setPuntos: (n: number) => void) {
  j.puntos += n;
  j.golpe = 1.4;
  setPuntos(j.puntos);
}

/** El resplandor de una brasa, pintado una vez en chiquito y estirado al dibujar. */
function resplandor(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,190,90,0.9)");
    g.addColorStop(0.4, "rgba(255,110,30,0.45)");
    g.addColorStop(1, "rgba(255,60,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return c;
}

function nuevoJuego(): Juego {
  return { inicio: performance.now(), cortes: Array(LUGARES).fill(null), puntos: 0, racha: 0, part: [], flot: [], sacados: [], temblor: { f: 0 }, golpe: 1, fin: false };
}

/**
 * La parrilla: un minuto con seis lugares. Tocás un lugar vacío y ponés un chori; lo tocás de nuevo
 * para sacarlo. Cada uno tarda distinto, así que no sirve contar: hay que mirarlo. Pasa de rosado a
 * dorado y a tostado; en su punto brilla y chisporrotea; pasado, humea oscuro y después se prende fuego.
 * Quemado, resta.
 */
export function Parrilla({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["golpe", "tic"]);
    cargarTexturas([...HUMO, ...CHISPA, ...LLAMA, "star_06"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [puntos, setPuntos] = useState(0);
  const [quedan, setQuedan] = useState(DURACION);
  const canvas = useRef<HTMLCanvasElement>(null);
  const juego = useRef<Juego | null>(null);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    juego.current = nuevoJuego();
    setPuntos(0);
    setQuedan(DURACION);
    setPhase("play");
  }

  useEffect(() => {
    const j = juego.current;
    if (phase !== "play" || !canvas.current || !j) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    if (!ctx) return;
    const fondo = fondoFijo(cv, W, H, pintarFuego);
    const rejilla = fondoFijo(cv, W, H, pintarRejilla);
    const brillo = resplandor();
    // Las brasas que respiran debajo de la rejilla.
    const brasas = Array.from({ length: 22 }, () => ({
      x: GRILLA.x + 10 + Math.random() * (GRILLA.w - 20),
      y: GRILLA.y + 10 + Math.random() * (GRILLA.h - 20),
      r: 26 + Math.random() * 34,
      fase: Math.random() * 6,
      vel: 1.5 + Math.random() * 2.5,
    }));
    const quieto = pocoMovimiento();
    let ultimoSeg = DURACION;
    let raf = 0;
    let antes = performance.now();
    let chisporroteo = 0;

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const pasado = (t - j.inicio) / 1000;
      const resto = Math.max(0, DURACION - pasado);
      const seg = Math.ceil(resto);
      if (seg !== ultimoSeg) {
        ultimoSeg = seg;
        setQuedan(seg);
        if (seg <= 5 && seg > 0) sonar("tic", seg === 1 ? 0.5 : 0.35, seg === 1 ? 1.2 : 1);
      }
      if (resto <= 0 && !j.fin) {
        j.fin = true;
        beep(523, 120, "triangle", 0.12);
        setTimeout(() => beep(392, 260, "triangle", 0.12), 120);
        setPhase("end");
        return;
      }

      // Cada chori: humo según cómo va, chispas cuando está a punto, y se quema solo si te olvidaste.
      let alguno = false;
      j.cortes.forEach((c, i) => {
        if (!c) return;
        const p = centro(i);
        const k = (t - c.desde) / c.dura;
        if (k >= SE_QUEMA) {
          j.cortes[i] = null;
          sumar(j, -2, setPuntos);
          j.racha = 0;
          flotar(j.flot, p.x, p.y - 26, "Quemado −2", "#ff7a63", 20);
          soltar(j.part, p.x, p.y, 14, { color: ["#1c1a19", "#3a3532", "#55504b"], vel: 70, r: 8, g: -60, dura: 1.6, humo: true, roce: 1, sprite: HUMO, giro: 0.8 });
          soltar(j.part, p.x, p.y, 6, { color: ["#ff8a2a", "#ffc94a"], vel: 60, r: 7, g: -180, dura: 0.5, roce: 0.6, sprite: LLAMA, luz: true });
          temblar(j.temblor, 6);
          buzz();
          return;
        }
        const humo = k < 0.95 ? 1.2 + k * 3 : k < 1.05 ? 7 : 12;
        if (Math.random() < humo * dt) {
          const gris = k < 0.95 ? ["#cfc8bf", "#a9a29a"] : k < 1.05 ? ["#6e6862", "#4c4743"] : ["#2a2725", "#3c3835"];
          soltar(j.part, p.x + (Math.random() - 0.5) * LARGO * 0.7, p.y - 6, 1, { color: gris, vel: 12, r: 6, g: -42, dura: 1.6, humo: true, roce: 0.6, sprite: HUMO, giro: 0.6 });
        }
        if (k >= 0.78 && k <= 0.95) {
          alguno = true;
          c.chispa -= dt;
          if (c.chispa <= 0) {
            c.chispa = 0.12 + Math.random() * 0.15;
            soltar(j.part, p.x + (Math.random() - 0.5) * LARGO * 0.8, p.y - 8, 2, { color: ["#ffd36e", "#fff2c4", "#ff9a3c"], vel: 120, r: 2.6, g: 300, dura: 0.45, dir: -Math.PI / 2, abanico: 1.6, sprite: CHISPA, luz: true, giro: 6 });
          }
        }
        if (k > 1.05 && Math.random() < 10 * dt) {
          soltar(j.part, p.x + (Math.random() - 0.5) * LARGO * 0.6, p.y, 1, { color: ["#ff8a2a", "#ffc94a", "#ff5a1f"], vel: 30, r: 5, g: -160, dura: 0.4, roce: 0.5, sprite: LLAMA, luz: true });
        }
      });
      // El chisporroteo de la grasa cuando hay alguno justo: un tss cortito, cada tanto.
      chisporroteo -= dt;
      if (alguno && chisporroteo <= 0) {
        chisporroteo = 0.25 + Math.random() * 0.3;
        beep(2600 + Math.random() * 1400, 18, "square", 0.012);
      }
      moverParticulas(j.part, dt);
      j.golpe += (1 - j.golpe) * (1 - Math.exp(-dt * 9));

      // ---- Dibujo ----
      const sac = correrTemblor(j.temblor, dt, quieto);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      ctx.drawImage(fondo, 0, 0, W, H);
      for (const b of brasas) {
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t / 1000 * b.vel + b.fase) + 0.1 * Math.sin(t / 170 + b.fase * 3);
        ctx.drawImage(brillo, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(rejilla, 0, 0, W, H);

      j.cortes.forEach((c, i) => {
        const p = centro(i);
        if (!c) {
          // El lugar vacío: un contorno suave que invita a tocar.
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = `rgba(255,236,200,${0.16 + 0.06 * Math.sin(t / 400 + i)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(p.x - LARGO / 2, p.y - GROSOR / 2, LARGO, GROSOR, GROSOR / 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,236,200,0.28)";
          ctx.font = "600 20px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("+", p.x, p.y + 1);
          return;
        }
        const k = (t - c.desde) / c.dura;
        const entra = Math.min(1, (t - c.puesto) / 220);
        const caida = (1 - entra) * -26;
        const escala = 1 + (1 - entra) * 0.25;
        dibujarChori(ctx, p.x, p.y + caida, k, INCLINA[i], escala, t);
      });

      // Los que salen volando hacia el marcador.
      for (let i = j.sacados.length - 1; i >= 0; i--) {
        const s = j.sacados[i];
        const f = (t - s.t) / 380;
        if (f >= 1) {
          j.sacados.splice(i, 1);
          continue;
        }
        const e = f * f;
        ctx.globalAlpha = 1 - f;
        dibujarChori(ctx, s.x + (40 - s.x) * e, s.y + (28 - s.y) * e - Math.sin(f * Math.PI) * 40, s.coccion, s.ang + f * 2, 1 - f * 0.6, t);
        ctx.globalAlpha = 1;
      }

      dibujarParticulas(ctx, j.part);

      // Arriba: puntos a la izquierda, el reloj como una barra que se consume.
      ctx.save();
      ctx.translate(22, 30);
      ctx.scale(j.golpe, j.golpe);
      ctx.fillStyle = j.puntos < 0 ? "#ff7a63" : "#fff4e0";
      ctx.font = "800 30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(String(j.puntos), 0, 0);
      ctx.restore();
      const bx = 110;
      const bw = W - bx - 52;
      const f = resto / DURACION;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.roundRect(bx, 24, bw, 10, 5);
      ctx.fill();
      ctx.fillStyle = resto <= 10 ? (Math.floor(t / 250) % 2 ? "#ff5f4a" : "#ff8a6e") : "#f0b24a";
      ctx.beginPath();
      ctx.roundRect(bx, 24, Math.max(10, bw * f), 10, 5);
      ctx.fill();
      ctx.fillStyle = resto <= 10 ? "#ff8a6e" : "rgba(255,244,224,0.8)";
      ctx.font = "700 15px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${seg}s`, W - 14, 30);

      dibujarFlotantes(ctx, j.flot, dt, W);
      ctx.restore();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(Math.max(0, juego.current?.puntos ?? 0));
    }
  }, [phase, onDone]);

  function tocar(e: React.PointerEvent<HTMLCanvasElement>) {
    const j = juego.current;
    if (phase !== "play" || !j || j.fin) return;
    const { x, y } = puntoEnLienzo(e, e.currentTarget, W, H);
    const col = Math.floor((x - GRILLA.x) / CELDA_W);
    const fila = Math.floor((y - GRILLA.y) / CELDA_H);
    if (col < 0 || col >= COLS || fila < 0 || fila >= FILAS) return;
    const i = fila * COLS + col;
    const c = j.cortes[i];
    const t = performance.now();
    const p = centro(i);
    if (!c) {
      j.cortes[i] = { desde: t, dura: tiempoDeCoccion(), puesto: t, chispa: 0 };
      sonar("golpe", 0.3, 1.1 + Math.random() * 0.1);
      beep(3200, 60, "square", 0.012);
      tap(6);
      soltar(j.part, p.x, p.y, 6, { color: ["#e8e2d8", "#c9c2b8"], vel: 60, r: 6, g: -50, dura: 0.9, humo: true, roce: 1, sprite: HUMO, giro: 0.8 });
      return;
    }
    const k = (t - c.desde) / c.dura;
    const r = puntoDelCorte(k);
    j.cortes[i] = null;
    j.sacados.push({ x: p.x, y: p.y, coccion: k, ang: INCLINA[i], t });
    sumar(j, r.puntos, setPuntos);
    if (r.como === "perfecto") {
      j.racha += 1;
      beep(880, 90);
      setTimeout(() => beep(1175, 140), 80);
      if (j.racha >= 3) setTimeout(() => beep(1568, 160), 170);
      tap(15);
      flotar(j.flot, p.x, p.y - 24, "¡A punto! +3", "#ffd36e", 22);
      if (j.racha >= 2) flotar(j.flot, p.x, p.y - 54, `Racha x${j.racha}`, "#fff4e0", 15, 1);
      soltar(j.part, p.x, p.y, 18, { color: ["#ffd36e", "#fff2c4", "#ff9a3c"], vel: 240, r: 3, g: 200, dura: 0.7, sprite: CHISPA, luz: true, giro: 8 });
      soltar(j.part, p.x, p.y, 1, { color: "#ffd36e", vel: 0, r: 14, dura: 0.35, sprite: "star_06", luz: true, giro: 2 });
    } else if (r.puntos > 0) {
      j.racha = 0;
      beep(620, 100, "triangle");
      flotar(j.flot, p.x, p.y - 24, `${r.como === "jugoso" ? "Jugoso" : "Pasadito"} +1`, "#f3c86e", 18);
      soltar(j.part, p.x, p.y, 8, { color: ["#f3c86e", "#fff2c4"], vel: 150, r: 2, g: 200, dura: 0.5 });
    } else if (r.como === "crudo") {
      j.racha = 0;
      beep(260, 120, "triangle");
      flotar(j.flot, p.x, p.y - 24, "Crudo, 0", "#f2a5a5", 18);
    } else {
      j.racha = 0;
      buzz();
      flotar(j.flot, p.x, p.y - 24, "Quemado −2", "#ff7a63", 20);
      temblar(j.temblor, 5);
    }
  }

  if (phase === "end") {
    const final = Math.max(0, puntos);
    return (
      <Shell title="La parrilla" onBack={onBack}>
        <Fin nueva={nueva} game="parrilla" value={final} label={`${final} ${final === 1 ? "punto" : "puntos"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Asador de la casa." />
      </Shell>
    );
  }

  return (
    <Shell title="La parrilla" onBack={onBack} right={phase === "play" ? <>{quedan}s</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🔥" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Un minuto de parrilla. Tocá un lugar para poner un chori y tocalo de nuevo para sacarlo. Pasa de rosado a dorado: cuando está tostado
            y brilla, está a punto (vale tres). Cada uno tarda distinto: miralo. Si humea negro, ya fue: quemado resta dos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Prender el fuego
          </button>
        </div>
      ) : (
        <canvas ref={canvas} className="jg-lienzo mt-3" style={estiloLienzo(W, H)} onPointerDown={tocar} aria-label="Parrilla con seis lugares" />
      )}
    </Shell>
  );
}

/** Un chori: la tripa con su brillo, las marcas de la parrilla que aparecen al dorarse, y el punto. */
function dibujarChori(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, ang: number, escala: number, t: number) {
  const c = colorDe(k);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(escala, escala);
  const L = LARGO;
  const G = GROSOR;
  // Sombra sobre la rejilla
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.roundRect(-L / 2 + 3, -G / 2 + 6, L, G, G / 2);
  ctx.fill();
  // En su punto, un halo dorado que late.
  const justo = k >= 0.78 && k <= 0.95;
  if (justo) {
    const late = 0.5 + 0.5 * Math.sin(t / 90);
    ctx.strokeStyle = `rgba(255,200,90,${0.45 + late * 0.45})`;
    ctx.lineWidth = 3 + late * 2;
    ctx.beginPath();
    ctx.roundRect(-L / 2 - 4, -G / 2 - 4, L + 8, G + 8, G / 2 + 4);
    ctx.stroke();
  }
  // Las puntitas atadas
  ctx.fillStyle = rgb(c, -0.35);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * (L / 2 + 2), 0, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // La tripa, con volumen
  const g = ctx.createLinearGradient(0, -G / 2, 0, G / 2);
  g.addColorStop(0, rgb(c, 0.28));
  g.addColorStop(0.45, rgb(c));
  g.addColorStop(1, rgb(c, -0.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-L / 2, -G / 2, L, G, G / 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Marcas de la parrilla: aparecen a medida que se dora.
  const marcas = limitar((k - 0.2) * 1.3, 0, 0.75);
  if (marcas > 0) {
    ctx.strokeStyle = `rgba(30,12,4,${marcas})`;
    ctx.lineWidth = 4;
    for (let mx = -L / 2 + 10; mx < L / 2; mx += 17) {
      ctx.beginPath();
      ctx.moveTo(mx, -G / 2);
      ctx.lineTo(mx + 9, G / 2);
      ctx.stroke();
    }
  }
  // Pasado: manchas negras de carbón.
  if (k > 1) {
    ctx.fillStyle = `rgba(10,8,6,${limitar((k - 1) * 3, 0, 0.85)})`;
    for (const [mx, my, r] of [[-34, -4, 9], [-6, 5, 11], [22, -3, 8], [40, 4, 7]]) {
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // El brillo de la grasa: fuerte cuando está jugoso, se apaga al quemarse.
  const brillo = k < 0.95 ? 0.32 + (justo ? 0.25 + 0.15 * Math.sin(t / 70) : 0) : Math.max(0, 0.32 - (k - 0.95) * 1.2);
  ctx.fillStyle = `rgba(255,255,255,${brillo})`;
  ctx.beginPath();
  ctx.roundRect(-L / 2 + 12, -G / 2 + 4, L - 24, 4, 2);
  ctx.fill();
  ctx.restore();
}

/** El fondo: la caja de la parrilla y el lecho de brasas, pintado una vez. */
function pintarFuego(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#120d0b";
  ctx.fillRect(0, 0, W, H);
  // La caja de chapa
  const caja = ctx.createLinearGradient(0, GRILLA.y - 8, 0, GRILLA.y + GRILLA.h + 8);
  caja.addColorStop(0, "#3b3431");
  caja.addColorStop(1, "#1b1715");
  ctx.fillStyle = caja;
  ctx.beginPath();
  ctx.roundRect(GRILLA.x - 8, GRILLA.y - 8, GRILLA.w + 16, GRILLA.h + 16, 12);
  ctx.fill();
  // Ceniza y brasas
  ctx.fillStyle = "#24160f";
  ctx.beginPath();
  ctx.roundRect(GRILLA.x, GRILLA.y, GRILLA.w, GRILLA.h, 6);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(GRILLA.x, GRILLA.y, GRILLA.w, GRILLA.h, 6);
  ctx.clip();
  for (let i = 0; i < 80; i++) {
    const x = GRILLA.x + Math.random() * GRILLA.w;
    const y = GRILLA.y + Math.random() * GRILLA.h;
    const r = 4 + Math.random() * 9;
    const caliente = Math.random();
    ctx.fillStyle = caliente > 0.82 ? "#e8641f" : caliente > 0.5 ? "#8a3416" : "#33201a";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,12,8,0.7)";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.2, y + r * 0.15, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Un velo oscuro: las brasas acompañan, los choris se tienen que ver.
  ctx.fillStyle = "rgba(14,9,7,0.45)";
  ctx.fillRect(GRILLA.x, GRILLA.y, GRILLA.w, GRILLA.h);
  ctx.restore();
}

/** La rejilla de hierro en V, encima de las brasas. */
function pintarRejilla(ctx: CanvasRenderingContext2D) {
  for (let x = GRILLA.x + 10; x < GRILLA.x + GRILLA.w - 4; x += 22) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + 2, GRILLA.y, 5, GRILLA.h);
    const g = ctx.createLinearGradient(x, 0, x + 5, 0);
    g.addColorStop(0, "#2b2624");
    g.addColorStop(0.45, "#77706a");
    g.addColorStop(1, "#262120");
    ctx.fillStyle = g;
    ctx.fillRect(x, GRILLA.y, 5, GRILLA.h);
  }
  for (const y of [GRILLA.y + 6, GRILLA.y + GRILLA.h - 12]) {
    const g = ctx.createLinearGradient(0, y, 0, y + 6);
    g.addColorStop(0, "#77706a");
    g.addColorStop(1, "#211c1a");
    ctx.fillStyle = g;
    ctx.fillRect(GRILLA.x, y, GRILLA.w, 6);
  }
}
