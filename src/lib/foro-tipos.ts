/**
 * La parte de la sobremesa que también usa el teléfono: topes, tipos y limpieza de texto.
 * Va aparte de `foro.ts` porque aquel habla con la base y no puede viajar al navegador.
 */

export const MAX_TITULO = 90;
export const MAX_TEXTO = 1500;
export const MAX_NOMBRE = 40;

export type TemaRow = {
  id: string;
  title: string;
  text: string;
  author: string;
  fromHouse: boolean;
  pinned: boolean;
  createdAt: Date;
  lastAt: Date;
  respuestas: number;
  mio: boolean;
  eventTitle: string | null;
  /** Null en lo que se escribió antes de que existieran: se lee como "Cualquiera". */
  categoria: string | null;
  /** Las reacciones que juntó, sumando las de sus respuestas: los puntos del tema. */
  puntos: number;
};

/** Las tres formas de mirar la lista. La de siempre es "lo último", que es lo que trae de vuelta. */
export const ORDENES = [
  { clave: "ultimo", nombre: "Lo último" },
  { clave: "hablado", nombre: "Lo más hablado" },
  { clave: "votado", nombre: "Lo más votado" },
] as const;

export type Orden = (typeof ORDENES)[number]["clave"];
export const ORDEN_POR_DEFECTO: Orden = "ultimo";

export function esOrden(x: string | null | undefined): x is Orden {
  return ORDENES.some((o) => o.clave === x);
}

export type RespuestaRow = {
  id: string;
  text: string;
  author: string;
  fromHouse: boolean;
  createdAt: Date;
  mio: boolean;
  /** La escribió el mismo teléfono que abrió el tema: en un hilo importa saber quién preguntó. */
  esAutor: boolean;
};

/**
 * El cartel de novedades de la sobremesa.
 *
 * Separa lo que te contestaron a vos de lo que se movió en los demás temas, porque no es lo mismo:
 * que alguien conteste algo tuyo es el único motivo por el que una persona vuelve sola a un foro.
 */
export function textoNovedades(mios: number, otros: number): string | null {
  if (mios === 0 && otros === 0) return null;
  const tuyos = mios === 1 ? "Te contestaron en un tema tuyo" : `Te contestaron en ${mios} temas tuyos`;
  const resto = otros === 1 ? "hay 1 tema con algo nuevo" : `hay ${otros} temas con algo nuevo`;
  if (mios === 0) return `${resto.charAt(0).toUpperCase()}${resto.slice(1)} desde la última vez.`;
  if (otros === 0) return `${tuyos}.`;
  return `${tuyos}, y ${resto}.`;
}

/** Un nombre presentable: sin espacios de más, sin saltos de línea y con un largo razonable. */
export function limpiarNombre(raw: string): string {
  return raw.replace(/\s+/gu, " ").trim().slice(0, MAX_NOMBRE);
}

/** El texto tal cual lo escribieron, pero sin saltos de línea de más ni espacios al final. */
export function limpiarTexto(raw: string, max: number): string {
  return raw.replace(/\r\n/gu, "\n").replace(/\n{3,}/gu, "\n\n").trim().slice(0, max);
}

/**
 * Las categorías de la sobremesa.
 *
 * Son pocas y las pone la casa: un foro chico donde cada uno inventa su etiqueta termina con
 * treinta categorías de un tema cada una, que es lo mismo que no tener ninguna. Estas salen de lo
 * que la gente ya habla en la mesa.
 *
 * La clave es lo que se guarda y viaja en el link; el nombre es lo que se lee.
 */
export const CATEGORIAS = [
  { clave: "recetas", nombre: "Recetas" },
  { clave: "musica", nombre: "Música" },
  { clave: "carta", nombre: "La carta" },
  { clave: "noche", nombre: "La noche" },
  { clave: "cualquiera", nombre: "Cualquiera" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["clave"];

/** La que se usa cuando no eligieron ninguna, y la de todo lo que se escribió antes de que existieran. */
export const CATEGORIA_POR_DEFECTO: Categoria = "cualquiera";

export function esCategoria(x: string | null | undefined): x is Categoria {
  return CATEGORIAS.some((c) => c.clave === x);
}

/** La categoría de un tema, tolerando lo viejo (sin categoría) y lo roto (una clave que ya no existe). */
export function categoriaDe(raw: string | null | undefined): Categoria {
  return esCategoria(raw) ? raw : CATEGORIA_POR_DEFECTO;
}

export function nombreCategoria(clave: string | null | undefined): string {
  const c = CATEGORIAS.find((x) => x.clave === categoriaDe(clave));
  return c ? c.nombre : "Cualquiera";
}
