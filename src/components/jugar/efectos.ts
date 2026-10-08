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

/**
 * Las partículas de Kenney (CC0, en public/particulas): 128 px, blancas sobre negro. Cada textura se
 * baja una vez; al cargar, el negro se vuelve transparente (el brillo pasa a ser la opacidad) y
 * después se tiñe una vez por color en un lienzo aparte, que queda guardado. Dibujar una chispa es
 * entonces un solo `drawImage`, casi tan barato como un círculo.
 */
export type Textura =
  | `spark_0${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `star_0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `smoke_0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | "smoke_10"
  | `flame_0${1 | 2 | 3 | 4 | 5 | 6}`
  | `fire_0${1 | 2}`
  | `circle_0${1 | 2 | 3 | 4 | 5}`
  | `light_0${1 | 2 | 3}`
  | `twirl_0${1 | 2 | 3}`
  | `slash_0${1 | 2 | 3 | 4}`
  | `magic_0${1 | 2 | 3 | 4 | 5}`
  | "flare_01"
  | `dirt_0${1 | 2 | 3}`
  | `trace_0${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** La textura ya pasada a blanco con transparencia (null mientras se baja o si falló). */
const mascaras = new Map<Textura, HTMLCanvasElement | null>();
const tenidas = new Map<string, HTMLCanvasElement>();
/** Con 64 px alcanza: las chispas se dibujan chicas y el borde es suave. */
const LADO_TEX = 64;

function mascara(img: HTMLImageElement): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  c.width = LADO_TEX;
  c.height = LADO_TEX;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, LADO_TEX, LADO_TEX);
  try {
    const d = ctx.getImageData(0, 0, LADO_TEX, LADO_TEX);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i + 3] = Math.max(px[i], px[i + 1], px[i + 2]);
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
    }
    ctx.putImageData(d, 0, 0);
  } catch {
    return null;
  }
  return c;
}

/** Pide las texturas de un juego antes de que hagan falta. Mientras no llegan, se dibujan como puntos. */
export function cargarTexturas(lista: Textura[]) {
  if (typeof window === "undefined") return;
  for (const t of lista) {
    if (mascaras.has(t)) continue;
    mascaras.set(t, null);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => mascaras.set(t, mascara(img));
    img.src = `/particulas/${t}.webp`;
  }
}

/** La textura teñida de un color (se arma la primera vez y queda guardada). */
function tenida(t: Textura, color: string): HTMLCanvasElement | null {
  const clave = `${t}|${color}`;
  const hecha = tenidas.get(clave);
  if (hecha) return hecha;
  const m = mascaras.get(t);
  if (!m) return null;
  const c = document.createElement("canvas");
  c.width = LADO_TEX;
  c.height = LADO_TEX;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(m, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, LADO_TEX, LADO_TEX);
  if (tenidas.size > 200) tenidas.clear();
  tenidas.set(clave, c);
  return c;
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
  /** Con textura: se dibuja el sprite teñido en vez de un círculo. */
  sprite?: Textura;
  /** Suma luz (modo 'lighter'): chispas, destellos, fuego. */
  luz?: boolean;
  /** Giro actual y velocidad de giro (radianes por segundo). */
  rot: number;
  vrot: number;
};

type Soltar = {
  color: string | string[];
  vel: number;
  r?: number;
  g?: number;
  dura?: number;
  dir?: number;
  abanico?: number;
  roce?: number;
  humo?: boolean;
  /** Sprite de Kenney (o varios: se elige uno al azar por partícula). */
  sprite?: Textura | Textura[];
  /** Que sume luz al dibujarse (chispas, estrellas, fuego). */
  luz?: boolean;
  /** Cuánto gira, en radianes por segundo (para un lado o el otro, al azar). */
  giro?: number;
  /** Ángulo fijo de salida del sprite (por ejemplo, el del tajo). */
  rot?: number;
};

