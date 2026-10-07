"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { puntosDelVaso } from "@/lib/juegos-reglas";
import { Shell, beep, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";
import { Emoji } from "./Emoji";

const W = 360;
const H = 600;
const TIROS = 5;

/*
 * La barra se ve en perspectiva: el vaso sale de cerca (abajo) y se aleja (arriba). La física se hace
 * en "unidades de barra" (s, de 0 al largo) y recién al dibujar se pasa a la pantalla.
 */
const LARGO = 470;
/** Dónde apoya el vaso al salir y dónde termina la barra, en la pantalla. */
const Y0 = 508;
const Y_FIN = 86;
/** Distancia de la cámara: cuánto se achica lo que está lejos. */
const D = 560;
const K = D / (D + LARGO);
const VP = (Y_FIN - Y0 * K) / (1 - K);
const esc = (s: number) => D / (D + s);
const yDe = (s: number) => VP + (Y0 - VP) * esc(s);
const sDeY = (y: number) => (D * (Y0 - VP)) / (y - VP) - D;
/** Medio ancho de la barra, de cerca. */
const MEDIO = 128;
/** Hasta dónde lo acompaña la mano: de ahí en más, sigue solo. */
const ZONA = 80;
/** Cuánto frena la madera (desaceleración constante, como un vaso de verdad), en unidades/s². */
const ROCE = 750;
const VMAX = 1900;

type Fase = "listo" | "agarrado" | "anda" | "cae" | "quieto";
type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Dónde queda el posavasos en cada tiro: cada vez en otro lado, cada vez un poco más lejos. */
const azarBlanco = (tiro: number) => Math.min(0.92, 0.5 + tiro * 0.07 + Math.random() * 0.16);
const reloj = () => performance.now();

function calificar(pts: number): { texto: string; color: string } {
  if (pts >= 95) return { texto: "¡Clavado!", color: "#ffe7a8" };
  if (pts >= 80) return { texto: "¡Muy bien!", color: "#e0c283" };
  if (pts >= 55) return { texto: "Bien", color: "#d8c7a6" };
  if (pts > 0) return { texto: "Cerca", color: "#bfb3a2" };
  return { texto: "Lejos", color: "#9a9187" };
}

/**
 * Deslizá el vaso: como en la barra de un bar de película. Lo agarrás, lo empujás para arriba y lo
 * soltás: sigue solo y frena con el roce de la madera. Tiene que quedar arriba del posavasos; si se
 * pasa del final de la barra, se cae. Cinco tiros, el posavasos cambia de lugar en cada uno.
 */
export function Vaso({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["vidrio", "brindis", "vidrio-roto", "madera"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [puntos, setPuntos] = useState<number[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vaso = useRef<{ s: number; v: number; fase: Fase; caida: number; aparece: number }>({ s: 0, v: 0, fase: "listo", caida: 0, aparece: 1 });
  const blanco = useRef({ desde: 0.6, hasta: 0.6, t: 1 });
  const agarre = useRef<{ dedo0: number; vaso0: number; muestras: { s: number; t: number }[] } | null>(null);
  const reported = useRef(false);
  const tirosRef = useRef<number[]>([]);

  function start() {
    keepAwake();
    reported.current = false;
    tirosRef.current = [];
    setPuntos([]);
    vaso.current = { s: 0, v: 0, fase: "listo", caida: 0, aparece: 0 };
    const b = azarBlanco(0);
    blanco.current = { desde: b, hasta: b, t: 1 };
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    if (!ctx) return;
    const serif = getComputedStyle(cv).getPropertyValue("--font-playfair").trim() || "Georgia";
    let raf = 0;
    let antes = performance.now();
    let rumor = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const despues = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // Lo fijo del dibujo: vetas de la madera, botellas del fondo. Se sortea una vez.
    const vetas = Array.from({ length: 70 }, () => ({ x: -MEDIO + Math.random() * MEDIO * 2, s0: -70 + Math.random() * LARGO, largo: 20 + Math.random() * 70, a: 0.05 + Math.random() * 0.08 }));
    const tonos = ["#3d6b3a", "#7a3b1e", "#c9a96e", "#6e2a2a", "#2d4f5c", "#8a6b2a"];
    const botellas = Array.from({ length: 13 }, (_, i) => ({ x: 14 + i * 26 + Math.random() * 8, alto: 26 + Math.random() * 18, ancho: 8 + Math.random() * 4, color: tonos[Math.floor(Math.random() * tonos.length)] }));
    const marcasMojadas: number[] = [];
    let flotante: { texto: string; sub: string; color: string; s: number; t0: number } | null = null;
    let chispas: { x: number; y: number; vx: number; vy: number; vida: number }[] = [];

    const terminarTiro = (pts: number, texto: string, color: string) => {
      tirosRef.current = [...tirosRef.current, pts];
      setPuntos(tirosRef.current);
      flotante = { texto, sub: pts > 0 ? `+${pts}` : "", color, s: vaso.current.s, t0: performance.now() };
      despues(1500, () => {
        if (tirosRef.current.length >= TIROS) {
          setPhase("end");
          return;
        }
        if (vaso.current.fase === "quieto") marcasMojadas.push(vaso.current.s);
        flotante = null;
        vaso.current = { s: 0, v: 0, fase: "listo", caida: 0, aparece: 0 };
        const b = blanco.current;
        blanco.current = { desde: b.hasta, hasta: azarBlanco(tirosRef.current.length), t: 0 };
        sonar("vidrio", 0.2, 1.1);
      });
    };

    const dibujarVaso = (x: number, base: number, k: number, alfa: number, giro: number, ahora: number, conSombra: boolean) => {
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(x, base);
      ctx.rotate(giro);
      ctx.scale(k, k);
      if (conSombra) {
        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.beginPath();
        ctx.ellipse(3, 1, 20, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const top = -68;
      const cuerpo = new Path2D();
      cuerpo.moveTo(-13, 0);
      cuerpo.lineTo(13, 0);
      cuerpo.lineTo(18, top);
      cuerpo.lineTo(-18, top);
      cuerpo.closePath();
      // La cerveza
      ctx.save();
      ctx.clip(cuerpo);
      const birra = ctx.createLinearGradient(-18, 0, 18, 0);
      birra.addColorStop(0, "#b8620e");
      birra.addColorStop(0.45, "#f5b443");
      birra.addColorStop(1, "#b8620e");
      ctx.fillStyle = birra;
      ctx.fillRect(-20, -54, 40, 50);
      // Burbujas que suben
      ctx.fillStyle = "rgba(255,240,200,0.55)";
      for (let i = 0; i < 6; i++) {
        const fase = ((ahora / 1000) * (0.5 + i * 0.13) + i * 0.37) % 1;
        ctx.beginPath();
        ctx.arc(-9 + i * 3.6, -6 - fase * 46, 0.9 + (i % 2) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // La espuma
      ctx.fillStyle = "#fff6e6";
      ctx.fillRect(-20, -64, 40, 11);
      ctx.fillStyle = "rgba(220,200,170,0.5)";
      ctx.fillRect(-20, -54, 40, 1.5);
      // El fondo grueso del vaso
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(-14, -4, 28, 4);
      ctx.restore();
      ctx.fillStyle = "#fff6e6";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-14 + i * 7, top + 3, 5, Math.PI, 0);
        ctx.fill();
      }
      // El vidrio
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.4;
      ctx.stroke(cuerpo);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-11, -9);
      ctx.lineTo(-14.5, -50);
      ctx.stroke();
      ctx.restore();
    };

    const paso = (ahora: number) => {
      const dt = Math.min(0.033, (ahora - antes) / 1000);
      antes = ahora;
      const g = vaso.current;
      const b = blanco.current;
      if (b.t < 1) b.t = Math.min(1, b.t + dt * 2.5);
      const bFrac = b.desde + (b.hasta - b.desde) * (1 - (1 - b.t) ** 3);
      if (g.aparece < 1) g.aparece = Math.min(1, g.aparece + dt * 4);

      // Física: roce constante de la madera hasta frenar o caerse.
      if (g.fase === "anda") {
        g.s += g.v * dt;
        g.v -= ROCE * dt;
        rumor -= dt;
        if (rumor <= 0 && g.v > 120) {
          rumor = 0.085;
          beep(70 + g.v * 0.06, 70, "sawtooth", Math.min(0.025, g.v / 40000));
        }
        if (g.s > LARGO) {
          g.fase = "cae";
          g.caida = 0;
          despues(280, () => {
            sonar("vidrio-roto", 0.6, 0.95 + Math.random() * 0.1);
            tap(45);
          });
          terminarTiro(0, "¡Se cayó!", "#e07a5f");
        } else if (g.v <= 0) {
          g.v = 0;
          g.fase = "quieto";
          const pts = puntosDelVaso(g.s / LARGO, b.hasta);
          sonar("madera", 0.3, 0.9);
          if (pts >= 95) {
            despues(120, () => sonar("brindis", 0.55));
            tap(25);
            const y = yDe(g.s) - 30 * esc(g.s);
            chispas = Array.from({ length: 26 }, (_, i) => {
              const ang = (i / 26) * Math.PI * 2;
              const vel = 60 + Math.random() * 90;
              return { x: W / 2, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 40, vida: 1 };
            });
          } else if (pts > 0) despues(110, () => beep(420 + pts * 4, 140, "triangle"));
          else despues(110, () => beep(170, 220, "triangle"));
          const c = calificar(pts);
          terminarTiro(pts, c.texto, c.color);
        }
      } else if (g.fase === "cae") {
        g.caida = Math.min(1, g.caida + dt * 2.4);
        g.s += Math.max(0, g.v) * dt * 0.4;
      }

      // --- Fondo: la pared de atrás con botellas, y el piso a los costados
      const pared = ctx.createLinearGradient(0, 0, 0, Y_FIN);
      pared.addColorStop(0, "#1a120c");
      pared.addColorStop(1, "#2b1c12");
      ctx.fillStyle = pared;
      ctx.fillRect(0, 0, W, Y_FIN);
      const luz = ctx.createRadialGradient(W / 2, 20, 4, W / 2, 20, 190);
      luz.addColorStop(0, "rgba(255,190,110,0.22)");
      luz.addColorStop(1, "rgba(255,190,110,0)");
      ctx.fillStyle = luz;
      ctx.fillRect(0, 0, W, Y_FIN);
      for (const bo of botellas) {
        const pie = 64;
        ctx.fillStyle = bo.color;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(bo.x - bo.ancho / 2, pie - bo.alto * 0.62, bo.ancho, bo.alto * 0.62);
        ctx.fillRect(bo.x - 1.6, pie - bo.alto, 3.2, bo.alto * 0.4);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#fff";
        ctx.fillRect(bo.x - bo.ancho / 2 + 1.5, pie - bo.alto * 0.55, 1.4, bo.alto * 0.4);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(0, 64, W, 4);
      ctx.fillStyle = "#0f0b08";
      ctx.fillRect(0, Y_FIN, W, H - Y_FIN);

      // --- La barra de madera, en perspectiva
      const sCerca = -80;
      const barra = new Path2D();
      barra.moveTo(W / 2 - MEDIO * esc(sCerca), yDe(sCerca));
      barra.lineTo(W / 2 + MEDIO * esc(sCerca), yDe(sCerca));
      barra.lineTo(W / 2 + MEDIO * esc(LARGO), Y_FIN);
      barra.lineTo(W / 2 - MEDIO * esc(LARGO), Y_FIN);
      barra.closePath();
      // El canto de la barra, un poco más oscuro y más ancho que la tapa
      ctx.fillStyle = "#2a170c";
      ctx.beginPath();
      ctx.moveTo(W / 2 - (MEDIO + 12) * esc(sCerca), yDe(sCerca));
      ctx.lineTo(W / 2 + (MEDIO + 12) * esc(sCerca), yDe(sCerca));
      ctx.lineTo(W / 2 + (MEDIO + 12) * esc(LARGO), Y_FIN + 6);
      ctx.lineTo(W / 2 - (MEDIO + 12) * esc(LARGO), Y_FIN + 6);
      ctx.closePath();
      ctx.fill();
      const madera = ctx.createLinearGradient(0, Y_FIN, 0, H);
      madera.addColorStop(0, "#4b2b16");
      madera.addColorStop(0.55, "#7a4826");
      madera.addColorStop(1, "#91582f");
      ctx.fillStyle = madera;
      ctx.fill(barra);
      ctx.save();
      ctx.clip(barra);
      // Tablones
      ctx.strokeStyle = "rgba(20,10,4,0.45)";
      ctx.lineWidth = 1;
      for (let x = -MEDIO + 2 * MEDIO / 5; x < MEDIO - 1; x += (2 * MEDIO) / 5) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + x * esc(sCerca), yDe(sCerca));
        ctx.lineTo(W / 2 + x * esc(LARGO), Y_FIN);
        ctx.stroke();
      }
      // Vetas
      for (const v of vetas) {
        ctx.strokeStyle = `rgba(30,14,5,${v.a})`;
        ctx.lineWidth = 1.2 * esc(v.s0);
        ctx.beginPath();
        ctx.moveTo(W / 2 + v.x * esc(v.s0), yDe(v.s0));
        ctx.lineTo(W / 2 + v.x * esc(v.s0 + v.largo), yDe(v.s0 + v.largo));
        ctx.stroke();
      }
      // El brillo del barniz, con la lámpara del techo
      const brillo = ctx.createRadialGradient(W / 2 + 30, yDe(LARGO * 0.5), 10, W / 2 + 30, yDe(LARGO * 0.5), 220);
      brillo.addColorStop(0, "rgba(255,225,170,0.16)");
      brillo.addColorStop(1, "rgba(255,225,170,0)");
      ctx.fillStyle = brillo;
      ctx.fillRect(0, Y_FIN, W, H);
      // Hasta dónde se empuja con la mano
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(255,244,224,0.13)";
      ctx.beginPath();
      ctx.moveTo(W / 2 - MEDIO * esc(ZONA), yDe(ZONA));
      ctx.lineTo(W / 2 + MEDIO * esc(ZONA), yDe(ZONA));
      ctx.stroke();
      ctx.setLineDash([]);
      // Las marcas mojadas de los tiros anteriores
      for (const m of marcasMojadas) {
        const k = esc(m);
        ctx.strokeStyle = "rgba(255,225,170,0.14)";
        ctx.lineWidth = 1.5 * k;
        ctx.beginPath();
        ctx.ellipse(W / 2, yDe(m), 15 * k, 15 * k * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // El borde del fondo: un riel de bronce. De ahí para allá, se cae.
      ctx.strokeStyle = "#d9b877";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - MEDIO * esc(LARGO), Y_FIN);
      ctx.lineTo(W / 2 + MEDIO * esc(LARGO), Y_FIN);
      ctx.stroke();

      // --- El posavasos
      const sb = bFrac * LARGO;
      const kb = esc(sb);
      const by = yDe(sb);
      const rx = 36 * kb;
      const ry = rx * 0.42;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(W / 2 + 2, by + 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b48552";
      ctx.beginPath();
      ctx.ellipse(W / 2, by, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7a5230";
      ctx.lineWidth = 1.5 * kb;
      ctx.beginPath();
      ctx.ellipse(W / 2, by, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#f0d391";
      ctx.lineWidth = 1.6 * kb;
      ctx.beginPath();
      ctx.ellipse(W / 2, by, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f0d391";
      ctx.beginPath();
      ctx.ellipse(W / 2, by, rx * 0.22, ry * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- El vaso
      const k = esc(g.s) * 0.95;
      const base = yDe(g.s);
      const rapidez = g.fase === "anda" ? Math.min(1, g.v / 700) : 0;
      const tiembla = Math.sin(ahora / 22) * 1.2 * rapidez;
      if (g.fase === "cae") {
        // Se va por detrás del borde: se dibuja recortado a lo que queda arriba del riel.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, Y_FIN);
        ctx.clip();
        dibujarVaso(W / 2, base + g.caida * 70 * k, k, 1 - g.caida * 0.4, g.caida * 0.9, ahora, false);
        ctx.restore();
      } else {
        if (rapidez > 0.3) {
          // Estela: dos fantasmas atrás, para que se sienta la velocidad.
          for (let i = 2; i >= 1; i--) {
            const sf = Math.max(0, g.s - g.v * 0.018 * i);
            dibujarVaso(W / 2, yDe(sf), esc(sf) * 0.95, 0.12 * rapidez, 0, ahora, false);
          }
        }
        const sube = (1 - g.aparece) * 18;
        const agarrado = g.fase === "agarrado";
        dibujarVaso(W / 2 + tiembla, base + sube, k * (agarrado ? 1.03 : 1), g.aparece, tiembla * 0.01, ahora, true);
      }

      // --- Ayuda para el primer tiro: flechas que suben
      if (g.fase === "listo" && g.aparece >= 1) {
        const ciclo = (ahora / 900) % 1;
        ctx.strokeStyle = `rgba(224,194,131,${0.65 * (1 - ciclo)})`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        for (let i = 0; i < 2; i++) {
          const y = base - 96 - ciclo * 26 - i * 14;
          ctx.beginPath();
          ctx.moveTo(W / 2 - 10, y + 8);
          ctx.lineTo(W / 2, y);
          ctx.lineTo(W / 2 + 10, y + 8);
          ctx.stroke();
        }
        if (tirosRef.current.length === 0) {
          ctx.fillStyle = "rgba(255,244,224,0.8)";
          ctx.font = "600 14px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText("Agarralo, empujá y soltá", W / 2, H - 30);
        }
      }

      // --- Chispas del tiro perfecto
      if (chispas.length) {
        chispas = chispas.filter((c) => c.vida > 0);
        ctx.fillStyle = "#ffe7a8";
        for (const c of chispas) {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.vy += 160 * dt;
          c.vida -= dt * 1.3;
          ctx.globalAlpha = Math.max(0, c.vida);
          ctx.beginPath();
          ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // --- El resultado del tiro, que sube desde el vaso
      if (flotante) {
        const t = (ahora - flotante.t0) / 1000;
        const pop = t < 0.18 ? 0.6 + (t / 0.18) * 0.55 : Math.max(1, 1.15 - (t - 0.18) * 1.2);
        const alfa = Math.min(1, t * 6) * (t > 1.2 ? Math.max(0, 1 - (t - 1.2) * 4) : 1);
        const y = Math.max(54, yDe(Math.min(flotante.s, LARGO)) - 92 * esc(flotante.s)) - t * 14;
        ctx.save();
        ctx.globalAlpha = alfa;
        ctx.translate(W / 2, y);
        ctx.scale(pop, pop);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = flotante.color;
        ctx.font = `700 30px ${serif}`;
        ctx.fillText(flotante.texto, 0, 0);
        if (flotante.sub) {
          ctx.font = "700 18px system-ui, sans-serif";
          ctx.fillStyle = "#fff4e0";
          ctx.fillText(flotante.sub, 0, 28);
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [phase]);

  const total = puntos.reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(total);
    }
  }, [phase, total, onDone]);

  function agarrar(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = vaso.current;
    if (g.fase !== "listo" || g.aparece < 1) return;
    capturar(e);
    const y = puntoEnLienzo(e, e.currentTarget, W, H).y;
    agarre.current = { dedo0: sDeY(y), vaso0: g.s, muestras: [{ s: g.s, t: reloj() }] };
    g.fase = "agarrado";
    tap(6);
  }

  function arrastrar(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = vaso.current;
    const a = agarre.current;
    if (g.fase !== "agarrado" || !a) return;
    const y = puntoEnLienzo(e, e.currentTarget, W, H).y;
    g.s = Math.max(0, Math.min(ZONA, a.vaso0 + sDeY(y) - a.dedo0));
    a.muestras = [...a.muestras.slice(-10), { s: g.s, t: reloj() }];
    // Llegó al final de lo que acompaña la mano: sale con la velocidad que traía.
    if (g.s >= ZONA) soltar();
  }

  function soltar() {
    const g = vaso.current;
    const a = agarre.current;
    agarre.current = null;
    if (g.fase !== "agarrado" || !a) return;
    // La velocidad del empujón: lo que avanzó el vaso en el último instante.
    const ahora = reloj();
    const m = a.muestras;
    const recientes = m.filter((q) => ahora - q.t < 80);
    const desde = recientes.length >= 2 ? recientes[0] : (m[m.length - 2] ?? m[0]);
    const hasta = m[m.length - 1];
    const dt = Math.max(0.016, (hasta.t - desde.t) / 1000);
    const quieto = ahora - hasta.t > 120;
    const v = quieto ? 0 : Math.min(VMAX, (hasta.s - desde.s) / dt);
    if (v < 50) {
      // Lo soltó sin empujar: queda donde está, listo para otro intento.
      g.fase = "listo";
      return;
    }
    g.v = v;
    g.fase = "anda";
    sonar("madera", 0.35 + Math.min(0.25, v / 4000), 1.05);
    tap(8);
  }

  if (phase === "end") {
    return (
      <Shell title="Deslizá el vaso" onBack={onBack}>
        <Fin nueva={nueva} game="vaso" value={total} label={`${total} de 500`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Barra de película." />
      </Shell>
    );
  }

  return (
    <Shell title="Deslizá el vaso" onBack={onBack} right={phase === "play" ? <>{total} pts</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🍺" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Agarrá el vaso, empujalo para arriba y soltalo: sigue solo por la barra hasta que frena. Tiene que quedar arriba del posavasos. Si se
            pasa del final, se cae. Cinco tiros.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Servir el primero
          </button>
        </div>
      ) : (
        <>
          <ol className="mt-3 flex justify-center gap-1.5" aria-label="Tiros">
            {Array.from({ length: TIROS }, (_, i) => {
              const p = puntos[i];
              const actual = i === puntos.length;
              return (
                <li
                  key={i}
                  className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
                    p == null
                      ? actual
                        ? "border-accent/70 text-accent"
                        : "border-line text-muted"
                      : p >= 95
                        ? "border-transparent bg-accent text-bg"
                        : p > 0
                          ? "border-transparent bg-surface-2 text-ink"
                          : "border-transparent bg-surface-2 text-muted"
                  }`}
                >
                  {p == null ? actual ? <Emoji e="🍺" size="1.5em" /> : i + 1 : p}
                </li>
              );
            })}
          </ol>
          <canvas
            ref={canvas}
            className="jg-lienzo mt-3"
            // El ancho sale del alto disponible: si no, en un celular bajo el max-height aplastaba el dibujo.
            style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, calc(70dvh * ${W / H}))`, cursor: "grab" }}
            aria-label="La barra: arrastrá el vaso para arriba y soltalo"
            onPointerDown={agarrar}
            onPointerMove={arrastrar}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          />
        </>
      )}
    </Shell>
  );
}
