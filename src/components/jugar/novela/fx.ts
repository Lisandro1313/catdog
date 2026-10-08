import { gsap } from "gsap";
import { sonar, type Sonido } from "../Shell";
import f from "./Fx.module.css";

/**
 * Efectos de la novela: sacudón de cámara, barridos, chispas, papel picado y fanfarrias.
 * Todo con GSAP sobre transform/opacity (nada de layout), y apagado con prefers-reduced-motion.
 */

export const COLOR = { rojo: "#e0101e", blanco: "#fbf7f2", negro: "#0a0a0a", oro: "#f2c230" } as const;

export function reducido(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const azar = (a: number, b: number) => a + Math.random() * (b - a);
const uno = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Sacudón de cámara: el escenario tiembla un instante (golpes, el calendario que cae, rank up). */
export function sacudir(el: HTMLElement | null, fuerza = 1) {
  if (!el || reducido()) return;
  const k = 9 * fuerza;
  gsap.killTweensOf(el);
  // Con keyframes, GSAP ignora el resto de las propiedades: el clearProps va al terminar.
  gsap.to(el, {
    keyframes: { x: [0, -k, k * 0.8, -k * 0.5, k * 0.25, 0], y: [0, k * 0.4, -k * 0.5, k * 0.3, -k * 0.1, 0], rotation: [0, -0.6 * fuerza, 0.5 * fuerza, -0.2 * fuerza, 0, 0], easeEach: "none" },
    duration: 0.36,
    onComplete: () => {
      gsap.set(el, { clearProps: "transform" });
    },
  });
}

/** Barrido diagonal negro / rojo / blanco a lo Persona. `capa` es el div con las tres franjas (cada una, una capa al 220%). */
export function barrer(capa: HTMLElement | null) {
  if (!capa || reducido()) return;
  const franjas = Array.from(capa.children);
  gsap.killTweensOf([capa, ...franjas]);
  gsap.set(capa, { autoAlpha: 1 });
  gsap.fromTo(
    franjas,
    { xPercent: -75 },
    {
      xPercent: 75,
      duration: 0.6,
      ease: "power3.inOut",
      stagger: 0.06,
      onComplete: () => {
        gsap.set(capa, { autoAlpha: 0 });
      },
    },
  );
}

export const PART = (n: string) => `/particulas/${n}.webp`;
const CHISPAS = ["spark_01", "spark_03", "spark_05", "slash_01", "slash_03", "trace_02"].map(PART);
const ESTRELLAS = ["star_01", "star_04", "star_06", "star_08", "flare_01", "spark_06"].map(PART);

type Estallido = {
  /** Centro, en fracción del ancho y alto de la capa (0 a 1). */
  x: number;
  y: number;
  n?: number;
  imgs?: string[];
  colores?: string[];
  /** Distancia que vuelan, en px. */
  lejos?: [number, number];
  tam?: [number, number];
  dur?: number;
};

/** Chispas que salen volando de un punto y se apagan. Los nodos se crean y se borran solos. */
export function estallido(capa: HTMLElement | null, o: Estallido) {
  if (!capa || reducido()) return;
  const { x, y, n = 9, imgs = CHISPAS, colores = [COLOR.blanco, COLOR.rojo], lejos = [50, 130], tam = [18, 46], dur = 0.6 } = o;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    const img = `url(${uno(imgs)})`;
    const t = Math.round(azar(tam[0], tam[1]));
    el.className = f.particula;
    el.style.cssText = `left:${x * 100}%;top:${y * 100}%;width:${t}px;height:${t}px;background:${uno(colores)};-webkit-mask-image:${img};mask-image:${img}`;
    capa.appendChild(el);
    const ang = (i / n) * Math.PI * 2 + azar(-0.4, 0.4);
    const d = azar(lejos[0], lejos[1]);
    gsap.fromTo(
      el,
      { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.3, rotation: azar(-90, 90), opacity: 1 },
      {
        x: Math.cos(ang) * d,
        y: Math.sin(ang) * d,
        scale: azar(0.8, 1.3),
        rotation: `+=${azar(-120, 120)}`,
        opacity: 0,
        duration: dur * azar(0.8, 1.2),
        ease: "power3.out",
        onComplete: () => el.remove(),
      },
    );
  }
}

/** Estrellas (para el rank up y los logros). */
export const estrellas = (capa: HTMLElement | null, x: number, y: number, colores: string[] = [COLOR.blanco, COLOR.rojo, COLOR.oro]) =>
  estallido(capa, { x, y, n: 14, imgs: ESTRELLAS, colores, lejos: [80, 200], tam: [20, 52], dur: 0.9 });

/** Papel picado rojo, blanco y negro. Se carga solo cuando hace falta. */
export function papelPicado(fuerte = false) {
  if (typeof window === "undefined" || reducido()) return;
  void import("canvas-confetti")
    .then(({ default: confetti }) => {
      const base = { colors: [COLOR.rojo, COLOR.blanco, COLOR.negro], disableForReducedMotion: true, zIndex: 120, ticks: 240, scalar: 1.05 };
      confetti({ ...base, particleCount: fuerte ? 80 : 45, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.8 } });
      confetti({ ...base, particleCount: fuerte ? 80 : 45, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.8 } });
      if (fuerte) setTimeout(() => confetti({ ...base, particleCount: 70, spread: 110, startVelocity: 35, origin: { x: 0.5, y: 0.3 }, shapes: ["square"] }), 380);
    })
    .catch(() => {
      // sin papel picado: no pasa nada
    });
}

// ─── Fanfarrias (Kenney "Music Jingles", CC0) ────────────────────────────────────────────────

type Fanfarria = "rango" | "rango-max" | "logro" | "cg" | "final" | "final-triste";
const JINGLES: Record<Fanfarria, Sonido[]> = {
  rango: ["jingle-sax-01", "jingle-sax-02", "jingle-sax-03", "jingle-sax-12"],
  "rango-max": ["jingle-sax-07"],
  logro: ["jingle-pizzi-01", "jingle-pizzi-03", "jingle-pizzi-07", "jingle-pizzi-12"],
  cg: ["jingle-pizzi-13", "jingle-pizzi-14", "jingle-sax-13", "jingle-sax-14"],
  final: ["jingle-sax-07", "jingle-pizzi-07"],
  "final-triste": ["jingle-pizzi-16", "jingle-sax-16"],
};
export const SONIDOS_FANFARRIA: Sonido[] = [...new Set(Object.values(JINGLES).flat())];

export function fanfarria(tipo: Fanfarria, volumen = 0.5) {
  sonar(uno(JINGLES[tipo]), volumen);
}
