import { Haptics } from "@haptics/vanilla";

/**
 * Vibración en iPhone.
 *
 * Los juegos vibran con `navigator.vibrate`, que en iPhone no existe: hasta ahora, en un iPhone no
 * vibraba nada. Safari sí hace vibrar un interruptor (`<input type="checkbox" switch>`) cuando se lo
 * toca, y @haptics/vanilla (MIT) se apoya en eso: pone uno invisible adentro de cada botón.
 *
 * Límite de Apple desde iOS 26.5: tiene que ser un toque de verdad sobre ese botón. Lo que pasa solo
 * (la pelota que pega en la paleta) no vibra en iPhone. Los botones, que son la mayoría de los toques,
 * sí.
 *
 * En Android no se instala: ahí los juegos ya vibran por su cuenta y vibraría dos veces.
 */

/** Lo mismo que se hunde al apretarlo (sensacion.ts): botones y lo marcado como tocable. */
const TOCABLE = "button, [role='button'], [data-tactil]";

let instancia: Haptics | null = null;
let esIOS: boolean | null = null;

function haptica(): Haptics | null {
  if (esIOS === false) return null;
  if (instancia) return instancia;
  try {
    const h = new Haptics({ respectReducedMotion: false });
    esIOS = h.isIOSSupported;
    if (!esIOS) {
      h.destroy();
      return null;
    }
    instancia = h;
    return h;
  } catch {
    esIOS = false;
    return null;
  }
}

/** Marca todo lo tocable adentro de `raiz` para que vibre en iPhone. Devuelve la limpieza. */
export function instalarHaptica(raiz: HTMLElement | null): () => void {
  if (!raiz || typeof window === "undefined" || !haptica()) return () => {};
  const marcar = () => {
    raiz.querySelectorAll<HTMLElement>(TOCABLE).forEach((el) => {
      if (el.hasAttribute("data-haptic") || el.closest("[data-sin-tactil]")) return;
      el.setAttribute("data-haptic", "selection");
    });
  };
  marcar();
  // Los juegos cambian de pantalla todo el tiempo: lo nuevo se marca al aparecer.
  const mirar = new MutationObserver(marcar);
  mirar.observe(raiz, { childList: true, subtree: true });
  return () => mirar.disconnect();
}
