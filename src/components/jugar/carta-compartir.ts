"use client";

import { urlEmoji } from "@/lib/emoji-3d";
import { DESTAQUE_LABEL, INSTAGRAM, LEMA, linkVisible, type Destaque } from "@/lib/compartir";

/**
 * La imagen para la historia de Instagram (1080 × 1920), dibujada en el teléfono con canvas.
 *
 * Se arma en el cliente y no en el servidor porque los emojis 3D son webp (el generador de imágenes
 * del servidor no los lee) y porque así no depende de la señal: el bar no siempre tiene buena.
 * Antes de dibujar se espera a que estén las letras de la casa y el emoji; si algo tarda o falla,
 * sale igual con las letras del sistema y el emoji del teléfono.
 *
 * Los ~420 px de abajo quedan libres: ahí va el sticker de link que se pone en Instagram.
 */

export const ANCHO = 1080;
export const ALTO = 1920;
/** Lo que queda libre abajo para el sticker de link. */
export const FRANJA_LIBRE = 420;
const FIN_CONTENIDO = ALTO - FRANJA_LIBRE;

export type CartaJuego = { tipo: "juego"; icon: string; title: string; label: string; destaque: Destaque };
export type CartaNovela = { tipo: "novela"; titulo: string; conQuien: string | null; logrados: number; total: number; verdadero: boolean; temporada: 1 | 2 };
export type Carta = CartaJuego | CartaNovela;

/** Las familias de letra, tal como las declara next/font en el CSS ("'Anton', 'Anton Fallback'"). */
export type Fuentes = { display: string; cuerpo: string };

/** Lee las familias de las variables CSS de un elemento (las de next/font se heredan). */
export function fuentesDe(el: Element | null, tipo: Carta["tipo"]): Fuentes {
  const css = el ? getComputedStyle(el) : null;
  const v = (name: string) => css?.getPropertyValue(name).trim() || "";
  if (tipo === "novela") {
    return { display: `${v("--novela-display") || "Impact"}, Impact, sans-serif`, cuerpo: `${v("--novela-cuerpo") || "Arial"}, Arial, sans-serif` };
  }
  return { display: `${v("--font-playfair") || "Georgia"}, Georgia, serif`, cuerpo: `${v("--font-inter") || "Arial"}, system-ui, sans-serif` };
}

function conTiempo<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);
}

/** Espera las letras que se van a usar (con los caracteres justos, por los subconjuntos de Google). */
async function cargarLetras(fuentes: string[], texto: string) {
  if (typeof document === "undefined" || !document.fonts) return;
  await conTiempo(Promise.all(fuentes.map((f) => document.fonts.load(f, texto))), 3000);
}

function cargarImagen(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return conTiempo(
    new Promise<HTMLImageElement>((ok, mal) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => ok(img);
      img.onerror = mal;
      img.src = src;
    }),
    3000,
  );
}

// ─── Ayudas de texto ──────────────────────────────────────────────────────────────────────────

/** Achica la letra hasta que el texto entra en el ancho. Devuelve el tamaño elegido. */
function ajustar(ctx: CanvasRenderingContext2D, texto: string, fuente: (px: number) => string, max: number, desde: number, minimo = 24): number {
  let px = desde;
  ctx.font = fuente(px);
  while (px > minimo && ctx.measureText(texto).width > max) {
    px -= 4;
    ctx.font = fuente(px);
  }
  return px;
}

/** Parte el texto en renglones que entren en el ancho (con la letra ya puesta en el ctx). */
function renglones(ctx: CanvasRenderingContext2D, texto: string, max: number): string[] {
  const palabras = texto.split(/\s+/u).filter(Boolean);
  const out: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (actual && ctx.measureText(prueba).width > max) {
      out.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) out.push(actual);
  return out;
}

