import { origenGuardado } from "@/components/TrackVisit";
import { CONTADOS, rutaDeJuego } from "@/lib/juegos-stats";

/**
 * Las marcas de los juegos para el panel: qué se abre, qué se termina y de dónde venía la gente.
 * Van por el mismo contador que las visitas (un número por día, sin cookies). El origen es el de
 * cuando la persona llegó a la página, así se sabe si el que vino desde Instagram terminó jugando.
 */

function mandar(path: string) {
  fetch("/api/visita", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {});
}

/** Alguien abrió un juego. Una vez por juego y por sesión: volver a entrar no suma. */
export function contarApertura(id: string) {
  if (!CONTADOS.includes(id)) return;
  try {
    const clave = `juego:${id}`;
    if (sessionStorage.getItem(clave)) return;
    sessionStorage.setItem(clave, "1");
  } catch {
    // modo privado: se cuenta igual
  }
  mandar(rutaDeJuego(id, false, origenGuardado()));
}

/** Terminó una partida (cada una cuenta). */
export function contarPartida(id: string) {
  if (!CONTADOS.includes(id)) return;
  mandar(rutaDeJuego(id, true, origenGuardado()));
}
