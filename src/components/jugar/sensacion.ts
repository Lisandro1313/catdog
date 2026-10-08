/**
 * "Game feel" común a todos los juegos: que cada toque se sienta. Acá viven los tiempos y las curvas
 * de toda la colección (así un acierto rebota igual en la trivia que en el memotest), las funciones
 * puras que los calculan (con tests en tests/sensacion.test.ts) y unos ayudantes chicos:
 *
 * - Lienzo: `hitStop` (congela la simulación unos milisegundos en un golpe, el dibujo sigue) y
 *   `aplastar`/`escalaAplaste` (squash & stretch con un resorte amortiguado). El temblor de
 *   pantalla ya está en efectos.ts (`temblar`/`correrTemblor`): se usa ése, con las fuerzas de `TEMBLOR`.
 * - DOM: `instalarTactil` (todo botón se hunde al apretarlo y vuelve con rebote), `rebotar`
 *   (acierto), `sacudir` (error) y `saltar` (un número que cambia). Van con Web Animations y
 *   `composite: "add"`, así se suman a lo que ya pinta el CSS sin pisarlo.
 * - `vibrar("suave" | "medio" | "fuerte")` sobre `tap()`.
 *
 * Con "menos movimiento" no hay temblor, ni sacudidas, ni rebotes grandes: queda el color y el sonido.
 */
import { pocoMovimiento } from "./efectos";
import { tap } from "./Shell";

// ---------------------------------------------------------------------------------------------
// Tiempos y curvas de la colección
// ---------------------------------------------------------------------------------------------

/** Duraciones (ms). */
export const TIEMPO = {
  /** Lo que tarda un botón en hundirse: casi inmediato, para que el dedo sienta que tocó. */
  presion: 80,
  /** La vuelta del botón al soltarlo, con un rebotecito. */
  suelta: 320,
  /** El rebote de un acierto. */
  rebote: 420,
  /** La sacudida de un error: corta, no castiga. */
  sacudida: 340,
  /** Un número que cambia. */
  salto: 380,
  /** Pasar de una pregunta o ronda a la siguiente. */
  transicion: 260,
} as const;