function espaciado(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, sep: number) {
  // letterSpacing existe en Chrome y Safari nuevos; donde no, se separa a mano.
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) {
    c.letterSpacing = `${sep}px`;
    // Con letterSpacing el texto queda corrido medio espacio a la izquierda del centro.
    ctx.fillText(texto, x + sep / 2, y);
    c.letterSpacing = "0px";
    return;
  }
  const letras = [...texto];
  const total = letras.reduce((n, l) => n + ctx.measureText(l).width, 0) + sep * (letras.length - 1);
  const alin = ctx.textAlign;
  ctx.textAlign = "left";
  let cx = x - total / 2;
  for (const l of letras) {
    ctx.fillText(l, cx, y);
    cx += ctx.measureText(l).width + sep;
  }
  ctx.textAlign = alin;
}

// ─── La de los juegos: la casa (oscuro, dorado, crema) ───────────────────────────────────────

const ORO = "#d8b878";
const ORO_FUERTE = "#e0c283";
const CREMA = "#f3ede4";
const GRIS = "#9a9187";
const FONDO = "#141210";

async function dibujarJuego(ctx: CanvasRenderingContext2D, c: CartaJuego, f: Fuentes) {
  const disp = (px: number, peso = 700, it = false) => `${it ? "italic " : ""}${peso} ${px}px ${f.display}`;
  const cuerpo = (px: number, peso = 400) => `${peso} ${px}px ${f.cuerpo}`;
  const texto = `${c.title}${c.label}${DESTAQUE_LABEL.meta}${DESTAQUE_LABEL["record-casa"]}${DESTAQUE_LABEL.record}¿Me ganás?CATDOG·LOSJUEGOSDELAMESA${LEMA}${INSTAGRAM}${linkVisible()}0123456789`;
  const [img] = await Promise.all([
    cargarImagen(urlEmoji(c.icon)),
    cargarLetras([disp(100), disp(100, 400, true), disp(100, 400), cuerpo(40), cuerpo(40, 600)], texto),
  ]);

  // Fondo: oscuro, con un resplandor dorado detrás del resultado.
  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const glow = ctx.createRadialGradient(ANCHO / 2, 880, 40, ANCHO / 2, 880, 900);
  glow.addColorStop(0, "rgba(216,184,120,0.22)");
  glow.addColorStop(0.5, "rgba(216,184,120,0.06)");
  glow.addColorStop(1, "rgba(216,184,120,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  // Marco fino dorado, que se corta antes de la franja del sticker.
  ctx.strokeStyle = "rgba(216,184,120,0.45)";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 150, ANCHO - 108, FIN_CONTENIDO - 150 - 24);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Arriba: la casa.
  ctx.fillStyle = ORO;
  ctx.font = cuerpo(30, 600);
  espaciado(ctx, "CATDOG · LOS JUEGOS DE LA MESA", ANCHO / 2, 238, 9);
  ctx.fillStyle = ORO;
  ctx.font = disp(40, 400);
  ctx.fillText("✦", ANCHO / 2, 300);

  // El emoji del juego, grande.
  const lado = 300;
  const ey = 340;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  if (img) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, ANCHO / 2 - lado / 2, ey, lado, lado);
  } else {
    ctx.font = `${lado * 0.8}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(c.icon, ANCHO / 2, ey + lado / 2);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // El nombre del juego.
  ctx.fillStyle = CREMA;
  ajustar(ctx, c.title, (px) => disp(px, 600), ANCHO - 220, 84);
  ctx.fillText(c.title, ANCHO / 2, 760);

  // El resultado: lo más grande de la imagen.
  ctx.fillStyle = ORO_FUERTE;
  ajustar(ctx, c.label, (px) => disp(px, 800), ANCHO - 200, 210, 80);
  ctx.save();
  ctx.shadowColor = "rgba(224,194,131,0.35)";
  ctx.shadowBlur = 50;
  ctx.fillText(c.label, ANCHO / 2, 990);
  ctx.restore();

  // El sello: ¡Meta! / récord.
  if (c.destaque) {
    const t = DESTAQUE_LABEL[c.destaque];
    ctx.save();
    ctx.translate(ANCHO / 2, 1100);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.font = disp(c.destaque === "meta" ? 64 : 50, 800, true);
    const w = ctx.measureText(t).width + 80;
    const h = c.destaque === "meta" ? 104 : 90;
    ctx.fillStyle = "rgba(224,194,131,0.12)";
    ctx.strokeStyle = ORO_FUERTE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ORO_FUERTE;
    ctx.textBaseline = "middle";
    ctx.fillText(t, 0, 4);
    ctx.restore();
  }

  // El gancho.
  ctx.fillStyle = CREMA;
  ctx.font = disp(96, 500, true);
  ctx.fillText("¿Me ganás?", ANCHO / 2, 1268);

  // La firma de la casa.
  ctx.fillStyle = GRIS;
  ajustar(ctx, LEMA, (px) => cuerpo(px), ANCHO - 200, 38);
  ctx.fillText(LEMA, ANCHO / 2, 1352);
  ctx.fillStyle = ORO;
  ctx.font = cuerpo(44, 600);
  ctx.fillText(INSTAGRAM, ANCHO / 2, 1420);
  ctx.fillStyle = CREMA;
  ajustar(ctx, linkVisible(), (px) => cuerpo(px), ANCHO - 200, 34);
  ctx.fillText(linkVisible(), ANCHO / 2, 1468);
}

// ─── La de la novela: rojo y negro, a lo Persona 5 ───────────────────────────────────────────

const ROJO = "#e0101e";
const NEGRO = "#0a0a0a";
const BLANCO = "#fbf7f2";
const AMARILLO = "#f2c230";

function poligono(ctx: CanvasRenderingContext2D, puntos: [number, number][], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

/** Un cartel inclinado con el texto adentro (los recortes de Persona). */
function cartel(
  ctx: CanvasRenderingContext2D,
  t: string,
  { x, y, font, fondo, color, rot = 0, skew = -0.18, pad = 34, sombra }: { x: number; y: number; font: string; fondo: string; color: string; rot?: number; skew?: number; pad?: number; sombra?: string },
) {
  ctx.save();
  ctx.font = font;
  const m = ctx.measureText(t);
  const alto = (m.actualBoundingBoxAscent || 60) + (m.actualBoundingBoxDescent || 0);
  const w = m.width + pad * 2;
  const h = alto + pad * 0.9;
  ctx.translate(x, y);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.transform(1, 0, skew, 1, 0, 0);
  if (sombra) {
    ctx.fillStyle = sombra;
    ctx.fillRect(-w / 2 + 16, -h / 2 + 16, w, h);
  }
  ctx.fillStyle = fondo;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.transform(1, 0, -skew, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(t, 0, alto / 2 - (m.actualBoundingBoxDescent || 0));
  ctx.restore();
}

async function dibujarNovela(ctx: CanvasRenderingContext2D, c: CartaNovela, f: Fuentes) {
  const disp = (px: number) => `400 ${px}px ${f.display}`;
  const cuerpo = (px: number, peso = 400) => `${peso} ${px}px ${f.cuerpo}`;
  const anteTitulo = c.verdadero ? `★ FINAL VERDADERO · TEMPORADA ${c.temporada} ★` : `TEMPORADA ${c.temporada} · FINAL`;
  const texto = `¿QUIÉN TE CONTÓ?LA NOVELA DE CATDOGFIN${anteTitulo}${c.titulo.toUpperCase()}EN PAREJA CON ${(c.conQuien ?? "").toUpperCase()}FINALES ${c.logrados}/${c.total}¿CUÁL TE TOCA A VOS?${LEMA}${INSTAGRAM}${linkVisible()}♥`;
  await cargarLetras([disp(100), cuerpo(40), cuerpo(40, 700)], texto);

  // Fondo: negro con el corte rojo en diagonal y astillas.
  ctx.fillStyle = NEGRO;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  poligono(ctx, [[0, 120], [ANCHO, 0], [ANCHO, 1180], [0, 1460]], ROJO);
  poligono(ctx, [[0, 640], [ANCHO, 380], [ANCHO, 470], [0, 760]], NEGRO);
  poligono(ctx, [[640, 0], [ANCHO, 0], [ANCHO, 120], [820, 210]], BLANCO);
  poligono(ctx, [[0, 1560], [ANCHO, 1505], [ANCHO, 1517], [0, 1572]], ROJO);
  // Tramado de puntos, apenas, sobre el rojo.
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  for (let y = 140; y < 1400; y += 26) for (let x = (y / 26) % 2 ? 13 : 0; x < ANCHO; x += 26) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  // Arriba: el nombre de la novela.
  cartel(ctx, "¿QUIÉN TE CONTÓ?", { x: ANCHO / 2 - 40, y: 260, font: disp(84), fondo: NEGRO, color: BLANCO, rot: -4 });
  ctx.fillStyle = BLANCO;
  ctx.font = cuerpo(30, 700);
  espaciado(ctx, "LA NOVELA DE CATDOG", ANCHO / 2 + 120, 360, 8);

  // FIN, enorme, como en la pantalla del final.
  cartel(ctx, "FIN", { x: ANCHO / 2, y: 570, font: disp(290), fondo: BLANCO, color: ROJO, rot: -10, skew: 0, pad: 40, sombra: NEGRO });

  // Qué final.
  ctx.fillStyle = c.verdadero ? AMARILLO : BLANCO;
  ctx.font = cuerpo(34, 700);
  espaciado(ctx, anteTitulo, ANCHO / 2, 800, 5);

  // El título, en dos renglones como mucho (achicando la letra si hace falta).
  const titulo = c.titulo.toUpperCase();
  let px = 84;
  ctx.font = disp(px);
  let lineas = renglones(ctx, titulo, ANCHO - 260);
  while (lineas.length > 2 && px > 48) {
    px -= 6;
    ctx.font = disp(px);
    lineas = renglones(ctx, titulo, ANCHO - 260);
  }
  let y = 890;
  for (const l of lineas.slice(0, 2)) {
    ajustar(ctx, l, disp, ANCHO - 240, px, 40);
    cartel(ctx, l, { x: ANCHO / 2, y, font: ctx.font, fondo: NEGRO, color: BLANCO, rot: -2 });
    y += px + 22;
  }

  if (c.conQuien) {
    const t = `EN PAREJA CON ${c.conQuien.toUpperCase()} ♥`;
    ajustar(ctx, t, disp, ANCHO - 260, 54, 36);
    cartel(ctx, t, { x: ANCHO / 2 + 50, y: y + 4, font: ctx.font, fondo: BLANCO, color: ROJO, rot: 3 });
    y += 92;
  }

  cartel(ctx, `FINALES ${c.logrados}/${c.total}`, { x: ANCHO / 2 - 160, y: y + 14, font: disp(56), fondo: AMARILLO, color: NEGRO, rot: -3 });

  // El gancho y la firma, sobre negro.
  ctx.fillStyle = BLANCO;
  ajustar(ctx, "¿CUÁL TE TOCA A VOS?", disp, ANCHO - 160, 92);
  ctx.fillText("¿CUÁL TE TOCA A VOS?", ANCHO / 2, 1356);
  ctx.fillStyle = "#cfc8c0";
  ajustar(ctx, LEMA, (n) => cuerpo(n), ANCHO - 200, 36);
  ctx.fillText(LEMA, ANCHO / 2, 1406);
  ctx.fillStyle = AMARILLO;
  ctx.font = cuerpo(42, 700);
  ctx.fillText(INSTAGRAM, ANCHO / 2, 1452);
  ctx.fillStyle = BLANCO;
  ajustar(ctx, linkVisible(), (n) => cuerpo(n), ANCHO - 200, 32);
  ctx.fillText(linkVisible(), ANCHO / 2, 1494);
}

/** Dibuja la carta y la devuelve como PNG. */
export async function dibujarCarta(c: Carta, fuentes: Fuentes): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sin canvas");
  if (c.tipo === "juego") await dibujarJuego(ctx, c, fuentes);
  else await dibujarNovela(ctx, c, fuentes);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
  // Liberar la memoria del canvas enseguida (Safari en iPhone es mezquino con eso).
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error("no se pudo armar la imagen");
  return blob;
}
