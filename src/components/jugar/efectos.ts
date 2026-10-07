/**
 * Efectos comunes de los juegos de lienzo (ping pong, fruta, parrilla, sánguche): chispas, textos que
 * saltan, temblor de pantalla y el fondo pintado una sola vez. Todo se llama desde el cuadro de
 * animación o desde un toque, nunca al dibujar con React.
 */
import type { CSSProperties } from "react";

/**
 * El lienzo ocupa el ancho, pero sin pasarse del 72% del alto de la pantalla (lo pide `.jg-lienzo`).
 * Achicando el ancho en vez de dejar que el alto se aplaste, el dibujo no se deforma en pantallas bajas.
 */
export function estiloLienzo(W: number, H: number): CSSProperties {
  return { aspectRatio: `${W} / ${H}`, width: `min(100%, calc(72dvh * ${(W / H).toFixed(4)}))` };
}

/**
 * Un fondo que no cambia (la mesa, la tabla, la parrilla) se pinta una vez en un lienzo aparte y se
 * copia entero en cada cuadro: es mucho más barato que redibujar gradientes y vetas 60 veces por segundo.
 */
export function fondoFijo(principal: HTMLCanvasElement, W: number, H: number, pintar: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = principal.width;
  c.height = principal.height;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.setTransform(principal.width / W, 0, 0, principal.height / H, 0, 0);
    pintar(ctx);
  }
  return c;
}

/** Si la persona pidió menos movimiento, no se sacude la pantalla. */
export function pocoMovimiento(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  dura: number;
  r: number;
  color: string;
  /** Gravedad propia: el jugo cae, el humo sube (negativa). */
  g: number;
  /** Cuánto la frena el aire por segundo. */
  roce: number;
  /** 0: punto que se achica; 1: humo que crece. */
  humo?: boolean;
};

type Soltar = { color: string | string[]; vel: number; r?: number; g?: number; dura?: number; dir?: number; abanico?: number; roce?: number; humo?: boolean };

const TOPE = 360;

/** Suelta `n` partículas desde (x, y). `dir` y `abanico` (radianes) dan la dirección; sin `dir`, para todos lados. */
export function soltar(lista: Particula[], x: number, y: number, n: number, o: Soltar) {
  for (let i = 0; i < n; i++) {
    const a = o.dir == null ? Math.random() * Math.PI * 2 : o.dir + (Math.random() - 0.5) * (o.abanico ?? 1);
    const v = o.vel * (0.35 + Math.random() * 0.65);
    const dura = (o.dura ?? 0.6) * (0.6 + Math.random() * 0.6);
    lista.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vida: dura,
      dura,
      r: (o.r ?? 3) * (0.6 + Math.random() * 0.7),
      color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : o.color,
      g: o.g ?? 0,
      roce: o.roce ?? 1.5,
      humo: o.humo,
    });
  }
  if (lista.length > TOPE) lista.splice(0, lista.length - TOPE);
}

export function moverParticulas(lista: Particula[], dt: number) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const p = lista[i];
    p.vida -= dt;
    if (p.vida <= 0) {
      lista.splice(i, 1);
      continue;
    }
    const f = Math.exp(-p.roce * dt);
    p.vx *= f;
    p.vy = p.vy * f + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function dibujarParticulas(ctx: CanvasRenderingContext2D, lista: Particula[]) {
  for (const p of lista) {
    const k = p.vida / p.dura;
    // El humo aparece de a poco (si no, nace como una bolita blanca) y se va apagando.
    ctx.globalAlpha = p.humo ? Math.min(1, (1 - k) * 4) * k * 0.4 : Math.min(1, k * 1.6);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.humo ? p.r * (2.4 - k * 1.4) : p.r * (0.4 + k * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export type Flotante = { x: number; y: number; texto: string; color: string; vida: number; dura: number; tam: number };

/** Un cartel que salta, sube y se desvanece: "+3", "¡Combo x3!", "¡Perfecto!". */
export function flotar(lista: Flotante[], x: number, y: number, texto: string, color: string, tam = 20, dura = 0.9) {
  lista.push({ x, y, texto, color, vida: dura, dura, tam });
  if (lista.length > 12) lista.shift();
}

export function dibujarFlotantes(ctx: CanvasRenderingContext2D, lista: Flotante[], dt: number, W: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  for (let i = lista.length - 1; i >= 0; i--) {
    const f = lista[i];
    f.vida -= dt;
    if (f.vida <= 0) {
      lista.splice(i, 1);
      continue;
    }
    const pasado = f.dura - f.vida;
    // Entra con un golpe (crece de más y vuelve) y se va subiendo y apagando.
    const s = pasado < 0.14 ? 0.4 + (pasado / 0.14) * 0.8 : pasado < 0.24 ? 1.2 - ((pasado - 0.14) / 0.1) * 0.2 : 1;
    const y = f.y - pasado * 34;
    ctx.globalAlpha = Math.min(1, (f.vida / f.dura) * 2.5);
    ctx.font = `800 ${Math.round(f.tam * s)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const x = Math.max(f.tam * 2, Math.min(W - f.tam * 2, f.x));
    ctx.lineWidth = Math.max(3, f.tam * 0.22);
    ctx.strokeStyle = "rgba(15,10,6,0.7)";
    ctx.strokeText(f.texto, x, y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.texto, x, y);
  }
  ctx.globalAlpha = 1;
}

/** Temblor de pantalla: se carga con un golpe y se apaga solo. */
export type Temblor = { f: number };

export function temblar(t: Temblor, fuerza: number) {
  t.f = Math.max(t.f, fuerza);
}

/** Devuelve cuánto correr el dibujo en este cuadro y apaga el temblor de a poco. */
export function correrTemblor(t: Temblor, dt: number, quieto: boolean): { x: number; y: number } {
  if (t.f < 0.2 || quieto) {
    t.f = 0;
    return { x: 0, y: 0 };
  }
  const out = { x: (Math.random() - 0.5) * t.f * 2, y: (Math.random() - 0.5) * t.f * 2 };
  t.f *= Math.exp(-dt * 14);
  return out;
}

export const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
