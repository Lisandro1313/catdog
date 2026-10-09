import { GAMES } from "./juegos";
import { deDeLaRuta, limpiarDe } from "./origen";

/**
 * Qué se juega, y quién llega a jugar.
 *
 * Mismo sistema que las visitas: un contador por día y por ruta, sin cookies ni nada que identifique
 * a nadie. Cada juego deja dos marcas:
 *
 *   /juego/pool          alguien abrió Embocá (una vez por sesión de navegador)
 *   /juego/pool/fin      terminó una partida (cada partida)
 *
 * y las dos llevan de dónde había llegado esa persona a la página ("?de=ig", "?de=qr"), aunque haya
 * entrado por el inicio y llegado a los juegos después: lo que interesa es si el que vino desde
 * Instagram terminó jugando.
 *
 * Además de los juegos con puntaje están los que no tienen: El Impostor, la novela, el duelo y el torneo.
 */

export const EXTRAS = ["novela", "impostor", "duelo", "torneo"] as const;
export const CONTADOS: readonly string[] = [...GAMES, ...EXTRAS];
const IDS = new Set(CONTADOS);

export const NOMBRE_EXTRA: Record<(typeof EXTRAS)[number], string> = {
  novela: "La novela (¿Quién te contó?)",
  impostor: "El Impostor",
  duelo: "Duelo",
  torneo: "Torneo de mesa",
};

export function rutaDeJuego(id: string, fin = false, de = ""): string {
  const d = limpiarDe(de);
  return `/juego/${id}${fin ? "/fin" : ""}${d ? `?de=${d}` : ""}`;
}

/** La ruta sin el `?de=`, partida en sus piezas. Null si no es una ruta de juego válida. */
export function leerRutaDeJuego(ruta: string): { id: string; fin: boolean; de: string } | null {
  const sinDe = ruta.split("?")[0];
  const m = /^\/juego\/([a-z0-9-]+)(\/fin)?$/u.exec(sinDe);
  if (!m || !IDS.has(m[1])) return null;
  // Si trae algo después del ?, tiene que ser un `de` limpio: nada de colar rutas raras.
  if (ruta.includes("?") && !deDeLaRuta(ruta)) return null;
  return { id: m[1], fin: Boolean(m[2]), de: deDeLaRuta(ruta) };
}

export function esRutaDeJuego(ruta: string): boolean {
  return leerRutaDeJuego(ruta) !== null;
}

/**
 * Lo que no es una visita a una página: clics, el recorrido por el inicio, los juegos. Las visitas
 * del panel no los tienen que sumar (antes los sumaban, e inflaban la cuenta).
 */
export function esEvento(ruta: string): boolean {
  return ruta.startsWith("/clic/") || ruta.startsWith("/hasta/") || ruta.startsWith("/juego/");
}

export type FilaJuego = {
  id: string;
  /** Veces que lo abrieron (una por persona y sesión). */
  abrieron: number;
  /** Partidas terminadas. */
  terminaron: number;
  /** De dónde venían los que lo abrieron. "" = sin origen (entraron directo). */
  porOrigen: Record<string, number>;
};

export type ResumenJuegos = {
  /** Visitas a la página de juegos, por origen ("" = directo). */
  pagina: Record<string, number>;
  /** Un renglón por juego que alguien abrió, de lo más abierto a lo menos. */
  juegos: FilaJuego[];
  /** Total de veces que se abrió algún juego, por origen. */
  aperturasPorOrigen: Record<string, number>;
};

/** Junta los contadores (los de PageView) en el resumen para el panel. */
export function resumirJuegos(filas: { path: string; count: number }[]): ResumenJuegos {
  const pagina: Record<string, number> = {};
  const porId = new Map<string, FilaJuego>();
  const aperturasPorOrigen: Record<string, number> = {};
  for (const f of filas) {
    if (f.path === "/hoy/jugar" || f.path.startsWith("/hoy/jugar?")) {
      const de = deDeLaRuta(f.path);
      pagina[de] = (pagina[de] ?? 0) + f.count;
      continue;
    }
    const r = leerRutaDeJuego(f.path);
    if (!r) continue;
    let fila = porId.get(r.id);
    if (!fila) {
      fila = { id: r.id, abrieron: 0, terminaron: 0, porOrigen: {} };
      porId.set(r.id, fila);
    }
    if (r.fin) {
      fila.terminaron += f.count;
    } else {
      fila.abrieron += f.count;
      fila.porOrigen[r.de] = (fila.porOrigen[r.de] ?? 0) + f.count;
      aperturasPorOrigen[r.de] = (aperturasPorOrigen[r.de] ?? 0) + f.count;
    }
  }
  const juegos = [...porId.values()].sort((a, b) => b.abrieron - a.abrieron || b.terminaron - a.terminaron);
  return { pagina, juegos, aperturasPorOrigen };
}