/** Las mismas curvas, en CSS (para transiciones y Web Animations). */
export const CURVA = {
  outQuint: "cubic-bezier(0.22, 1, 0.36, 1)",
  outBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** Y en GSAP (para lo que ya se anima con animar.ts). */
export const CURVA_GSAP = {
  outQuint: "power4.out",
  outBack: "back.out(1.7)",
  outElastic: "elastic.out(1, 0.5)",
} as const;

/** Hit-stop (ms): sólo en los golpes que importan. Uno por impacto; no se encadenan. */
export const HIT_STOP = { corto: 40, medio: 60, largo: 80 } as const;

/** Fuerza del temblor de pantalla (px de efectos.ts `temblar`): chico. El fuerte, sólo para golpes grandes. */
export const TEMBLOR = { chico: 2.5, fuerte: 5 } as const;

/** Cuánto se aplasta un objeto en un impacto (0.1 = 10% más ancho y más bajo). */
export const APLASTE = { suave: 0.1, medio: 0.18, fuerte: 0.26 } as const;

// ---------------------------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------------------------

const lim = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function outQuint(t: number): number {
  const u = 1 - lim(t, 0, 1);
  return 1 - u * u * u * u * u;
}

export function outBack(t: number, s = 1.70158): number {
  const u = lim(t, 0, 1) - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}

export function outElastic(t: number): number {
  const x = lim(t, 0, 1);
  if (x === 0 || x === 1) return x;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/** El resorte de toda la colección: 6 vueltas por segundo, bastante amortiguado. */
const FREC = 6;
const AMORT = 0.32;
const W0 = 2 * Math.PI * FREC;
const WD = W0 * Math.sqrt(1 - AMORT * AMORT);
/** Pasado esto el resorte ya está quieto (menos del 2%). */
export const DURA_RESORTE = 0.4;

/** Resorte soltado desde estirado: 1 en t=0, oscila y se apaga en 0. `t` en segundos. */
export function resorte(t: number): number {
  if (t <= 0) return 1;
  if (t >= DURA_RESORTE) return 0;
  return Math.exp(-AMORT * W0 * t) * Math.cos(WD * t);
}

const PICO_IMPULSO = (() => {
  let m = 0;
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * DURA_RESORTE;
    m = Math.max(m, Math.exp(-AMORT * W0 * t) * Math.sin(WD * t));
  }
  return m;
})();

/** Resorte empujado desde quieto: 0 en t=0, sube a 1 (su pico), se pasa un poco para el otro lado y se apaga. */
export function impulso(t: number): number {
  if (t <= 0 || t >= DURA_RESORTE) return 0;
  return (Math.exp(-AMORT * W0 * t) * Math.sin(WD * t)) / PICO_IMPULSO;
}

/**
 * Squash & stretch: dado el tiempo desde el impacto (s) y la fuerza, cuánto escalar en X y en Y.
 * Fuerza positiva aplasta (más ancho, más bajo: un aterrizaje); negativa estira (más alto: un salto).
 * Conserva el área (x · y = 1), así el objeto no parece crecer.
 */
export function estirar(t: number, fuerza: number): { x: number; y: number } {
  const d = lim(fuerza, -0.5, 0.5) * resorte(t);
  if (d === 0) return { x: 1, y: 1 };
  return { x: 1 + d, y: 1 / (1 + d) };
}

/** Un número que salta al cambiar: arranca grande y vuelve a 1 con un rebote. */
export function saltoNumero(t: number, fuerza = 0.3): number {
  return 1 + fuerza * resorte(t);
}

/** Sacudida de un error: desplazamiento (px) que va y viene y se apaga. `t` en segundos. */
export function sacudida(t: number, amplitud = 6): number {
  const dura = TIEMPO.sacudida / 1000;
  if (t <= 0 || t >= dura) return 0;
  const k = 1 - t / dura;
  return amplitud * k * k * Math.sin(t * 2 * Math.PI * 11);
}

/** Valores de una función en `n + 1` puntos parejos de [0, dura]: los cuadros de una animación. */
export function muestrear(fn: (t: number) => number, dura: number, n = 16): number[] {
  return Array.from({ length: n + 1 }, (_, i) => fn((i / n) * dura));
}

// ---------------------------------------------------------------------------------------------
// Lienzo: hit-stop y aplaste
// ---------------------------------------------------------------------------------------------

/** Hasta cuándo (reloj real, ms de performance.now / requestAnimationFrame) está congelada la simulación. */
export type HitStop = { hasta: number };

export function crearHitStop(): HitStop {
  return { hasta: 0 };
}

/**
 * Congela la simulación `ms` milisegundos (tope 120). Uno por impacto: si ya hay uno corriendo, no se
 * alarga (diez golpes seguidos no pueden trabar el juego). Devuelve si arrancó uno.
 */
export function hitStop(h: HitStop, ms: number, ahora: number): boolean {
  if (ahora < h.hasta) return false;
  h.hasta = ahora + lim(ms, 0, 120);
  return true;
}

/** El paso de simulación de este cuadro: 0 mientras dura el hit-stop (el dibujo sigue igual). */
export function pasoSimulado(h: HitStop, dt: number, ahora: number): number {
  return ahora < h.hasta ? 0 : dt;
}

/** Un objeto que se aplasta en un golpe y vuelve con resorte. `t` = segundos desde el golpe. */
export type Aplaste = { t: number; f: number };

export function crearAplaste(): Aplaste {
  return { t: DURA_RESORTE, f: 0 };
}

/** Golpe: arranca el aplaste. Con menos movimiento, apenas se nota. */
export function aplastar(a: Aplaste, fuerza: number) {
  a.t = 0;
  a.f = menosMovimiento() ? fuerza * 0.25 : fuerza;
}

/** Avanza el aplaste (con el dt real, no el congelado: el objeto respira durante el hit-stop) y da la escala. */
export function escalaAplaste(a: Aplaste, dt: number): { x: number; y: number } {
  a.t = Math.min(DURA_RESORTE, a.t + dt);
  return estirar(a.t, a.f);
}

// ---------------------------------------------------------------------------------------------
// Háptica
// ---------------------------------------------------------------------------------------------

export const VIBRA = { suave: 8, medio: 16, fuerte: 30 } as const;
export type Nivel = keyof typeof VIBRA;

/** Vibración escalonada: suave (un toque), medio (un acierto, un golpe), fuerte (un error, algo grande). */
export function vibrar(nivel: Nivel) {
  tap(VIBRA[nivel]);
}

// ---------------------------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------------------------

/** Si la persona pidió menos movimiento (se lee una vez y se sigue escuchando). */
let reducido: boolean | null = null;
export function menosMovimiento(): boolean {
  if (reducido === null) {
    reducido = pocoMovimiento();
    if (typeof matchMedia === "function") {
      try {
        matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
          reducido = e.matches;
        });
      } catch {
        // navegador viejo: queda lo leído
      }
    }
  }
  return reducido;
}

