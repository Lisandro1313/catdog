/**
 * Las reglas de los juegos nuevos, sin pantalla: lo que decide un puntaje tiene que poder probarse.
 * Cada juego dibuja lo suyo, pero cuánto vale una jugada se decide acá.
 */

// ---------- 2048 de la barra ----------

/** Lo que va saliendo al juntar: del hielo al trago de autor. */
export const ESCALERA_2048: Record<number, { nombre: string; icono: string }> = {
  2: { nombre: "Hielo", icono: "🧊" },
  4: { nombre: "Limón", icono: "🍋" },
  8: { nombre: "Menta", icono: "🌿" },
  16: { nombre: "Soda", icono: "🫧" },
  32: { nombre: "Gin", icono: "🍸" },
  64: { nombre: "Gin tonic", icono: "🥂" },
  128: { nombre: "Negroni", icono: "🍷" },
  256: { nombre: "Vermut", icono: "🍾" },
  512: { nombre: "Hormiga Negra", icono: "🐜" },
  1024: { nombre: "De la Casa", icono: "🏠" },
  2048: { nombre: "El trago de la noche", icono: "✨" },
};

export type Tablero = number[][];
export type Direccion = "izq" | "der" | "arr" | "abj";

/** Junta una fila hacia la izquierda, como en el 2048 de siempre: cada ficha se junta una sola vez por jugada. */
export function juntarFila(fila: number[]): { fila: number[]; puntos: number } {
  const llenas = fila.filter((v) => v !== 0);
  const out: number[] = [];
  let puntos = 0;
  for (let i = 0; i < llenas.length; i++) {
    if (llenas[i] === llenas[i + 1]) {
      const v = llenas[i] * 2;
      out.push(v);
      puntos += v;
      i++;
    } else {
      out.push(llenas[i]);
    }
  }
  while (out.length < fila.length) out.push(0);
  return { fila: out, puntos };
}

function trasponer(t: Tablero): Tablero {
  return t[0].map((_, c) => t.map((f) => f[c]));
}

/** Mueve todo el tablero. `cambio` dice si la jugada hizo algo (si no, no sale ficha nueva). */
export function mover(t: Tablero, dir: Direccion): { tablero: Tablero; puntos: number; cambio: boolean } {
  let filas = dir === "arr" || dir === "abj" ? trasponer(t) : t.map((f) => [...f]);
  const alReves = dir === "der" || dir === "abj";
  let puntos = 0;
  filas = filas.map((f) => {
    const r = juntarFila(alReves ? [...f].reverse() : f);
    puntos += r.puntos;
    return alReves ? r.fila.reverse() : r.fila;
  });
  const tablero = dir === "arr" || dir === "abj" ? trasponer(filas) : filas;
  const cambio = tablero.some((f, i) => f.some((v, j) => v !== t[i][j]));
  return { tablero, puntos, cambio };
}

/** Pone una ficha nueva (90% hielo, 10% limón) en un lugar vacío. `azar` como Math.random. */
export function ponerFicha(t: Tablero, azar: () => number): Tablero {
  const vacias: [number, number][] = [];
  t.forEach((f, i) => f.forEach((v, j) => v === 0 && vacias.push([i, j])));
  if (vacias.length === 0) return t;
  const [i, j] = vacias[Math.floor(azar() * vacias.length) % vacias.length];
  const out = t.map((f) => [...f]);
  out[i][j] = azar() < 0.9 ? 2 : 4;
  return out;
}

/** Si queda alguna jugada posible. */
export function hayJugada(t: Tablero): boolean {
  return (["izq", "der", "arr", "abj"] as Direccion[]).some((d) => mover(t, d).cambio);
}

// ---------- La palabra de la casa ----------

/** Palabras de cinco letras, de la cocina y la barra. Sin tildes: se juega con el teclado de letras. */
export const PALABRAS = [
  "CHORI", "LIMON", "TAPAS", "PAPAS", "QUESO", "MENTA", "HIELO", "COPAS", "VINOS", "PIZZA",
  "CARNE", "SALSA", "PASTA", "ARROZ", "HUEVO", "PERAS", "CALDO", "TORTA", "CAFES", "MATES",
  "SODAS", "BARRA", "MOZOS", "PLATO", "VASOS", "TRAGO", "FUEGO", "BRASA", "PANES", "BIFES",
  "LOCRO", "GUISO", "PURES", "MANGO", "FRUTA", "DULCE", "LECHE", "OLIVA", "CREMA", "HORNO",
  "OLLAS", "TACOS", "SOPAS", "JUGOS", "TINTO", "MALTA", "GAJOS", "CEBAR", "COCOS",
];

export type Pista = "bien" | "esta" | "no";

/**
 * Cómo le fue a un intento, letra por letra, contando bien las repetidas: si la palabra tiene una
 * sola A y el intento pone dos, solo una puede salir amarilla o verde.
 */
