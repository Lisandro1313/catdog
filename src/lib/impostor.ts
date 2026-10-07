/**
 * El Impostor: el juego de mesa que se hizo viral este año, con las palabras de la casa.
 *
 * A todos les toca la misma palabra menos a uno, que no sabe cuál es. Cada uno dice algo que tenga
 * que ver, sin regalarla; el impostor tiene que disimular, y al final se vota quién era.
 *
 * Es para jugar en la mesa, con un solo celular que se va pasando. Los otros juegos de la casa son
 * para uno; éste es para el grupo, que es lo que pasa de verdad en un bar.
 *
 * Esta parte no tiene pantalla: las palabras y el armado de cada ronda, para poder probarlos.
 */

export const MIN_JUGADORES = 3;
export const MAX_JUGADORES = 12;

export type Categoria = { clave: string; nombre: string; palabras: string[] };

/** Lo que se come y se toma acá y en cualquier casa argentina. */
const COCINA = [
  "Choripán",
  "Provoleta",
  "Chimichurri",
  "Empanada",
  "Milanesa",
  "Asado",
  "Matambre",
  "Morcilla",
  "Dulce de leche",
  "Alfajor",
  "Medialuna",
  "Flan",
  "Tortilla de papa",
  "Ñoquis",
  "Fainá",
  "Locro",
  "Mate",
  "Fernet",
  "Vermut",
  "Pan casero",
  "Papas fritas",
  "Panqueque",
  "Pizza a la piedra",
  "Bondiola",
];

/** Lo que hay en una barra y alrededor de una mesa de pool. */
const BAR = [
  "Coctelera",
  "Hielo",
  "Limón",
  "Posavasos",
  "Brindis",
  "Propina",
  "Taco de pool",
  "Tiza",
  "Paleta de ping pong",
  "Bola ocho",
  "Barra",
  "Banqueta",
  "Copa",
  "Vaso de whisky",
  "Sifón",
  "Rodaja de naranja",
  "Destapador",
  "Playlist",
  "Mesa de afuera",
  "La cuenta",
];

/** La ciudad. Sitios que cualquiera de La Plata conoce. */
const LA_PLATA = [
  "La Catedral",
  "El Bosque",
  "Plaza Moreno",
  "Pasaje Dardo Rocha",
  "Museo de Ciencias Naturales",
  "República de los Niños",
  "Estadio Único",
  "Teatro Argentino",
  "Calle 8",
  "Diagonal 74",
  "Plaza Italia",
  "City Bell",
  "Meridiano V",
  "El Planetario",
  "Estudiantes",
  "Gimnasia",
  "La terminal",
  "Facultad",
];

/**
 * Las categorías para elegir. "La carta" sale de lo que hay de verdad esta noche: los tragos con
 * nombre de la casa y lo que se pide en la barra. Si no llega a tener con qué jugar, no se ofrece.
 */
export function categorias(deLaCarta: string[]): Categoria[] {
  const carta = [...new Set(deLaCarta.map((p) => p.trim()).filter(Boolean))];
  return [
    ...(carta.length >= 8 ? [{ clave: "carta", nombre: "La carta de la casa", palabras: carta }] : []),
    { clave: "cocina", nombre: "Cocina", palabras: COCINA },
    { clave: "bar", nombre: "El bar", palabras: BAR },
    { clave: "laplata", nombre: "La Plata", palabras: LA_PLATA },
  ];
}

export type Ronda = {
  palabra: string;
  /** Quién es el impostor, contando desde 0. */
  impostor: number;
  /** Quién arranca a hablar. Nunca el impostor: arrancar sin saber la palabra es perder de entrada. */
  empieza: number;
};

/**
 * Arma una ronda. `azar` devuelve un número entre 0 y 1, como Math.random; se pasa de afuera para
 * poder probarla. `evitar` son las palabras que ya salieron, para no repetir en la misma mesa.
 */
export function armarRonda(jugadores: number, palabras: string[], azar: () => number, evitar: string[] = []): Ronda {
  const n = Math.min(MAX_JUGADORES, Math.max(MIN_JUGADORES, Math.floor(jugadores)));
  const frescas = palabras.filter((p) => !evitar.includes(p));
  const mazo = frescas.length > 0 ? frescas : palabras;
  const palabra = mazo[Math.floor(azar() * mazo.length) % mazo.length];
  const impostor = Math.floor(azar() * n) % n;
  // Arranca cualquiera menos el impostor: se elige entre los otros n-1 y se saltea su lugar.
  let empieza = Math.floor(azar() * (n - 1)) % (n - 1);
  if (empieza >= impostor) empieza += 1;
  return { palabra, impostor, empieza };
}

/** Largo máximo de un nombre en la mesa: que entre en un botón del celu. */
export const MAX_NOMBRE = 16;

/** El nombre de un lugar de la mesa. Si lo dejaron vacío, "Jugador N" (contando desde 1). */
export function nombreDe(nombres: string[], i: number): string {
  const n = (nombres[i] ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE);
  return n || `Jugador ${i + 1}`;
}

/**
 * Los nombres guardados de la última partida (vienen de localStorage: puede haber cualquier cosa).
 * Devuelve una lista de MIN_JUGADORES a MAX_JUGADORES textos, o null si no sirve.
 */
export function leerNombres(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v) || v.length < MIN_JUGADORES) return null;
    return v.slice(0, MAX_JUGADORES).map((x) => (typeof x === "string" ? x.slice(0, MAX_NOMBRE) : ""));
  } catch {
    return null;
  }
}

/** El orden en que se habla: arranca `empieza` y sigue la ronda. */
export function ordenDeRonda(jugadores: number, empieza: number): number[] {
  return Array.from({ length: jugadores }, (_, k) => (empieza + k) % jugadores);
}