function animarEl(el: Element | null | undefined, frames: Keyframe[], dura: number, extra: KeyframeAnimationOptions = {}): Animation | null {
  if (!el || typeof (el as HTMLElement).animate !== "function") return null;
  try {
    // "add": se suma al transform que ya tenga el elemento (una carta dada vuelta, un botón encendido).
    return (el as HTMLElement).animate(frames, { duration: dura, composite: "add", ...extra });
  } catch {
    return null;
  }
}

const escalas = (valores: number[]): Keyframe[] => valores.map((s) => ({ transform: `scale(${s.toFixed(4)})` }));

/** Acierto: el elemento crece un poco y vuelve con rebote. */
export function rebotar(el: Element | null | undefined, fuerza = 0.12) {
  if (menosMovimiento()) return;
  const dura = TIEMPO.rebote / 1000;
  animarEl(el, escalas(muestrear((t) => 1 + fuerza * impulso(t * (DURA_RESORTE / dura)), dura, 20)), TIEMPO.rebote);
}

/** Error: una sacudida corta de costado. Con menos movimiento no se mueve (queda el color y el sonido). */
export function sacudir(el: Element | null | undefined, amplitud = 6) {
  if (menosMovimiento()) return;
  const dura = TIEMPO.sacudida / 1000;
  animarEl(el, muestrear((t) => sacudida(t, amplitud), dura, 20).map((x) => ({ transform: `translateX(${x.toFixed(2)}px)` })), TIEMPO.sacudida);
}

/** Un número que cambió: salta y vuelve. */
export function saltar(el: Element | null | undefined, fuerza = 0.3) {
  if (menosMovimiento()) return;
  const dura = TIEMPO.salto / 1000;
  animarEl(el, escalas(muestrear((t) => saltoNumero(t * (DURA_RESORTE / dura), fuerza), dura, 16)), TIEMPO.salto);
}

/** Lo que se hunde al apretarlo: botones, y cualquier cosa marcada con data-tactil. */
const TOCABLE = "button, [role='button'], [data-tactil]";
const HUNDE = 0.95;

/**
 * Respuesta táctil de todos los botones adentro de `raiz`: al apoyar el dedo se hunden enseguida
 * (outQuint, sin esperar al click) y al soltar vuelven con un rebotecito. Un solo oyente para todo el
 * juego. Para excluir algo: `data-sin-tactil`. Devuelve la limpieza.
 */
export function instalarTactil(raiz: HTMLElement | null): () => void {
  if (!raiz || typeof window === "undefined") return () => {};
  const apretados = new Map<number, { el: HTMLElement; anim: Animation | null }>();

  const soltar = (e: PointerEvent) => {
    const a = apretados.get(e.pointerId);
    if (!a) return;
    apretados.delete(e.pointerId);
    // Desde donde haya llegado a hundirse (si se soltó enseguida, todavía no bajó del todo).
    const hecho = a.anim?.currentTime != null ? outQuint(Number(a.anim.currentTime) / TIEMPO.presion) : 1;
    a.anim?.cancel();
    if (!a.el.isConnected) return;
    const hondo = (1 - HUNDE) * hecho;
    const dura = TIEMPO.suelta / 1000;
    const vuelta = menosMovimiento() ? (t: number) => 1 - hondo * (1 - outQuint(t / dura)) : (t: number) => 1 - hondo * resorte(t * (DURA_RESORTE / dura));
    animarEl(a.el, escalas(muestrear(vuelta, dura, 16)), TIEMPO.suelta);
  };

  const apretar = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = (e.target as Element | null)?.closest?.(TOCABLE) as HTMLElement | null;
    if (!el || !raiz.contains(el) || el.closest("[data-sin-tactil]")) return;
    if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
    const previo = apretados.get(e.pointerId);
    previo?.anim?.cancel();
    const anim = animarEl(el, escalas([1, HUNDE]), TIEMPO.presion, { easing: CURVA.outQuint, fill: "forwards" });
    apretados.set(e.pointerId, { el, anim });
  };

  raiz.addEventListener("pointerdown", apretar, { passive: true });
  window.addEventListener("pointerup", soltar, { passive: true });
  window.addEventListener("pointercancel", soltar, { passive: true });
  return () => {
    raiz.removeEventListener("pointerdown", apretar);
    window.removeEventListener("pointerup", soltar);
    window.removeEventListener("pointercancel", soltar);
    apretados.forEach((a) => a.anim?.cancel());
    apretados.clear();
  };
}
