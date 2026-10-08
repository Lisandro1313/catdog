"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { emoji, precargarEmojis, prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";
import { Emoji } from "./Emoji";
import {
  cargarTexturas,
  correrTemblor,
  dibujarFlotantes,
  dibujarParticulas,
  estiloLienzo,
  flotar,
  fondoFijo,
  moverParticulas,
  pocoMovimiento,
  soltar,
  temblar,
  type Flotante,
  type Particula,
  type Temblor,
  type Textura,
} from "./efectos";

/** Las gotas de jugo (manchas irregulares) y el filo del tajo. */
const GOTA: Textura[] = ["circle_05", "dirt_01", "dirt_02", "dirt_03"];
const FILO: Textura[] = ["slash_01", "slash_02", "slash_03"];

const W = 360;
const H = 600;
const GRAVEDAD = 900;
const VIDAS = 3;
/** Cada fruta con el color de su jugo: es lo que salpica y lo que queda manchado en la tabla. */
const FRUTAS: { e: string; jugo: string; pulpa: string }[] = [
  { e: "🍋", jugo: "#f5df3d", pulpa: "#fbf1a6" },
  { e: "🍊", jugo: "#f39424", pulpa: "#ffc770" },
  { e: "🍓", jugo: "#e2273f", pulpa: "#ff8b8b" },
  { e: "🍋", jugo: "#f5df3d", pulpa: "#fbf1a6" },
  { e: "🍊", jugo: "#f39424", pulpa: "#ffc770" },
  { e: "🥝", jugo: "#8cc63f", pulpa: "#c8ec8a" },
  { e: "🍍", jugo: "#f4c21f", pulpa: "#ffe58a" },
  { e: "🍉", jugo: "#e8354a", pulpa: "#ff7d86" },
  { e: "🍎", jugo: "#f1e2b0", pulpa: "#fff4d2" },
];
const RADIO = 27;
/** Cuánto vale un corte: el dedo tiene que ir rápido (px por milisegundo). Dejarlo quieto no corta. */
const RAPIDO = 0.35;

type Cosa = { x: number; y: number; vx: number; vy: number; tipo: number; botella: boolean; giro: number; vg: number };
type Mitad = { x: number; y: number; vx: number; vy: number; tipo: number; corte: number; giro: number; vg: number; lado: -1 | 1; vida: number };
type Mancha = { x: number; y: number; r: number; color: string; vida: number; gotas: { dx: number; dy: number; r: number }[] };
type Punto = { x: number; y: number; t: number };
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
 * Cada emoji se dibuja una sola vez en un lienzo chiquito y después se copia: dibujar texto en cada
 * cuadro es lo que más traba en el celular.
 */
function sprite(e: string, tam: number, escala: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const lado = Math.ceil(tam * 1.3);
  c.width = Math.ceil(lado * escala);
  c.height = Math.ceil(lado * escala);
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    emoji(ctx, e, lado / 2, lado / 2 + tam * 0.04, tam);
  }
  return c;
}

/** La botella de la casa: vidrio verde, etiqueta y tapa. Dibujada, para que no se confunda con nada. */
function spriteBotella(escala: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const lado = 72;
  c.width = Math.ceil(lado * escala);
  c.height = Math.ceil(lado * escala);
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  ctx.translate(lado / 2, lado / 2);
  const vidrio = ctx.createLinearGradient(-12, 0, 12, 0);
  vidrio.addColorStop(0, "#0f3b22");
  vidrio.addColorStop(0.35, "#2f8a55");
  vidrio.addColorStop(1, "#0c2e1a");
  ctx.fillStyle = vidrio;
  ctx.beginPath();
  ctx.moveTo(-5, -31);
  ctx.lineTo(5, -31);
  ctx.lineTo(5, -17);
  ctx.quadraticCurveTo(13, -12, 13, -2);
  ctx.lineTo(13, 27);
  ctx.quadraticCurveTo(13, 31, 9, 31);
  ctx.lineTo(-9, 31);
  ctx.quadraticCurveTo(-13, 31, -13, 27);
  ctx.lineTo(-13, -2);
  ctx.quadraticCurveTo(-13, -12, -5, -17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c8322a";
  ctx.fillRect(-6, -35, 12, 6);
  ctx.fillStyle = "#f2e6cc";
  ctx.fillRect(-13, 2, 26, 15);
  ctx.fillStyle = "#c8322a";
  ctx.font = "800 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NO", 0, 10);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-9, -8, 3, 34);
  return c;
}

/**
 * Cortá la fruta: saltan limones, naranjas, frutillas; se cortan deslizando el dedo. Varias de un
 * tajo es combo. Si una cae entera, perdés una vida. Las botellas no se tocan: cortar una termina el juego.
 */