export function evaluar(intento: string, palabra: string): Pista[] {
  const a = intento.toUpperCase().split("");
  const p = palabra.toUpperCase().split("");
  const out: Pista[] = a.map(() => "no");
  const sobran: Record<string, number> = {};
  a.forEach((l, i) => {
    if (l === p[i]) out[i] = "bien";
    else sobran[p[i]] = (sobran[p[i]] ?? 0) + 1;
  });
  a.forEach((l, i) => {
    if (out[i] === "bien") return;
    if ((sobran[l] ?? 0) > 0) {
      out[i] = "esta";
      sobran[l]--;
    }
  });
  return out;
}

// ---------- Armá el sánguche ----------

/**
 * Dónde queda la capa nueva sobre la anterior: lo que sobresale se cae. Si cae casi justo (a menos
 * de `perdon` de distancia) se acomoda sola y no se pierde nada: es lo que premia la puntería.
 */
export function apilar(abajo: { x: number; ancho: number }, nueva: { x: number; ancho: number }, perdon = 4): { x: number; ancho: number; perfecta: boolean } | null {
  if (Math.abs(nueva.x - abajo.x) <= perdon) return { x: abajo.x, ancho: abajo.ancho, perfecta: true };
  const izq = Math.max(abajo.x, nueva.x);
  const der = Math.min(abajo.x + abajo.ancho, nueva.x + nueva.ancho);
  const ancho = der - izq;
  if (ancho <= 0) return null;
  return { x: izq, ancho, perfecta: false };
}

// ---------- La parrilla ----------

/** Cuánto vale sacar un corte con este punto (0 = crudo, 1 = justo, más de 1 = se quema). */
export function puntoDelCorte(coccion: number): { puntos: number; como: "crudo" | "jugoso" | "perfecto" | "pasado" | "quemado" } {
  if (coccion >= 1.12) return { puntos: -2, como: "quemado" };
  if (coccion >= 0.78 && coccion <= 0.95) return { puntos: 3, como: "perfecto" };
  if (coccion >= 0.62 && coccion < 0.78) return { puntos: 1, como: "jugoso" };
  if (coccion > 0.95) return { puntos: 1, como: "pasado" };
  return { puntos: 0, como: "crudo" };
}

// ---------- Deslizá el vaso ----------

/**
 * Puntos de un tiro según dónde frenó el vaso respecto del centro del blanco (en fracción del largo
 * de la barra). Si se pasó del borde, se cayó: cero.
 */
export function puntosDelVaso(frenoEn: number, blanco: number, largo = 1): number {
  if (frenoEn > largo) return 0;
  const d = Math.abs(frenoEn - blanco);
  if (d <= 0.02) return 100;
  return Math.max(0, Math.round(100 - (d - 0.02) * 520));
}

// ---------- Dardos ----------

/** Los sectores en el orden del tablero, empezando por el 20 de arriba y siguiendo como las agujas del reloj. */
export const SECTORES_DARDOS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const;

/** Los radios de un tablero de reglamento, en milímetros desde el centro. */
export const ANILLOS_DARDOS = { bull: 6.35, bull25: 15.9, tripleDentro: 99, tripleFuera: 107, dobleDentro: 162, dobleFuera: 170 } as const;

export type Impacto = { puntos: number; mult: 0 | 1 | 2 | 3; sector: number; nombre: string };

/**
 * Cuánto vale un dardo clavado en (x, y), en milímetros desde el centro del tablero, con la y para
 * abajo como en la pantalla. Fuera del anillo de dobles no vale nada.
 */
export function puntoDelDardo(x: number, y: number): Impacto {
  const r = Math.hypot(x, y);
  const A = ANILLOS_DARDOS;
  if (r <= A.bull) return { puntos: 50, mult: 2, sector: 25, nombre: "Bull" };
  if (r <= A.bull25) return { puntos: 25, mult: 1, sector: 25, nombre: "25" };
  if (r > A.dobleFuera) return { puntos: 0, mult: 0, sector: 0, nombre: "Afuera" };
  // Ángulo desde arriba, como las agujas del reloj. Cada sector ocupa 18°, con el 20 centrado arriba.
  const grados = ((Math.atan2(x, -y) * 180) / Math.PI + 360 + 9) % 360;
  const sector = SECTORES_DARDOS[Math.floor(grados / 18) % 20];
  if (r >= A.tripleDentro && r <= A.tripleFuera) return { puntos: sector * 3, mult: 3, sector, nombre: `Triple ${sector}` };
  if (r >= A.dobleDentro) return { puntos: sector * 2, mult: 2, sector, nombre: `Doble ${sector}` };
  return { puntos: sector, mult: 1, sector, nombre: String(sector) };
}
