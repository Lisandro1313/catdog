/**
 * Qué conviene vender: cruzar cuánto deja cada cosa con cuánto se pide.
 *
 * Es la matriz de ingeniería de menú, que es vieja y simple: cada plato cae en uno de cuatro
 * lugares según si deja mucho o poco y si se pide mucho o poco. Lo que cambia la ganancia no es
 * cocinar distinto, es mover de lugar en la carta lo que ya cocinás.
 *
 * Los dos umbrales no son inventados:
 * - **Popularidad**: se compara contra el 70% de lo que le tocaría a cada plato si todos se
 *   pidieran igual. Con diez platos, a cada uno le toca 10%; el corte queda en 7%.
 * - **Ganancia**: se compara contra lo que deja en promedio un plato vendido, pesando por cuánto se
 *   vendió cada uno (no es el promedio simple: un plato que se pide una vez no puede mover la vara).
 *
 * Puro y sin base de datos, para poder probarlo.
 */

export type Lugar = "estrella" | "caballo" | "incognita" | "perro";

export const LUGAR_LABEL: Record<Lugar, string> = {
  estrella: "Estrella",
  caballo: "Caballo de tiro",
  incognita: "Incógnita",
  perro: "Perro",
};

/** Qué hacer con cada uno, en criollo. */
export const LUGAR_QUE_HACER: Record<Lugar, string> = {
  estrella: "Deja bien y se pide. Cuidalo: no le cambies la receta ni lo bajes de lugar en la carta.",
  caballo: "Se pide mucho y deja poco. Subile un poco el precio o abaratá el acompañamiento, sin tocar lo que la gente viene a buscar.",
  incognita: "Deja bien pero casi nadie lo pide. Ponelo más arriba en la carta, contalo mejor o que lo recomiende quien atiende.",
  perro: "Ni deja ni se pide. Sacalo y liberá la compra y el lugar en la carta.",
};

export type PlatoVendido = {
  /** Como figura en la carta. */
  nombre: string;
  /** Cuántas veces se pidió en el período. */
  vendidos: number;
  /** A cuánto se vende. */
  precio: number;
  /** Lo que cuesta la materia prima de una porción. Null si no hay receta cargada. */
  costo: number | null;
};

export type FilaMatriz = PlatoVendido & {
  /** Lo que deja cada vez que se vende. */
  margen: number;
  /** Qué parte de lo pedido se lleva, de 0 a 100. */
  mix: number;
  /** Lo que dejó en total en el período. */
  aporte: number;
  lugar: Lugar;
};

export type Matriz = {
  filas: FilaMatriz[];
  /** Cuántas veces se pidió algo, en total. */
  total: number;
  /** La vara de popularidad, de 0 a 100. */
  corteMix: number;
  /** La vara de ganancia. */
  corteMargen: number;
  /** Los que no se pueden clasificar porque les falta la receta o el precio. */
  sinDatos: string[];
};

/**
 * Arma la matriz. Los platos sin receta cargada quedan afuera y se listan aparte: sin saber lo que
 * cuestan, ubicarlos sería adivinar.
 */
export function armarMatriz(platos: PlatoVendido[]): Matriz {
  const usables = platos.filter((p) => p.costo != null && p.precio > 0 && p.vendidos > 0);
  const sinDatos = platos.filter((p) => !usables.includes(p) && p.vendidos > 0).map((p) => p.nombre);

  const total = usables.reduce((n, p) => n + p.vendidos, 0);
  if (usables.length === 0 || total === 0) {
    return { filas: [], total: 0, corteMix: 0, corteMargen: 0, sinDatos };
  }

  const base = usables.map((p) => {
    const margen = Math.round(p.precio - (p.costo as number));
    return { ...p, margen, mix: (p.vendidos / total) * 100, aporte: margen * p.vendidos };
  });

  // La vara de popularidad: el 70% de lo que le tocaría a cada uno si todos se pidieran igual.
  const corteMix = (100 / usables.length) * 0.7;
  // La vara de ganancia: lo que deja en promedio un plato vendido, pesado por lo que se vendió.
  const aporteTotal = base.reduce((n, p) => n + p.aporte, 0);
  const corteMargen = Math.round(aporteTotal / total);

  const filas = base
    .map((p) => {
      const pide = p.mix >= corteMix;
      const deja = p.margen >= corteMargen;
      const lugar: Lugar = pide ? (deja ? "estrella" : "caballo") : deja ? "incognita" : "perro";
      return { ...p, lugar };
    })
    // Primero lo que más plata deja en total: por ahí se empieza a mirar.
    .sort((a, b) => b.aporte - a.aporte);

  return { filas, total, corteMix, corteMargen, sinDatos };
}

/** Un resumen en una línea, para leer sin mirar la tabla. */
export function resumenMatriz(m: Matriz): string | null {
  if (m.filas.length === 0) return null;
  const cuenta = (l: Lugar) => m.filas.filter((f) => f.lugar === l).length;
  const perros = cuenta("perro");
  const caballos = cuenta("caballo");
  const incognitas = cuenta("incognita");
  if (perros > 0) return `Hay ${perros} ${perros === 1 ? "plato que no deja ni se pide" : "platos que no dejan ni se piden"}: sacarlos es lo más fácil.`;
  if (caballos > 0) return `Hay ${caballos} ${caballos === 1 ? "plato que se pide mucho y deja poco" : "platos que se piden mucho y dejan poco"}: ahí hay margen para ganar.`;
  if (incognitas > 0) return `Hay ${incognitas} ${incognitas === 1 ? "plato que deja bien y casi nadie pide" : "platos que dejan bien y casi nadie pide"}: falta contarlos mejor.`;
  return "La carta está equilibrada: lo que se pide es lo que deja.";
}