export function Fruta({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["vidrio-roto", "golpe"]);
    cargarTexturas([...GOTA, ...FILO, "spark_05", "star_04"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [cortadas, setCortadas] = useState(0);
  const [vidas, setVidas] = useState(VIDAS);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dedo = useRef<Punto[]>([]);
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
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    if (!ctx) return;
    const escala = cv.width / W;
    const fondo = fondoFijo(cv, W, H, pintarTabla);
    let sprites = FRUTAS.map((f) => sprite(f.e, RADIO * 2, escala));
    // Las frutas en 3D llegan un instante después: cuando están, se vuelven a armar los dibujos.
    precargarEmojis(FRUTAS.map((f) => f.e)).then(() => {
      sprites = FRUTAS.map((f) => sprite(f.e, RADIO * 2, escala));
    });
    const botella = spriteBotella(escala);
    const quieto = pocoMovimiento();
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cosas: Cosa[] = [];
    const mitades: Mitad[] = [];
    const manchas: Mancha[] = [];
    const part: Particula[] = [];
    const flot: Flotante[] = [];
    const cruces: { x: number; vida: number }[] = [];
    const temblor: Temblor = { f: 0 };
    let vidasLocal = VIDAS;
    let proxima = performance.now() + 600;
    const arranque = performance.now();
    let termino = 0;
    let flash = 0;
    let rojo = 0;
    /** El tajo en curso: cuántas frutas lleva y cuándo cortó la última. */
    const tajo = { n: 0, ultima: 0, x: 0, y: 0 };
    let ultimoLeido = 0;
    let raf = 0;
    let antes = performance.now();

    const tirar = (x: number, botella: boolean, demora = 0) => {
      // Que suba hasta la parte de arriba de la tabla y caiga adentro.
      const sube = 330 + Math.random() * 200;
      const vy = -Math.sqrt(2 * GRAVEDAD * sube);
      const vuelo = (2 * -vy) / GRAVEDAD;
      const destino = 60 + Math.random() * (W - 120);
      cosas.push({
        x,
        y: H + 40 + demora,
        vx: (destino - x) / vuelo,
        vy,
        tipo: Math.floor(Math.random() * FRUTAS.length),
        botella,
        giro: Math.random() * 6,
        vg: (Math.random() - 0.5) * 5,
      });
    };

    const lanzar = (t: number) => {
      const segs = (t - arranque) / 1000;
      // Sube parejo: más frutas por tanda y tandas más seguidas, con una andanada cada tanto.
      const andanada = segs > 20 && Math.random() < 0.14;
      const cuantas = andanada ? 4 + Math.floor(Math.random() * 2) : 1 + (Math.random() < Math.min(0.65, segs / 50) ? 1 : 0) + (Math.random() < Math.min(0.35, segs / 110) ? 1 : 0);
      for (let k = 0; k < cuantas; k++) {
        const esBotella = !andanada && k === 0 && segs > 4 && Math.random() < Math.min(0.22, 0.08 + segs / 400);
        const x = andanada ? 40 + ((W - 80) * k) / (cuantas - 1) : 50 + Math.random() * (W - 100);
        tirar(x, esBotella, andanada ? k * 26 : k * 18);
      }
      if (andanada) beep(330, 80, "triangle", 0.06);
      proxima = t + (andanada ? 1700 : Math.max(520, 1200 - segs * 11) + Math.random() * 280);
    };

    const cortar = (c: Cosa, a: Punto, b: Punto, t: number) => {
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (c.botella) {
        sonar("vidrio-roto", 0.7);
        tap(60);
        termino = t;
        rojo = 1;
        temblar(temblor, 14);
        soltar(part, c.x, c.y, 26, { color: ["#2f8a55", "#bfe8cf", "#0f3b22", "#ffffff"], vel: 420, r: 2.6, g: 700, dura: 0.9 });
        soltar(part, c.x, c.y, 8, { color: ["#e8fff2", "#bfe8cf"], vel: 300, r: 3, g: 500, dura: 0.6, sprite: "spark_05", luz: true, giro: 10 });
        flotar(flot, c.x, c.y - 30, "¡La botella no!", "#ff7a63", 26, 1.4);
        timers.push(setTimeout(() => setPhase("end"), 1100));
        return;
      }
      const f = FRUTAS[c.tipo];
      total.current += 1;
      setCortadas(total.current);
      // Varias en el mismo tajo, una atrás de la otra, es combo.
      tajo.n = t - tajo.ultima < 260 ? tajo.n + 1 : 1;
      tajo.ultima = t;
      tajo.x = c.x;
      tajo.y = c.y;
      beep(620 + Math.min(tajo.n, 6) * 110 + Math.random() * 60, 70, "triangle", 0.1);
      beep(180, 40, "sawtooth", 0.03);
      tap(8);
      for (const lado of [-1, 1] as const) {
        const nx = -Math.sin(ang) * lado;
        const ny = Math.cos(ang) * lado;
        mitades.push({ x: c.x, y: c.y, vx: c.vx * 0.4 + nx * 130 + Math.cos(ang) * 60, vy: Math.min(c.vy, 0) * 0.3 + ny * 130 - 60, tipo: c.tipo, corte: ang, giro: c.giro, vg: lado * (2 + Math.random() * 3), lado, vida: 1.6 });
      }
      soltar(part, c.x, c.y, 16, { color: [f.jugo, f.pulpa], vel: 330, r: 3, g: 600, dura: 0.7, roce: 2 });
      // Salpicón: gotas grandes e irregulares del color del jugo, que giran al volar.
      soltar(part, c.x, c.y, 7, { color: [f.jugo, f.pulpa], vel: 260, r: 4.5, g: 650, dura: 0.65, roce: 1.6, sprite: GOTA, giro: 4 });
      soltar(part, c.x, c.y, 6, { color: "#ffffff", vel: 260, r: 1.6, dura: 0.25, dir: ang, abanico: 0.5 });
      // El filo del cuchillo: un tajo de luz que sigue el corte.
      soltar(part, c.x, c.y, 1, { color: "#fff8e6", vel: 0, r: 13, dura: 0.22, sprite: FILO, luz: true, rot: ang });
      manchas.push({
        x: c.x,
        y: c.y,
        r: 14 + Math.random() * 8,
        color: f.jugo,
        vida: 3,
        gotas: Array.from({ length: 6 }, () => ({ dx: (Math.random() - 0.5) * 70, dy: (Math.random() - 0.5) * 70, r: 2 + Math.random() * 5 })),
      });
      if (manchas.length > 14) manchas.shift();
      flash = 1;
    };

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      if (!termino && t >= proxima) lanzar(t);

      // Cuando el tajo terminó (o pasó un ratito), se canta el combo.
      if (tajo.n >= 2 && t - tajo.ultima > 260) {
        flotar(flot, tajo.x, tajo.y - 20, `¡Combo x${tajo.n}!`, "#ffd36e", 20 + Math.min(tajo.n, 5) * 3, 1.1);
        soltar(part, tajo.x, tajo.y, 10 + tajo.n * 4, { color: ["#ffd36e", "#fff4e0"], vel: 240, r: 3, dura: 0.6, sprite: "star_04", luz: true, giro: 5 });
        [0, 70, 140].slice(0, Math.min(3, tajo.n)).forEach((d, i) => timers.push(setTimeout(() => beep(880 * [1, 1.25, 1.5][i], 90, "triangle", 0.09), d)));
        tajo.n = 0;
      } else if (tajo.n === 1 && t - tajo.ultima > 260) tajo.n = 0;

      // El corte: los tramos nuevos que hizo el dedo, rápidos. El dedo quieto no corta.
      const d = dedo.current;
      if (!termino && apretado.current) {
        for (let k = 1; k < d.length; k++) {
          const a = d[k - 1];
          const b = d[k];
          if (b.t <= ultimoLeido) continue;
          const largo = Math.hypot(b.x - a.x, b.y - a.y);
          if (largo < 3 || largo / Math.max(1, b.t - a.t) < RAPIDO) continue;
          for (let i = cosas.length - 1; i >= 0 && !termino; i--) {
            const c = cosas[i];
            if (distSegmento(c.x, c.y, a.x, a.y, b.x, b.y) > (c.botella ? RADIO * 0.8 : RADIO)) continue;
            cosas.splice(i, 1);
            cortar(c, a, b, t);
          }
        }
      }
      if (d.length) ultimoLeido = d[d.length - 1].t;

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
            sonar("golpe", 0.45, 0.8);
            tap(30);
            temblar(temblor, 5);
            cruces.push({ x: Math.max(24, Math.min(W - 24, c.x)), vida: 1.2 });
            if (vidasLocal <= 0) {
              termino = t;
              flotar(flot, W / 2, H / 2, "Se te cayeron tres", "#ff7a63", 22, 1.3);
              timers.push(setTimeout(() => setPhase("end"), 1000));
            }
          }
        }
      }
      for (let i = mitades.length - 1; i >= 0; i--) {
        const m = mitades[i];
        m.vy += GRAVEDAD * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.giro += m.vg * dt;
        m.vida -= dt;
        if (m.vida <= 0 || m.y > H + 80) mitades.splice(i, 1);
      }
      moverParticulas(part, dt);

      // ---- Dibujo ----
      const sac = correrTemblor(temblor, dt, quieto);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      ctx.drawImage(fondo, 0, 0, W, H);

      // Las manchas de jugo en la tabla, que se van secando.
      for (let i = manchas.length - 1; i >= 0; i--) {
        const m = manchas[i];
        m.vida -= dt;
        if (m.vida <= 0) {
          manchas.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.min(0.35, m.vida * 0.2);
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        for (const g of m.gotas) {
          ctx.moveTo(m.x + g.dx + g.r, m.y + g.dy);
          ctx.arc(m.x + g.dx, m.y + g.dy, g.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const lado = sprites[0].width / escala;
      for (const c of cosas) {
        if (c.botella) {
          // Aura roja que late: "esto no".
          const late = 0.5 + 0.5 * Math.sin(t / 130);
          ctx.strokeStyle = `rgba(255,90,70,${0.35 + late * 0.35})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(c.x, c.y, RADIO + 4 + late * 3, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.beginPath();
          ctx.ellipse(c.x + 6, c.y + 10, RADIO * 0.8, RADIO * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.giro);
        if (c.botella) ctx.drawImage(botella, -36, -36, 72, 72);
        else ctx.drawImage(sprites[c.tipo], -lado / 2, -lado / 2, lado, lado);
        ctx.restore();
      }

      // Las mitades: cada una muestra su lado de la fruta y la cara del corte, con la pulpa.
      for (const m of mitades) {
        const f = FRUTAS[m.tipo];
        ctx.save();
        ctx.globalAlpha = Math.min(1, m.vida * 2);
        ctx.translate(m.x, m.y);
        ctx.rotate(m.corte + m.giro * 0.4);
        ctx.beginPath();
        ctx.rect(-lado, m.lado < 0 ? -lado : 0, lado * 2, lado);
        ctx.clip();
        ctx.save();
        ctx.rotate(-m.corte + m.giro * 0.6);
        ctx.drawImage(sprites[m.tipo], -lado / 2, -lado / 2, lado, lado);
        ctx.restore();
        ctx.fillStyle = f.pulpa;
        ctx.beginPath();
        ctx.ellipse(0, 0, RADIO * 0.82, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = f.jugo;
        ctx.beginPath();
        ctx.ellipse(0, 0, RADIO * 0.6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      dibujarParticulas(ctx, part);

      // La estela del dedo: una cinta que se afina hacia atrás, con brillo.
      const ahora = performance.now();
      const estela = d.filter((q) => ahora - q.t < 160);
      if (estela.length >= 2 && apretado.current) cinta(ctx, estela, ahora);

      // Las cruces de las que se cayeron, abajo.
      for (let i = cruces.length - 1; i >= 0; i--) {
        const x = cruces[i];
        x.vida -= dt;
        if (x.vida <= 0) {
          cruces.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.min(1, x.vida * 2);
        ctx.strokeStyle = "#ff5f4a";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        const y = H - 30 - (1.2 - x.vida) * 20;
        ctx.beginPath();
        ctx.moveTo(x.x - 10, y - 10);
        ctx.lineTo(x.x + 10, y + 10);
        ctx.moveTo(x.x + 10, y - 10);
        ctx.lineTo(x.x - 10, y + 10);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Las vidas, arriba a la derecha: una X por cada fruta que se cayó.
      for (let k = 0; k < VIDAS; k++) {
        const perdida = k < VIDAS - vidasLocal;
        const x = W - 22 - k * 26;
        ctx.strokeStyle = perdida ? "#ff5f4a" : "rgba(255,244,224,0.22)";
        ctx.lineWidth = perdida ? 4 : 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 7, 15);
        ctx.lineTo(x + 7, 29);
        ctx.moveTo(x + 7, 15);
        ctx.lineTo(x - 7, 29);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff4e0";
      ctx.font = "800 30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(String(total.current), 16, 26);

      dibujarFlotantes(ctx, flot, dt, W);

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,250,235,${flash * 0.08})`;
        ctx.fillRect(0, 0, W, H);
        flash = Math.max(0, flash - dt * 8);
      }
      if (rojo > 0) {
        ctx.fillStyle = `rgba(200,40,30,${rojo * 0.35})`;
        ctx.fillRect(0, 0, W, H);
        rojo = Math.max(0, rojo - dt * 1.5);
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
      onDone(cortadas);
    }
  }, [phase, cortadas, onDone]);

  function leer(e: React.PointerEvent<HTMLCanvasElement>) {
    const cv = canvas.current;
    if (!cv) return;
    // Los puntos intermedios que junta el navegador entre cuadro y cuadro: la estela sale más suave.
    const juntos = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const lista = juntos.length ? juntos : [e.nativeEvent];
    const ahora = performance.now();
    const nuevos = lista.map((ev) => ({ ...puntoEnLienzo(ev, cv, W, H), t: ahora }));
    // Repartidos en el tiempo, para que la velocidad de cada tramo dé bien.
    const previo = dedo.current[dedo.current.length - 1];
    const desde = previo ? previo.t : ahora - 16;
    nuevos.forEach((p, i) => (p.t = desde + ((ahora - desde) * (i + 1)) / nuevos.length));
    dedo.current = [...dedo.current, ...nuevos].slice(-24);
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
            <Emoji e="🍋" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Saltan limones, naranjas y frutillas: cortalas deslizando el dedo, rápido. Varias de un tajo es combo. Si una cae entera, perdés una
            vida. Las botellas (las del aura roja) no se tocan.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Afilar el cuchillo
          </button>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="jg-lienzo mt-3"
          style={estiloLienzo(W, H)}
          aria-label="Tabla de picar"
          onPointerDown={(e) => {
            capturar(e);
            apretado.current = true;
            dedo.current = [{ ...puntoEnLienzo(e, e.currentTarget, W, H), t: performance.now() }];
          }}
          onPointerMove={(e) => {
            if (apretado.current) leer(e);
          }}
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

/** La cinta del cuchillo: un contorno que se afina hacia la cola, con un halo de luz alrededor. */
function cinta(ctx: CanvasRenderingContext2D, pts: Punto[], ahora: number) {
  const n = pts.length;
  const lados = (ancho: number) => {
    const izq: { x: number; y: number }[] = [];
    const der: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      // Más ancha en la punta y más finita cuanto más vieja.
      const k = (i / (n - 1)) * Math.max(0, 1 - (ahora - pts[i].t) / 200);
      const w = ancho * k;
      izq.push({ x: pts[i].x - (dy / l) * w, y: pts[i].y + (dx / l) * w });
      der.push({ x: pts[i].x + (dy / l) * w, y: pts[i].y - (dx / l) * w });
    }
    ctx.beginPath();
    ctx.moveTo(izq[0].x, izq[0].y);
    for (const p of izq) ctx.lineTo(p.x, p.y);
    for (let i = der.length - 1; i >= 0; i--) ctx.lineTo(der[i].x, der[i].y);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = "rgba(255,214,140,0.28)";
  lados(9);
  ctx.fillStyle = "rgba(255,250,240,0.95)";
  lados(3.6);
}

/** La tabla de picar: tablones de madera con vetas, el borde gastado y la luz de arriba. */
function pintarTabla(ctx: CanvasRenderingContext2D) {
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#5a3a22");
  base.addColorStop(1, "#3e2716");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const tablones = 5;
  const ancho = W / tablones;
  for (let k = 0; k < tablones; k++) {
    const x = k * ancho;
    ctx.fillStyle = k % 2 ? "rgba(0,0,0,0.06)" : "rgba(255,220,170,0.04)";
    ctx.fillRect(x, 0, ancho, H);
    // Vetas: curvas finitas a lo largo del tablón, fijas (salen de la posición, no del azar).
    ctx.strokeStyle = "rgba(30,15,5,0.18)";
    ctx.lineWidth = 1;
    for (let v = 0; v < 6; v++) {
      const vx = x + 8 + v * (ancho / 6.5);
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      for (let y = 0; y <= H; y += 30) ctx.lineTo(vx + Math.sin((y + k * 97 + v * 41) / 70) * 4, y);
      ctx.stroke();
    }
    // Un nudo en algunos tablones.
    if (k % 2 === 0) {
      const ny = 120 + ((k * 173) % (H - 240));
      ctx.strokeStyle = "rgba(30,15,5,0.25)";
      for (let r = 3; r < 14; r += 4) {
        ctx.beginPath();
        ctx.ellipse(x + ancho / 2, ny, r, r * 1.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + ancho - 1, 0, 1.5, H);
  }
  // Marcas de cuchillo de tanto uso.
  ctx.strokeStyle = "rgba(255,230,190,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const x = (i * 131) % W;
    const y = (i * 263) % H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + (i % 4) * 8, y + ((i % 3) - 1) * 14);
    ctx.stroke();
  }
  const luz = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H / 2, H * 0.75);
  luz.addColorStop(0, "rgba(255,230,180,0.12)");
  luz.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);
}
