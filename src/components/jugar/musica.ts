import { alCambiarSilencio, estaMudo } from "./Shell";

/**
 * La música de fondo (temas CC0 de OpenGameArt, en public/musica; ver LICENCIAS.txt).
 *
 * Suena un tema por vez, en loop, con fundido al cambiar. Va por <audio> y no por Web Audio para
 * no bajar el tema entero antes de empezar: arranca enseguida aunque la señal sea mala.
 * Respeta el botón de silencio de los juegos y se pausa cuando el teléfono pasa la pestaña al fondo.
 *
 * Los navegadores no dejan que suene nada hasta que la persona toca algo: llamar a `musica()` desde
 * un toque (o después de uno) es lo seguro. Si el navegador no deja, queda en silencio y listo.
 */
export type Tema = "barra" | "noche" | "melancolia" | "jazz-suave" | "brass" | "misterio";

const FUNDIDO_MS = 900;
let actual: { tema: Tema; audio: HTMLAudioElement; volumen: number } | null = null;
let preparado = false;

function fundir(audio: HTMLAudioElement, hasta: number, ms: number, alTerminar?: () => void) {
  const desde = audio.volume;
  const t0 = performance.now();
  const paso = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    audio.volume = Math.max(0, Math.min(1, desde + (hasta - desde) * k));
    if (k < 1) requestAnimationFrame(paso);
    else alTerminar?.();
  };
  requestAnimationFrame(paso);
}

function preparar() {
  if (preparado || typeof window === "undefined") return;
  preparado = true;
  alCambiarSilencio((mudo) => {
    if (!actual) return;
    if (mudo) fundir(actual.audio, 0, 300, () => actual?.audio.pause());
    else {
      void actual.audio.play().catch(() => {});
      fundir(actual.audio, actual.volumen, 600);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!actual) return;
    if (document.hidden) actual.audio.pause();
    else if (!estaMudo()) void actual.audio.play().catch(() => {});
  });
}

/** Pone un tema (con fundido desde el que estaba). El mismo tema no se reinicia. */
export function musica(tema: Tema, volumen = 0.35) {
  if (typeof window === "undefined") return;
  preparar();
  if (actual?.tema === tema) {
    actual.volumen = volumen;
    if (!estaMudo()) fundir(actual.audio, volumen, 400);
    return;
  }
  pararMusica();
  const audio = new Audio(`/musica/${tema}.mp3`);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  actual = { tema, audio, volumen };
  if (estaMudo()) return;
  void audio
    .play()
    .then(() => fundir(audio, volumen, FUNDIDO_MS))
    .catch(() => {
      // Sin permiso para sonar todavía: se intenta de nuevo con el próximo toque.
      const reintentar = () => {
        if (actual?.audio === audio && !estaMudo()) void audio.play().then(() => fundir(audio, volumen, FUNDIDO_MS)).catch(() => {});
      };
      window.addEventListener("pointerdown", reintentar, { once: true });
    });
}

/** Apaga la música con fundido (al salir de la novela o de un juego). */
export function pararMusica() {
  const a = actual;
  actual = null;
  if (!a) return;
  let parado = false;
  const parar = () => {
    if (parado) return;
    parado = true;
    a.audio.pause();
    a.audio.src = "";
  };
  fundir(a.audio, 0, FUNDIDO_MS / 2, parar);
  // El fundido va al ritmo de la pantalla: si el teléfono deja de dibujar (pasó la app al fondo justo
  // al salir del juego), no termina nunca y la música seguía sonando. Esto la corta igual.
  setTimeout(parar, FUNDIDO_MS / 2 + 150);
}
