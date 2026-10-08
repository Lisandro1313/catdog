import { gsap } from "gsap";

/**
 * Animaciones de pantalla con GSAP (entrada del hub, el final de cada juego, el premio).
 *
 * Todo pasa por `gsap.matchMedia`: si la persona pidió menos movimiento, no se anima nada y la
 * pantalla queda como la pinta el CSS. Lo que se crea adentro de `fn` queda atado a `scope` (los
 * selectores buscan sólo ahí) y la función que devuelve deshace todo: va de limpieza en el efecto.
 *
 * Sólo se animan transform y opacity (los que el navegador mueve sin repintar): 60 cuadros en el celu.
 */
export function animar(scope: Element | null, fn: () => void | (() => void)): () => void {
  // Con la pestaña oculta no corre el reloj de animación: mejor no esconder nada que nadie ve entrar.
  if (!scope || (typeof document !== "undefined" && document.hidden)) return () => {};
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => fn(), scope);
  return () => mm.revert();
}

type Desde = { opacity?: number; x?: number; y?: number; scale?: number; rotation?: number };
const NEUTRO: Required<Desde> = { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0 };

/**
 * Hace entrar `sel` desde `desde` (por ejemplo, transparente y 12 px más abajo) en la línea de
 * tiempo, en `pos`. Lo deja escondido desde ya —no recién cuando le toca—, así nada se ve un
 * instante y desaparece; al terminar se borran los estilos y manda el CSS.
 */
export function entrar(tl: gsap.core.Timeline, sel: gsap.TweenTarget, desde: Desde, vars: gsap.TweenVars = {}, pos?: gsap.Position) {
  const hasta: gsap.TweenVars = {};
  for (const k of Object.keys(desde) as (keyof Desde)[]) hasta[k] = NEUTRO[k];
  gsap.set(sel, desde);
  tl.to(sel, { ...hasta, clearProps: Object.keys(desde).join(","), ...vars }, pos);
  return tl;
}

export { gsap };
