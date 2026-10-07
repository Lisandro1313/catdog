/**
 * Lo común de los juegos que se dibujan en un lienzo (ping pong, pool, fruta, vaso).
 *
 * Cada juego piensa en un tamaño fijo (por ejemplo 360 × 540) y el lienzo se estira al ancho de la
 * pantalla. Estas dos funciones hacen que se vea nítido en cualquier celular y que el dedo caiga
 * donde el juego cree que cayó.
 */

/** Ajusta la resolución al celular (pantallas de 2x o 3x) y devuelve el contexto ya escalado. */
export function prepararLienzo(canvas: HTMLCanvasElement, W: number, H: number): CanvasRenderingContext2D | null {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const ancho = canvas.clientWidth || W;
  const escala = (ancho / W) * dpr;
  canvas.width = Math.round(W * escala);
  canvas.height = Math.round(H * escala);
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(escala, 0, 0, escala, 0, 0);
  return ctx;
}

/** Dónde tocó el dedo, en las medidas del juego. */
export function puntoEnLienzo(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement, W: number, H: number): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

/** Un emoji dibujado centrado en (x, y). Sirve para las frutas, las bolas con dibujo, etc. */
export function emoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, tam: number) {
  ctx.font = `${tam}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, x, y);
}

/**
 * Que el dedo siga mandando al juego aunque se salga del lienzo. Si el navegador no puede (el dedo
 * ya se levantó, un navegador viejo), no pasa nada: el juego sigue igual mientras el dedo esté adentro.
 * Sin el try, un error acá cortaba el toque entero y el tiro no salía.
 */
export function capturar(e: { currentTarget: Element; pointerId: number }) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // sin captura
  }
}
