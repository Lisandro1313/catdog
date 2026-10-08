/**
 * La racha de noches: cuántas noches distintas vino alguien a jugar, seguidas.
 *
 * "Seguidas" no puede ser día por día: es un bar, nadie viene todas las noches. La racha sigue
 * mientras entre una noche y la siguiente no pase más de una semana. Si se corta, vuelve a empezar
 * desde 1, sin más: no hay castigo ni mensaje, simplemente arranca de nuevo.
 *
 * Vive en el teléfono (localStorage). Esto es lo puro; la lectura y escritura está en el hub.
 */

/** Días sin venir que todavía no cortan la racha. */
export const HUECO_MAX = 7;
/** Cuántas noches se guardan como mucho (alcanza y sobra para la racha más larga que vamos a mostrar). */
const GUARDAR = 120;

const DIA = /^\d{4}-\d{2}-\d{2}$/u;

function aMs(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** Lee lo guardado: una lista de días "2026-10-08", limpia y ordenada. Lo roto se ignora. */
export function leerNoches(raw: string | null | undefined): string[] {
  try {
    const v: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(v)) return [];
    const dias = v.filter((x): x is string => typeof x === "string" && DIA.test(x) && Number.isFinite(aMs(x)));
    return [...new Set(dias)].sort();
  } catch {
    return [];
  }
}

/** Suma la noche de hoy (si no estaba). Devuelve la lista nueva, recortada a las últimas. */
export function sumarNoche(noches: string[], hoy: string): string[] {
  if (!DIA.test(hoy)) return noches;
  if (noches.includes(hoy)) return noches;
  return [...noches, hoy].sort().slice(-GUARDAR);
}

/**
 * La racha vigente al día `hoy`: noches distintas encadenadas (sin huecos de más de HUECO_MAX días)
 * que terminan en la última noche jugada. Si desde esa última noche ya pasó más del hueco, es 0:
 * la próxima vez que juegue, vuelve a 1.
 */
export function racha(noches: string[], hoy: string): number {
  const dias = [...new Set(noches.filter((d) => DIA.test(d) && d <= hoy))].sort();
  if (!dias.length) return 0;
  const DIA_MS = 86_400_000;
  if ((aMs(hoy) - aMs(dias[dias.length - 1])) / DIA_MS > HUECO_MAX) return 0;
  let n = 1;
  for (let i = dias.length - 1; i > 0; i--) {
    if ((aMs(dias[i]) - aMs(dias[i - 1])) / DIA_MS > HUECO_MAX) break;
    n++;
  }
  return n;
}

/** Las insignias de la racha: a las 3, 5 y 10 noches. La más alta alcanzada, o null. */
export function insigniaRacha(n: number): { icon: string; label: string } | null {
  if (n >= 10) return { icon: "🏠", label: "10 noches: de la casa" };
  if (n >= 5) return { icon: "✨", label: "5 noches: de confianza" };
  if (n >= 3) return { icon: "🥂", label: "3 noches: habitué" };
  return null;
}
