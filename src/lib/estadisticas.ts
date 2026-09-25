/**
 * Los números para decidir: cuánto hay que vender para no perder, en qué se va la plata y dónde
 * conviene meter mano.
 *
 * Puro y sin base de datos, para poder probarlo.
 */

/** Lo que cuesta producir un cubierto, aparte de los gastos que corren igual (alquiler, luz). */
export type EntradaEquilibrio = {
  /** Lo que se paga por semana pase lo que pase: alquiler, servicios, sueldos fijos. */
  fijosSemanales: number;
  /** A cuánto se vende el cubierto. */
  precio: number;
  /** Lo que cuesta la materia prima de ese cubierto. */
  costoPorCubierto: number;
};

export type Equilibrio = {
  /** Lo que deja cada cubierto después de su materia prima: con esto se pagan los fijos. */
  margen: number;
  /** Cuántos cubiertos hay que vender en la semana para no perder plata. */
  cubiertos: number | null;
  /** Cuánto hay que facturar para no perder. */
  facturacion: number | null;
  /** Qué parte del precio queda después de la materia prima, de 0 a 100. */
  margenPorcentual: number | null;
};

/**
 * El punto de equilibrio de verdad: no es "el promedio de gastos dividido el precio", porque cada
 * cubierto que se vende también cuesta. Lo que paga el alquiler es lo que sobra de cada venta
 * después de pagar su materia prima.
 */
export function puntoDeEquilibrio(e: EntradaEquilibrio): Equilibrio {
  const margen = Math.round(e.precio - e.costoPorCubierto);
  const margenPorcentual = e.precio > 0 ? (margen / e.precio) * 100 : null;
  // Si cada plato se vende a pérdida, vender más hunde más: no hay punto de equilibrio.
  if (margen <= 0) return { margen, cubiertos: null, facturacion: null, margenPorcentual };
  const cubiertos = Math.ceil(e.fijosSemanales / margen);
  return { margen, cubiertos, facturacion: cubiertos * e.precio, margenPorcentual };
}

export type GastoRubro = {
  categoria: string;
  etiqueta: string;
  monto: number;
  /** Lo mismo en el período anterior, para ver si se está yendo de las manos. */
  anterior?: number;
};

export type FilaRanking = GastoRubro & {
  /** Qué parte del total se lleva, de 0 a 100. */
  parte: number;
  /** Cuánto cambió contra el período anterior, de -100 en adelante. Null si no hay con qué comparar. */
  cambio: number | null;
};

/**
 * Los rubros ordenados por lo que se llevan. El primero es siempre por donde empezar: en un negocio
 * chico, unos pocos rubros se llevan casi todo, y tocar el más grande un 10% rinde más que tocar
 * cinco chicos a la mitad.
 */
export function rankingGastos(rubros: GastoRubro[]): { filas: FilaRanking[]; total: number } {
  const total = rubros.reduce((n, r) => n + r.monto, 0);
  const filas = rubros
    .filter((r) => r.monto > 0)
    .map((r) => ({
      ...r,
      parte: total > 0 ? (r.monto / total) * 100 : 0,
      cambio: r.anterior != null && r.anterior > 0 ? ((r.monto - r.anterior) / r.anterior) * 100 : null,
    }))
    .sort((a, b) => b.monto - a.monto);
  return { filas, total };
}

/**
 * Cuántos rubros hacen falta para llegar a la mayor parte del gasto. Sirve para decir "tocando estos
 * dos ya estás tocando el 70% de lo que gastás".
 */
export function rubrosQuePesan(filas: FilaRanking[], hasta = 70): { cuantos: number; parte: number } {
  let acumulado = 0;
  let cuantos = 0;
  for (const f of filas) {
    acumulado += f.parte;
    cuantos += 1;
    if (acumulado >= hasta) break;
  }
  return { cuantos, parte: Math.round(acumulado) };
}

/** Una semana para el gráfico. */
export type Semana = { etiqueta: string; ingresos: number; gastos: number };

export type PuntoGrafico = Semana & { resultado: number };

/** Prepara las semanas para dibujarlas, con el resultado ya calculado. */
export function serieSemanal(semanas: Semana[]): { puntos: PuntoGrafico[]; maximo: number } {
  const puntos = semanas.map((s) => ({ ...s, resultado: s.ingresos - s.gastos }));
  // La escala se toma del valor más grande en juego, para que las barras sean comparables entre sí.
  const maximo = puntos.reduce((n, p) => Math.max(n, Math.abs(p.resultado)), 0);
  return { puntos, maximo };
}
