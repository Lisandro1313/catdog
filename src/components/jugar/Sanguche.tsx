"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { apilar } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar } from "./Shell";
import { Salta } from "./Salta";
import { APLASTE, HIT_STOP, TEMBLOR, aplastar, crearAplaste, crearHitStop, escalaAplaste, hitStop, pasoSimulado, vibrar, type Aplaste, type HitStop } from "./sensacion";
import { Fin } from "./Fin";
import { prepararLienzo } from "./lienzo";
import { Emoji } from "./Emoji";
import {
  cargarTexturas,
  correrTemblor,
  dibujarFlotantes,
  dibujarParticulas,
  estiloLienzo,
  flotar,
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

const BRILLO: Textura[] = ["star_01", "star_02", "spark_07"];

const W = 360;
const H = 560;
const ALTO = 24;
/** El pan de abajo: ancho y dónde está. Es también el ancho máximo al que puede volver a crecer. */
const PAN = { x: 70, ancho: 220 };
/** Dónde apoya el pan en la pantalla al empezar (el plato). */
const PISO = H - 78;
/** La capa que se mueve no pasa de esta altura de la pantalla: de ahí para arriba, sube la cámara. */
const TECHO = 210;
/** Cuánto perdona el "justo", en unidades del lienzo. */
const PERDON = 5;
/** Perfectas seguidas para que el sánguche vuelva a crecer un poco. */
const PARA_CRECER = 3;

type Tipo = "pan" | "bondiola" | "cebolla" | "queso" | "tomate" | "lechuga" | "morron" | "huevo" | "chimi";
const INGREDIENTES: { tipo: Tipo; nombre: string; color: string }[] = [
  { tipo: "bondiola", nombre: "Bondiola", color: "#8a4b2a" },
  { tipo: "lechuga", nombre: "Lechuga", color: "#6fb043" },
  { tipo: "tomate", nombre: "Tomate", color: "#d2392b" },
  { tipo: "queso", nombre: "Queso", color: "#f2c84b" },
  { tipo: "cebolla", nombre: "Cebolla", color: "#e6d3a8" },
  { tipo: "morron", nombre: "Morrón", color: "#b52a22" },
  { tipo: "huevo", nombre: "Huevo", color: "#f8f3e6" },
  { tipo: "chimi", nombre: "Chimichurri", color: "#3f6b2a" },
];
/** Notas para las perfectas seguidas: cada una más aguda, como una escalera. */
const NOTAS = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];

