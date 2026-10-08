/**
 * La Generala, como se juega en cualquier mesa argentina, para uno solo: once turnos, uno por
 * casillero, y gana el que más suma. Esta parte no tiene pantalla: lo que vale cada jugada se decide
 * acá y tiene tests.
 *
 * Cada turno: hasta tres tiradas, guardando los dados que uno quiere. Lo que sale en la primera
 * tirada es "servido" y vale más.
 *
 * Reglas elegidas (hay variantes según la mesa):
 *  - Escalera: 1-2-3-4-5, 2-3-4-5-6 o la "escalera al as" 3-4-5-6-1.
 *  - Generala servida: en la mesa de verdad gana la partida. Jugando solo no hay a quién ganarle, así
 *    que vale 100: el doble de una generala común, y la jugada que todos quieren sacar.
 *  - Doble generala: solo si ya se anotó una generala (no si se tachó).
 */

export const DADOS = 5;
export const TIRADAS = 3;

export const CASILLEROS = [
  { clave: "1", nombre: "Unos" },
  { clave: "2", nombre: "Doses" },
  { clave: "3", nombre: "Treses" },
  { clave: "4", nombre: "Cuatros" },
  { clave: "5", nombre: "Cincos" },
  { clave: "6", nombre: "Seises" },
  { clave: "escalera", nombre: "Escalera" },
  { clave: "full", nombre: "Full" },
  { clave: "poker", nombre: "Póker" },
  { clave: "generala", nombre: "Generala" },
  { clave: "doble", nombre: "Doble generala" },
] as const;

export type Casillero = (typeof CASILLEROS)[number]["clave"];
/** Lo anotado en cada casillero. Sin clave: todavía libre. 0: tachado. */
export type Planilla = Partial<Record<Casillero, number>>;

/** Lo máximo que se puede hacer en una partida: sirve para descartar puntajes imposibles. */
export const MAXIMO = 1 * 5 + 2 * 5 + 3 * 5 + 4 * 5 + 5 * 5 + 6 * 5 + 25 + 35 + 45 + 100 + 100;

function cuentas(dados: number[]): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dados) c[d]++;
  return c;
}

function esEscalera(dados: number[]): boolean {
  const s = [...new Set(dados)].sort((a, b) => a - b).join("");
  return s === "12345" || s === "23456" || s === "13456";
}

/**
 * Cuánto vale anotar estos dados en un casillero. 0 si no cumple (anotarlo es tacharlo).
 * `servido`: salió en la primera tirada del turno.
 */
export function puntaje(dados: number[], casillero: Casillero, servido: boolean, planilla: Planilla = {}): number {
  if (dados.length !== DADOS) return 0;
  const c = cuentas(dados);
  const mayor = Math.max(...c);
  switch (casillero) {
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6": {
      const n = Number(casillero);
      return c[n] * n;
    }
    case "escalera":
      return esEscalera(dados) ? (servido ? 25 : 20) : 0;
    case "full":
      return c.includes(3) && c.includes(2) ? (servido ? 35 : 30) : 0;
    case "poker":
      return mayor >= 4 ? (servido ? 45 : 40) : 0;
    case "generala":
      return mayor === 5 ? (servido ? 100 : 50) : 0;
    case "doble":
      // La doble pide una generala ya anotada: si la generala se tachó, no hay doble.
      return mayor === 5 && (planilla.generala ?? 0) > 0 ? 100 : 0;
  }
}

/** Los casilleros que quedan libres. */
export function libres(planilla: Planilla): Casillero[] {
  return CASILLEROS.map((c) => c.clave).filter((k) => planilla[k] === undefined);
}

export function total(planilla: Planilla): number {
  return Object.values(planilla).reduce<number>((n, v) => n + (v ?? 0), 0);
}

export function terminada(planilla: Planilla): boolean {
  return libres(planilla).length === 0;
}

/**
 * Qué daría cada casillero libre con estos dados, de lo que más suma a lo que menos. La pantalla lo
 * muestra para que se vea la jugada, no para jugar sola: elegir sigue siendo de uno.
 */
export function opciones(dados: number[], servido: boolean, planilla: Planilla): { casillero: Casillero; puntos: number }[] {
  return libres(planilla)
    .map((k) => ({ casillero: k, puntos: puntaje(dados, k, servido, planilla) }))
    .sort((a, b) => b.puntos - a.puntos);
}

/** La jugada con nombre, para festejarla: "¡Generala servida!", "Full", o nada. */
export function nombreDeJugada(dados: number[], servido: boolean): string | null {
  const c = cuentas(dados);
  const mayor = Math.max(...c);
  const s = servido ? " servida" : "";
  if (mayor === 5) return `¡Generala${s}!`;
  if (mayor === 4) return `Póker${servido ? " servido" : ""}`;
  if (c.includes(3) && c.includes(2)) return `Full${servido ? " servido" : ""}`;
  if (esEscalera(dados)) return `Escalera${s}`;
  return null;
}