const TOPE = 360;
/** Las partículas que se apagaron quedan acá para reusarlas: así no se crean objetos a cada rato. */
const reserva: Particula[] = [];

function alAzar<T>(v: T | T[]): T {
  return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
}

/** Suelta `n` partículas desde (x, y). `dir` y `abanico` (radianes) dan la dirección; sin `dir`, para todos lados. */
export function soltar(lista: Particula[], x: number, y: number, n: number, o: Soltar) {
  for (let i = 0; i < n; i++) {
    const a = o.dir == null ? Math.random() * Math.PI * 2 : o.dir + (Math.random() - 0.5) * (o.abanico ?? 1);
    const v = o.vel * (0.35 + Math.random() * 0.65);
    const dura = (o.dura ?? 0.6) * (0.6 + Math.random() * 0.6);
    const p = reserva.pop() ?? ({} as Particula);
    p.x = x;
    p.y = y;
    p.vx = Math.cos(a) * v;
    p.vy = Math.sin(a) * v;
    p.vida = dura;
    p.dura = dura;
    p.r = (o.r ?? 3) * (0.6 + Math.random() * 0.7);
    p.color = alAzar(o.color);
    p.g = o.g ?? 0;
    p.roce = o.roce ?? 1.5;
    p.humo = o.humo;
    p.sprite = o.sprite == null ? undefined : alAzar(o.sprite);
    p.luz = o.luz;
    p.rot = o.rot ?? (o.giro ? Math.random() * Math.PI * 2 : 0);
    p.vrot = o.giro ? o.giro * (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random()) : 0;
    lista.push(p);
  }
  if (lista.length > TOPE) {
    const viejas = lista.splice(0, lista.length - TOPE);
    for (const p of viejas) if (reserva.length < TOPE) reserva.push(p);
  }
}

export function moverParticulas(lista: Particula[], dt: number) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const p = lista[i];
    p.vida -= dt;
    if (p.vida <= 0) {
      // Se saca poniendo la última en su lugar: no hay que correr toda la lista.
      lista[i] = lista[lista.length - 1];
      lista.pop();
      if (reserva.length < TOPE) reserva.push(p);
      continue;
    }
    const f = Math.exp(-p.roce * dt);
    p.vx *= f;
    p.vy = p.vy * f + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.vrot) p.rot += p.vrot * dt;
  }
}

function dibujarUna(ctx: CanvasRenderingContext2D, p: Particula) {
  const k = p.vida / p.dura;
  // El humo aparece de a poco (si no, nace como una bolita blanca) y se va apagando.
  ctx.globalAlpha = p.humo ? Math.min(1, (1 - k) * 4) * k * (p.sprite ? 0.75 : 0.4) : Math.min(1, k * 1.6);
  const radio = p.humo ? p.r * (2.4 - k * 1.4) : p.r * (0.4 + k * 0.6);
  const tex = p.sprite ? tenida(p.sprite, p.color) : null;
  if (tex) {
    // La textura tiene el borde suave: se dibuja más grande para que se vea del tamaño del punto.
    const lado = radio * 4;
    if (!p.rot) ctx.drawImage(tex, p.x - lado / 2, p.y - lado / 2, lado, lado);
    else {
      const m = ctx.getTransform();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(tex, -lado / 2, -lado / 2, lado, lado);
      ctx.setTransform(m);
    }
    return;
  }
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radio, 0, Math.PI * 2);
  ctx.fill();
}

/** Dibuja todo: primero lo que tapa (humo, jugo) y encima lo que suma luz (chispas, destellos). */
export function dibujarParticulas(ctx: CanvasRenderingContext2D, lista: Particula[]) {
  let conLuz = false;
  for (const p of lista) {
    if (p.luz) conLuz = true;
    else dibujarUna(ctx, p);
  }
  if (conLuz) {
    const antes = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";
    for (const p of lista) if (p.luz) dibujarUna(ctx, p);
    ctx.globalCompositeOperation = antes;
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
