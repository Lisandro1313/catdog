/**
 * Tipos y formato chico del guion de ¿Quién te contó?. Sin datos de historia: eso vive en
 * `guion.ts` (temporada 1), `t2.ts` (temporada 2) y `confidentes/*` (los vínculos con rangos).
 *
 * Formato de líneas:
 *
 *   vera/picara: Texto          → habla Vera, con cara pícara
 *   vera!: Texto                → habla Vera con "golpe" (sacudón + sonido)
 *   Texto suelto                → narración
 *   !Texto suelto               → narración con golpe
 *   [marca] ...                 → la línea solo sale si se tiene esa marca
 *   [-marca] ...                → la línea solo sale si NO se tiene esa marca
 *
 * `{nombre}` se reemplaza por el nombre que puso quien juega.
 */

/** Vínculos de la temporada 1 (afinidad suelta, sin rangos). */
export const VINCULOS = ["vera", "teo", "mora", "gris"] as const;
export type Vinculo = (typeof VINCULOS)[number];

/** Confidentes de la temporada 2: rangos del 1 al 10, una escena por rango. */
export const CONFIDENTES = ["vera", "teo", "mora", "dante", "sol"] as const;
export type Confidente = (typeof CONFIDENTES)[number];
export const RANGO_MAX = 10;

/** Cualidades de quien juega (a la manera de Persona). */
export const STATS = ["encanto", "coraje", "labia"] as const;
export type Stat = (typeof STATS)[number];
export const STAT_MAX = 6;

export const HABLANTES = ["narra", "yo", "vera", "teo", "mora", "gris", "gervasio", "lisandro", "agustin", "gato", "dante", "sol", "amalia"] as const;
export type Hablante = (typeof HABLANTES)[number];
export type Quien = Exclude<Hablante, "narra" | "yo">;

export const CARAS = ["normal", "feliz", "sonrisa", "picara", "triste", "enojo", "sorpresa", "serio", "sonrojo", "guino"] as const;
export type Cara = (typeof CARAS)[number];

export const FONDOS = [
  "puerta",
  "barra",
  "pool",
  "cocina",
  "vereda",
  "pasillo",
  "plaza",
  "rana",
  "terraza",
  "ensayo",
  "guardia",
  "diagonal",
  "oscuro",
  "bosque",
  "oficina",
  "depto",
] as const;
export type Fondo = (typeof FONDOS)[number];

/** Escenas ilustradas: se desbloquean en la galería. */
export const CGS = ["cg-sol-techo", "cg-beso", "cg-vera-barra", "cg-vera", "cg-teo", "cg-mora", "cg-dante", "cg-sol", "cg-celos", "cg-casa", "cg-gervasio"] as const;
export type CgId = (typeof CGS)[number];

export const DIAS = ["lunes", "jueves", "viernes", "sabado", "epilogo"] as const;
export type Dia = (typeof DIAS)[number];

export type Condicion =
  | { vinculo: Vinculo; min: number }
  | { rango: Confidente; min: number }
  | { stat: Stat; min: number }
  | { marca: string }
  | { no: string }
  | { total: number }
  | { todas: Condicion[] }
  | { alMenos: number; de: Condicion[] };

export type Linea = {
  /** Único en todo el guion: sirve para "saltar leídos". */
  id: string;
  quien: Hablante;
  cara: Cara;
  texto: string;
  golpe: boolean;
  si?: Condicion;
};

export type Opcion = {
  texto: string;
  efectos?: Partial<Record<Vinculo, number>>;
  stats?: Partial<Record<Stat, number>>;
  marcas?: string[];
  /** Si no se cumple, la opción no aparece. */
  requiere?: Condicion;
  /** Tiempo libre: ir a ver a este confidente (al próximo rango que toque). */
  rango?: Confidente;
  /** Lo que pasa justo después de elegir (puede estar vacío). */
  respuesta: Linea[];
  /** A dónde va después. Si falta, a `sigue` de la escena. "@final" = calcular el final; "@vuelta" = volver. */
  va?: string;
};

export type Escena = {
  id: string;
  /** Si falta (escenas de vínculo), es el día de la escena a la que se vuelve. */
  dia?: Dia;
  /** Temporada 2: semana 2 a 5. Si falta, semana 1 (o la de la vuelta). */
  semana?: number;
  temporada?: 1 | 2;
  fondo: Fondo;
  hora: string;
  /** Marca que se gana con solo entrar a la escena. */
  marca?: string;
  /** Escena ilustrada (reemplaza fondo y retrato). */
  cg?: CgId;
  /** Los personajes con ropa de salir. */
  noche?: boolean;
  /** Tiempo libre: elegir cualquier opción deja anotado volver a `sigue`. */
  libre?: boolean;
  /** Escena de vínculo: entrar sube el rango. */
  rango?: { de: Confidente; n: number };
  /** Lo que pide la escena de vínculo para estar disponible, y cómo se explica si falta. */
  pide?: Condicion;
  motivo?: string;
  /** Desvíos al terminar (el primero que se cumple). Al tomar uno, se vuelve después a `sigue`. */
  ramas?: { si: Condicion; va: string }[];
  lineas: Linea[];
  opciones?: Opcion[];
  sigue?: string;
  /** Si la escena es el cierre de un final: al terminarla, se termina el juego. */
  fin?: FinalId;
};

