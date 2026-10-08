import type { AnimationItem, LottiePlayer } from "lottie-web";
import { pocoMovimiento } from "./efectos";

/**
 * Los festejos grandes, con animaciones Lottie: un escalón arriba del confeti.
 *
 * - Reproductor: lottie-web en su versión liviana (Airbnb, MIT): 47 KB comprimido, sin WASM. El
 *   oficial nuevo (dotlottie-web) pesa diez veces más y estas animaciones no usan nada que lo pida.
 * - Animaciones: LottieFiles, con la Lottie Simple License (uso comercial libre, sin atribución
 *   obligatoria). Igual van los autores en public/lottie/LICENCIAS.txt.
 *
 * Se dibujan por encima de todo, sin tapar los toques, y se van solas cuando terminan. Con "menos
 * movimiento" no aparecen: queda el sonido.
 */

export type Festejo = "meta" | "record" | "trago" | "ganador" | "generala";

/** Cómo se muestra cada una: tamaño (fracción del ancho de la pantalla) y si ocupa toda la pantalla. */
const COMO: Record<Festejo, { ancho: number; pantalla?: boolean; velocidad?: number; y?: number }> = {
  /** Estrellas doradas que estallan: corto, alrededor del número. */
  meta: { ancho: 0.8, velocidad: 0.65, y: 0.32 },
  /** La copa con papelitos: el récord de la casa. */
  record: { ancho: 0.7, y: 0.36 },
  /** Dos jarras que brindan: el trago ganado. */
  trago: { ancho: 0.75, y: 0.4 },
  /** La corona: ganó el duelo o el torneo. */
  ganador: { ancho: 0.6, y: 0.38 },
  /** Fuegos artificiales en toda la pantalla: la generala. */
  generala: { ancho: 1, pantalla: true },
};

/** Cuánto como máximo queda en pantalla, por si una animación no avisa que terminó. */
const TOPE_MS = 7000;

let reproductor: Promise<LottiePlayer> | null = null;
const datos = new Map<Festejo, Promise<unknown>>();

function cargarReproductor(): Promise<LottiePlayer> {
  reproductor ??= import("lottie-web/build/player/lottie_light").then((m) => m.default as LottiePlayer);
  return reproductor;
}

function cargarDatos(f: Festejo): Promise<unknown> {
  let p = datos.get(f);
  if (!p) {
    p = fetch(`/lottie/${f}.json`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    // Si falló (sin señal), que se pueda intentar de nuevo la próxima vez.
    p.catch(() => datos.delete(f));
    datos.set(f, p);
  }
  return p;
}

/**
 * Deja todo bajado de antemano, cuando el teléfono no está haciendo nada: así el festejo sale en el
 * momento y no un segundo tarde. Pesa poco (unos 240 KB en total, la mitad el brindis).
 */
export function precargarFestejos(lista: Festejo[] = ["meta", "record", "trago", "ganador"]) {
  if (typeof window === "undefined" || pocoMovimiento()) return;
  const hacer = () => {
    void cargarReproductor().catch(() => {});
    for (const f of lista) void cargarDatos(f).catch(() => {});
  };
  const ocioso = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ocioso) ocioso(hacer, { timeout: 3000 });
  else setTimeout(hacer, 1200);
}

/**
 * Muestra un festejo una vez. Devuelve con qué cortarlo antes (al salir de la pantalla). Si algo
 * falla (sin señal, navegador viejo), no pasa nada: el festejo es un adorno.
 */
export function festejo(f: Festejo): () => void {
  if (typeof window === "undefined" || pocoMovimiento()) return () => {};
  const como = COMO[f];
  const capa = document.createElement("div");
  capa.className = `jg-festejo ${como.pantalla ? "is-pantalla" : ""}`;
  capa.setAttribute("aria-hidden", "true");
  const caja = document.createElement("div");
  caja.className = "jg-festejo-caja";
  if (!como.pantalla) {
    caja.style.width = `min(${Math.round(como.ancho * 100)}vw, ${Math.round(como.ancho * 520)}px)`;
    caja.style.top = `${Math.round((como.y ?? 0.4) * 100)}%`;
  }
  capa.appendChild(caja);
  document.body.appendChild(capa);

  let anim: AnimationItem | null = null;
  let terminado = false;
  const sacar = () => {
    if (terminado) return;
    terminado = true;
    capa.classList.add("is-saliendo");
    setTimeout(() => {
      anim?.destroy();
      capa.remove();
    }, 260);
  };
  const tope = setTimeout(sacar, TOPE_MS);

  void Promise.all([cargarReproductor(), cargarDatos(f)])
    .then(([lottie, data]) => {
      if (terminado) return;
      anim = lottie.loadAnimation({
        container: caja,
        renderer: "svg",
        loop: false,
        autoplay: true,
        // Copia: lottie-web escribe sobre el objeto, y la misma animación se usa varias veces.
        animationData: structuredClone(data),
        rendererSettings: { preserveAspectRatio: como.pantalla ? "xMidYMid slice" : "xMidYMid meet", progressiveLoad: false },
      });
      if (como.velocidad) anim.setSpeed(como.velocidad);
      anim.addEventListener("complete", sacar);
    })
    .catch(sacar);

  return () => {
    clearTimeout(tope);
    sacar();
  };
}