type Capa = { x: number; ancho: number; tipo: Tipo };
type Pedazo = { x: number; y: number; w: number; vx: number; vy: number; rot: number; vr: number; tipo: Tipo };
type Anillo = { x: number; y: number; w: number; vida: number };
type Juego = {
  pila: Capa[];
  t0: number;
  cam: number;
  pedazos: Pedazo[];
  part: Particula[];
  flot: Flotante[];
  anillos: Anillo[];
  temblor: Temblor;
  racha: number;
  cayo: boolean;
  pop: number;
  /** Hit-stop de las justas: congela la cámara y los pedazos que caen (y la capa nueva espera lo mismo). */
  hs: HitStop;
  /** El aplaste de la última capa apoyada (y uno más suave para la de abajo, que la recibe). */
  apl: Aplaste;
  aplAbajo: Aplaste;
};
type Props = { onDone: (capas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Velocidad de la capa según cuántas van: sube parejo, con techo para que siga siendo jugable. */
const velocidad = (capas: number) => Math.min(560, 185 + capas * 10.5);
const ingredienteDe = (n: number) => INGREDIENTES[(n - 1) % INGREDIENTES.length];

/**
 * Dónde está la capa que se mueve: sale del tiempo, así el toque lee exactamente lo que se ve. Va y
 * viene entre los dos bordes, y cada capa arranca del lado contrario a la anterior.
 */
function posicion(t: number, desde: number, ancho: number, n: number) {
  const min = -ancho * 0.45;
  const max = W - ancho * 0.55;
  const R = max - min;
  const d = (Math.max(0, t - desde) / 1000) * velocidad(n - 1);
  const m = d % (R * 2);
  const off = m < R ? m : R * 2 - m;
  return n % 2 ? min + off : max - off;
}

/** Arriba de qué altura de la pantalla queda la base de la capa `i` con la cámara en `cam`. */
const baseDe = (i: number, cam: number) => PISO - i * ALTO + cam;

/**
 * Armá el sánguche: arriba del pan, cada capa va y viene; tocás para soltarla. Lo que sobresale se
 * corta y se cae, y el sánguche se angosta. Si cae justo, brilla y no perdés nada; tres justas
 * seguidas y vuelve a crecer un poco. Cada capa corre un poco más rápido.
 */
export function Sanguche({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["golpe"]);
    cargarTexturas([...BRILLO, "light_02"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [capas, setCapas] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const juego = useRef<Juego | null>(null);
  const reported = useRef(false);
  /** Los setTimeout sueltos (el fin, la segunda nota): se limpian al desmontar. */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  function start() {
    keepAwake();
    reported.current = false;
    juego.current = {
      pila: [{ x: PAN.x, ancho: PAN.ancho, tipo: "pan" }],
      t0: performance.now() + 350,
      cam: 0,
      pedazos: [],
      part: [],
      flot: [],
      anillos: [],
      temblor: { f: 0 },
      racha: 0,
      cayo: false,
      pop: 1,
      hs: crearHitStop(),
      apl: crearAplaste(),
      aplAbajo: crearAplaste(),
    };
    setCapas(0);
    setPhase("play");
  }

  useEffect(() => {
    const j = juego.current;
    if (phase !== "play" || !canvas.current || !j) return;
    const ctx = prepararLienzo(canvas.current, W, H);
    if (!ctx) return;
    const quieto = pocoMovimiento();
    let raf = 0;
    let antes = performance.now();

    const paso = (t: number) => {
      const dt = Math.min(0.033, (t - antes) / 1000);
      antes = t;
      const dtSim = pasoSimulado(j.hs, dt, t);
      const n = j.pila.length;
      const top = j.pila[n - 1];

      // La cámara sube suave para que la capa nueva quede siempre a la vista.
      const objetivo = Math.max(0, TECHO - baseDe(n, 0));
      j.cam += (objetivo - j.cam) * (1 - Math.exp(-dtSim * 6));
      j.pop += (1 - j.pop) * (1 - Math.exp(-dt * 10));
      const apl = escalaAplaste(j.apl, dt);
      const aplAbajo = escalaAplaste(j.aplAbajo, dt);

      for (let i = j.pedazos.length - 1; i >= 0; i--) {
        const p = j.pedazos[i];
        p.vy += 1500 * dtSim;
        p.x += p.vx * dtSim;
        p.y += p.vy * dtSim;
        p.rot += p.vr * dtSim;
        if (p.y + j.cam > H + 200) j.pedazos.splice(i, 1);
      }
      moverParticulas(j.part, dt);

      // ---- Dibujo ----
      const sac = correrTemblor(j.temblor, dt, quieto);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      pintarFondo(ctx, j.cam);

      // El plato y la mesada, que se van quedando abajo.
      const py = PISO + j.cam;
      if (py < H + 60) {
        ctx.fillStyle = "#3b2618";
        ctx.fillRect(0, py + 18, W, H);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(W / 2 + 4, py + 16, 150, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        const plato = ctx.createLinearGradient(0, py - 8, 0, py + 22);
        plato.addColorStop(0, "#fbf7ee");
        plato.addColorStop(1, "#cfc6b4");
        ctx.fillStyle = plato;
        ctx.beginPath();
        ctx.ellipse(W / 2, py + 8, 146, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(160,140,110,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(W / 2, py + 6, 112, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // La pila: solo lo que entra en pantalla.
      j.pila.forEach((c, i) => {
        const base = baseDe(i, j.cam);
        if (base < -ALTO || base - ALTO > H + 10) return;
        // La recién apoyada se aplasta contra su base y vuelve con resorte; la de abajo acusa el golpe.
        const s = i === j.pila.length - 1 && i > 0 ? apl : i === j.pila.length - 2 ? aplAbajo : null;
        if (!s || (s.x === 1 && s.y === 1)) {
          dibujarCapa(ctx, c.x, base - ALTO, c.ancho, ALTO, c.tipo, i);
          return;
        }
        const cx = c.x + c.ancho / 2;
        ctx.save();
        ctx.translate(cx, base);
        ctx.scale(s.x, s.y);
        ctx.translate(-cx, -base);
        dibujarCapa(ctx, c.x, base - ALTO, c.ancho, ALTO, c.tipo, i);
        ctx.restore();
      });

      // La capa que viene, yendo y viniendo, con su nombre arriba.
      if (!j.cayo) {
        const ing = ingredienteDe(n);
        const x = posicion(t, j.t0, top.ancho, n);
        const base = baseDe(n, j.cam);
        // Su sombra sobre la pila: ayuda a apuntar.
        const izq = Math.max(x, top.x);
        const der = Math.min(x + top.ancho, top.x + top.ancho);
        if (der > izq) {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(izq, base, der - izq, 4);
        }
        dibujarCapa(ctx, x, base - ALTO - 6, top.ancho, ALTO, ing.tipo, n);
        ctx.fillStyle = "rgba(255,244,224,0.75)";
        ctx.font = "600 12px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(ing.nombre.toUpperCase(), limitar(x + top.ancho / 2, 50, W - 50), base - ALTO - 14);
      }

      for (const p of j.pedazos) {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + j.cam - ALTO / 2);
        ctx.rotate(p.rot);
        dibujarCapa(ctx, -p.w / 2, -ALTO / 2, p.w, ALTO, p.tipo, 0);
        ctx.restore();
      }

      // Los anillos de luz de una perfecta.
      for (let i = j.anillos.length - 1; i >= 0; i--) {
        const a = j.anillos[i];
        a.vida -= dt * 2.2;
        if (a.vida <= 0) {
          j.anillos.splice(i, 1);
          continue;
        }
        const crece = (1 - a.vida) * 18;
        const y = a.y + j.cam;
        ctx.strokeStyle = `rgba(255,236,170,${a.vida})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(a.x - crece, y - ALTO - crece * 0.6, a.w + crece * 2, ALTO + crece * 1.2, 10 + crece);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,248,220,${a.vida * 0.35})`;
        ctx.beginPath();
        ctx.roundRect(a.x, y - ALTO, a.w, ALTO, 8);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(0, j.cam);
      dibujarParticulas(ctx, j.part);
      dibujarFlotantes(ctx, j.flot, dt, W);
      ctx.restore();

      // El marcador, arriba al medio.
      ctx.save();
      ctx.translate(W / 2, 46);
      ctx.scale(j.pop, j.pop);
      ctx.fillStyle = "#fff4e0";
      ctx.font = "800 44px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n - 1), 0, 0);
      ctx.restore();
      if (j.racha >= 2) {
        ctx.fillStyle = "#ffd36e";
        ctx.font = "700 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${j.racha} justas seguidas`, W / 2, 80);
      }
      ctx.restore();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(capas);
    }
  }, [phase, capas, onDone]);

  function soltarCapa() {
    const j = juego.current;
    if (phase !== "play" || !j || j.cayo) return;
    const t = performance.now();
    if (t < j.t0) return;
    const n = j.pila.length;
    const top = j.pila[n - 1];
    const ing = ingredienteDe(n);
    const x = posicion(t, j.t0, top.ancho, n);
    const base = baseDe(n, 0);
    const r = apilar(top, { x, ancho: top.ancho }, PERDON);
    if (!r) {
      // No tocó nada: se cae entera.
      j.cayo = true;
      j.pedazos.push({ x, y: base - 6, w: top.ancho, vx: x < top.x ? -90 : 90, vy: -80, rot: 0, vr: x < top.x ? -3 : 3, tipo: ing.tipo });
      j.racha = 0;
      buzz();
      temblar(j.temblor, TEMBLOR.fuerte);
      flotar(j.flot, W / 2, base - 70, "¡Se cayó!", "#ff7a63", 30, 1.4);
      timers.current.push(setTimeout(() => setPhase("end"), 1100));
      return;
    }

    let capa: Capa = { x: r.x, ancho: r.ancho, tipo: ing.tipo };
    if (r.perfecta) {
      j.racha += 1;
      const crece = j.racha >= PARA_CRECER && capa.ancho < PAN.ancho;
      if (crece) {
        const ancho = Math.min(PAN.ancho, capa.ancho + 12);
        capa = { ...capa, x: limitar(capa.x - (ancho - capa.ancho) / 2, 0, W - ancho), ancho };
      }
      sonar("golpe", 0.4, 1.05 + Math.random() * 0.08);
      beep(NOTAS[Math.min(j.racha - 1, NOTAS.length - 1)], 120, "triangle", 0.12);
      const racha = j.racha;
      timers.current.push(setTimeout(() => beep(NOTAS[Math.min(racha, NOTAS.length - 1)] * 2, 90, "sine", 0.05), 60));
      vibrar("medio");
      aplastar(j.apl, APLASTE.fuerte);
      aplastar(j.aplAbajo, APLASTE.suave);
      // Hit-stop en la justa (más largo si además crece). La capa nueva arranca después, así no se come el tiempo.
      const ms = crece ? HIT_STOP.medio : HIT_STOP.corto;
      if (hitStop(j.hs, ms, t)) j.t0 = t + ms;
      j.anillos.push({ x: capa.x, y: base, w: capa.ancho, vida: 1 });
      soltar(j.part, capa.x + capa.ancho / 2, base - ALTO / 2, 14, { color: ["#fff2c4", "#ffd36e", "#ffffff"], vel: 220, r: 3, dura: 0.6, g: 120, sprite: BRILLO, luz: true, giro: 6 });
      // Un destello que recorre la capa justa, de punta a punta.
      for (let k = 0; k < 3; k++) soltar(j.part, capa.x + (capa.ancho * (k + 0.5)) / 3, base - ALTO / 2, 1, { color: "#fff2c4", vel: 0, r: 10, dura: 0.32, sprite: "light_02", luz: true });
      flotar(j.flot, W / 2, base - ALTO - 40, crece ? "¡Justo! Crece" : j.racha >= 2 ? `¡Justo! x${j.racha}` : "¡Justo!", "#ffd36e", 24, 0.9);
    } else {
      j.racha = 0;
      // Lo que sobresale se corta y se cae, del lado que sobró.
      if (x < top.x) j.pedazos.push({ x, y: base - 6, w: top.x - x, vx: -70, vy: -60, rot: 0, vr: -2.5 - Math.random() * 2, tipo: ing.tipo });
      if (x + top.ancho > top.x + top.ancho) j.pedazos.push({ x: top.x + top.ancho, y: base - 6, w: x - top.x, vx: 70, vy: -60, rot: 0, vr: 2.5 + Math.random() * 2, tipo: ing.tipo });
      const perdio = top.ancho - r.ancho;
      sonar("golpe", 0.45, 0.9 + Math.random() * 0.1);
      beep(420 + Math.min(n, 20) * 15, 70, "triangle", 0.06);
      vibrar("suave");
      aplastar(j.apl, APLASTE.medio);
      aplastar(j.aplAbajo, APLASTE.suave * 0.6);
      soltar(j.part, x < top.x ? top.x : top.x + top.ancho, base - ALTO / 2, 6, { color: ing.color, vel: 120, r: 2, g: 500, dura: 0.5 });
      if (perdio > top.ancho * 0.4) flotar(j.flot, W / 2, base - ALTO - 40, "¡Uh, finito!", "#f2a5a5", 18, 0.8);
    }
    j.pila = [...j.pila, capa];
    j.t0 = Math.max(j.t0, t);
    j.pop = 1.3;
    setCapas(j.pila.length - 1);
  }

  if (phase === "end") {
    return (
      <Shell title="Armá el sánguche" onBack={onBack}>
        <Fin nueva={nueva} game="sanguche" value={capas} label={`${capas} ${capas === 1 ? "capa" : "capas"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Eso es un sánguche." />
      </Shell>
    );
  }

  return (
    <Shell title="Armá el sánguche" onBack={onBack} right={phase === "play" ? <><Salta valor={capas} /> {capas === 1 ? "capa" : "capas"}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🥪" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Cada capa va y viene arriba del pan. Tocá para soltarla: lo que sobresale se corta y el sánguche se achica. Si cae justo, no perdés nada;
            tres justas seguidas y vuelve a crecer.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Poner el pan
          </button>
        </div>
      ) : (
        <canvas ref={canvas} className="jg-lienzo mt-3" style={estiloLienzo(W, H)} onPointerDown={soltarCapa} aria-label="Tocá para soltar la capa" />
      )}
    </Shell>
  );
}

/** El fondo: la cocina abajo y la noche arriba; los azulejos suben más lento que la pila (profundidad). */
function pintarFondo(ctx: CanvasRenderingContext2D, cam: number) {
  const k = Math.min(1, cam / 1400);
  const mezcla = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mezcla([46, 30, 20], [18, 22, 44]));
  g.addColorStop(1, mezcla([26, 18, 12], [34, 22, 36]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const lado = 40;
  const corre = (cam * 0.35) % lado;
  ctx.strokeStyle = "rgba(255,240,220,0.045)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = corre - lado; y < H; y += lado) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  for (let x = 0; x <= W; x += lado) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
  // La luz de arriba de la mesada.
  const luz = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, H * 0.7);
  luz.addColorStop(0, "rgba(255,220,160,0.10)");
  luz.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Una capa del sánguche, con su dibujo: el pan con miga, la bondiola con marcas de parrilla, la
 * lechuga ondulada, el tomate en rodajas, el queso que chorrea... `s` varía el dibujo entre capas.
 */
function dibujarCapa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tipo: Tipo, s: number) {
  if (w <= 0.5) return;
  const r = Math.min(8, w / 2, h / 2);
  // Sombra hacia abajo
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + 2, y + h - 2, w - 2, 4);

  const forma = () => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const degradado = (a: string, b: string) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  };
  const dentro = (pintar: () => void) => {
    ctx.save();
    forma();
    ctx.clip();
    pintar();
    ctx.restore();
  };
  const puntos = (cada: number, fn: (px: number, k: number) => void) => {
    const desde = Math.ceil(x / cada) * cada;
    for (let px = desde; px < x + w; px += cada) fn(px, Math.abs(Math.round(px / cada) + s) % 7);
  };

  switch (tipo) {
    case "pan": {
      ctx.fillStyle = degradado("#f0c27a", "#a8652c");
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, [r, r, Math.min(14, w / 2), Math.min(14, w / 2)]);
      ctx.fill();
      dentro(() => {
        ctx.fillStyle = "rgba(255,240,200,0.35)";
        ctx.fillRect(x, y, w, 5);
        ctx.fillStyle = "rgba(120,70,30,0.35)";
        puntos(9, (px, k) => {
          ctx.beginPath();
          ctx.arc(px, y + 9 + (k % 3) * 3, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      return;
    }
    case "bondiola": {
      ctx.fillStyle = degradado("#a8613a", "#5e2f18");
      forma();
      ctx.fill();
      dentro(() => {
        ctx.strokeStyle = "rgba(255,225,200,0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.45);
        for (let px = x; px <= x + w; px += 12) ctx.lineTo(px, y + h * 0.45 + Math.sin(px / 9 + s) * 3);
        ctx.stroke();
        ctx.strokeStyle = "rgba(25,10,4,0.55)";
        ctx.lineWidth = 3;
        puntos(16, (px) => {
          ctx.beginPath();
          ctx.moveTo(px, y);
          ctx.lineTo(px + 8, y + h);
          ctx.stroke();
        });
      });
      return;
    }
    case "lechuga": {
      // Bordes ondulados que se salen un poco.
      ctx.fillStyle = degradado("#9ad25e", "#4d8a2c");
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.5);
      for (let px = x; px <= x + w; px += 8) ctx.quadraticCurveTo(px + 4, y - 4, Math.min(x + w, px + 8), y + 2);
      ctx.lineTo(x + w, y + h - 2);
      for (let px = x + w; px >= x; px -= 8) ctx.quadraticCurveTo(px - 4, y + h + 4, Math.max(x, px - 8), y + h - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(220,255,190,0.45)";
      ctx.lineWidth = 1;
      puntos(18, (px, k) => {
        ctx.beginPath();
        ctx.moveTo(px, y + h * 0.5);
        ctx.lineTo(px + 7, y + 3 + (k % 2) * 3);
        ctx.moveTo(px, y + h * 0.5);
        ctx.lineTo(px + 7, y + h - 4);
        ctx.stroke();
      });
      return;
    }
    case "tomate": {
      dentro(() => {
        ctx.fillStyle = "#8f1d14";
        ctx.fillRect(x, y, w, h);
        puntos(26, (px) => {
          const g = ctx.createRadialGradient(px + 13, y + h / 2, 2, px + 13, y + h / 2, 15);
          g.addColorStop(0, "#ff6a52");
          g.addColorStop(1, "#c8301f");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(px + 13, y + h / 2, 13.5, h / 2 + 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffd9a8";
          for (const d of [-5, 0, 5]) {
            ctx.beginPath();
            ctx.ellipse(px + 13 + d, y + h / 2 + (d === 0 ? -3 : 2), 1.6, 2.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      return;
    }
    case "queso": {
      ctx.fillStyle = degradado("#ffe07a", "#e3a92b");
      forma();
      ctx.fill();
      // Lo que chorrea por abajo.
      puntos(34, (px, k) => {
        if (k % 2) return;
        const largo = 6 + (k % 3) * 3;
        ctx.beginPath();
        ctx.moveTo(px - 6, y + h - 2);
        ctx.quadraticCurveTo(px - 4, y + h + largo, px, y + h + largo);
        ctx.quadraticCurveTo(px + 4, y + h + largo, px + 6, y + h - 2);
        ctx.fill();
      });
      dentro(() => {
        ctx.fillStyle = "rgba(170,110,20,0.35)";
        puntos(22, (px, k) => {
          ctx.beginPath();
          ctx.ellipse(px + 8, y + 7 + (k % 3) * 4, 3 + (k % 2), 2.4, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      return;
    }
    case "cebolla": {
      ctx.fillStyle = degradado("rgba(245,232,200,0.95)", "rgba(205,180,140,0.95)");
      forma();
      ctx.fill();
      dentro(() => {
        ctx.strokeStyle = "rgba(170,120,170,0.45)";
        ctx.lineWidth = 1.5;
        puntos(20, (px) => {
          for (const rr of [5, 9]) {
            ctx.beginPath();
            ctx.arc(px + 10, y + h, rr, Math.PI, Math.PI * 2);
            ctx.stroke();
          }
        });
      });
      return;
    }
    case "morron": {
      dentro(() => {
        puntos(14, (px, k) => {
          ctx.fillStyle = k % 2 ? "#c9322a" : "#a52119";
          ctx.fillRect(px, y, 14, h);
        });
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(x, y + 4, w, 3);
      });
      return;
    }
    case "huevo": {
      ctx.fillStyle = degradado("#ffffff", "#e7dfcc");
      forma();
      ctx.fill();
      if (w > 26) {
        const cx = x + w / 2;
        const g = ctx.createRadialGradient(cx - 3, y + h / 2 - 3, 1, cx, y + h / 2, 11);
        g.addColorStop(0, "#ffd75a");
        g.addColorStop(1, "#ec9a12");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, y + h / 2, Math.min(15, w / 3), h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "chimi": {
      ctx.fillStyle = degradado("#5a8f3a", "#2f5420");
      forma();
      ctx.fill();
      dentro(() => {
        puntos(7, (px, k) => {
          ctx.fillStyle = k % 3 === 0 ? "#d8432c" : "#a9d36a";
          ctx.fillRect(px, y + 4 + ((k * 5) % (h - 8)), 2.2, 2.2);
        });
      });
      return;
    }
  }
}