export const FINALES_IDS = [
  "verdadero",
  "vera",
  "teo",
  "mora",
  "casa",
  "abrigo",
  "lunes",
  "t2-verdadero",
  "t2-vera",
  "t2-teo",
  "t2-mora",
  "t2-dante",
  "t2-sol",
  "t2-celos",
  "t2-casa",
  "t2-abrigo",
  "t2-cerrado",
] as const;
export type FinalId = (typeof FINALES_IDS)[number];

export type Final = {
  id: FinalId;
  temporada: 1 | 2;
  titulo: string;
  /** Lo que se ve en la lista de finales cuando todavía no se consiguió. */
  pista: string;
  verdadero?: boolean;
  condicion: Condicion;
  escena: string;
};

// ─── El formato chico ────────────────────────────────────────────────────────────────────────

const ES_HABLANTE = new Set<string>(HABLANTES);
const ES_CARA = new Set<string>(CARAS);

export function parseLineas(base: string, src: string): Linea[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw, i) => {
      let t = raw;
      const conds: Condicion[] = [];
      for (let cond = /^\[(-?)([\w:-]+)\]\s*/.exec(t); cond; cond = /^\[(-?)([\w:-]+)\]\s*/.exec(t)) {
        const [, neg, marca] = cond;
        // [en:vera] → el romance con Vera está vivo (se eligió y no se cortó).
        if (!neg && marca.startsWith("en:") && (CONFIDENTES as readonly string[]).includes(marca.slice(3))) conds.push(enPareja(marca.slice(3) as Confidente));
        else conds.push(neg ? { no: marca } : { marca });
        t = t.slice(cond[0].length);
      }
      const si: Condicion | undefined = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : { todas: conds };
      const m = /^([a-z]+)(?:\/([a-z]+))?(!)?:\s+/.exec(t);
      if (m && ES_HABLANTE.has(m[1])) {
        const cara = m[2] ?? "normal";
        if (!ES_CARA.has(cara)) throw new Error(`Cara desconocida "${cara}" en ${base}:${i}`);
        return { id: `${base}:${i}`, quien: m[1] as Hablante, cara: cara as Cara, texto: t.slice(m[0].length), golpe: !!m[3], ...(si ? { si } : {}) };
      }
      const golpe = t.startsWith("!");
      return { id: `${base}:${i}`, quien: "narra" as const, cara: "normal" as const, texto: golpe ? t.slice(1).trim() : t, golpe, ...(si ? { si } : {}) };
    });
}

export type OpcionSrc = Omit<Opcion, "respuesta"> & { respuesta?: string };
export type EscenaSrc = Omit<Escena, "lineas" | "opciones" | "id"> & { texto: string; opciones?: OpcionSrc[] };

export function armar(src: Record<string, EscenaSrc>): Record<string, Escena> {
  const out: Record<string, Escena> = {};
  for (const [id, e] of Object.entries(src)) {
    const { texto, opciones, ...resto } = e;
    out[id] = {
      ...resto,
      id,
      lineas: parseLineas(id, texto),
      ...(opciones ? { opciones: opciones.map((o, k) => ({ ...o, respuesta: parseLineas(`${id}:o${k}`, o.respuesta ?? "") })) } : {}),
    };
  }
  return out;
}

export type RangoSrc = Omit<EscenaSrc, "rango" | "dia" | "semana" | "temporada"> & { pide?: Condicion; motivo?: string };

/**
 * Arma las diez escenas de un confidente: ids `vera-r1` … `vera-r10`, suben el rango al entrar y
 * vuelven solas a donde estaba la noche (`@vuelta`).
 */
export function armarRangos(de: Confidente, lista: RangoSrc[]): Record<string, Escena> {
  if (lista.length !== RANGO_MAX) throw new Error(`${de}: tiene ${lista.length} rangos, se esperaban ${RANGO_MAX}`);
  const src: Record<string, EscenaSrc> = {};
  lista.forEach((r, i) => {
    src[`${de}-r${i + 1}`] = { temporada: 2, sigue: "@vuelta", ...r, rango: { de, n: i + 1 } };
  });
  return armar(src);
}

/** Un romance está vivo si se eligió en el rango 8 y no se cortó después. */
export const enPareja = (c: Confidente): Condicion => ({ todas: [{ marca: `amor:${c}` }, { no: `corte:${c}` }] });

export const idRango = (de: Confidente, n: number) => `${de}-r${n}`;
