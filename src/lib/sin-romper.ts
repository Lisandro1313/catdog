/**
 * Para que una parte secundaria que falla no se lleve puesta la pantalla entera.
 *
 * En una pantalla del panel conviven cosas de distinto peso. Si falla lo principal —la caja, las
 * reservas— la pantalla tiene que avisar y no mostrar números a medias. Pero si falla algo de al
 * lado —la matriz de la carta, el último análisis— es mucho peor perder toda la pantalla que
 * quedarse sin ese pedazo: el que está atendiendo necesita lo demás igual.
 *
 * Esto envuelve solo lo secundario. Lo principal se deja fallar a propósito.
 */

/** Corre la promesa; si se rompe, devuelve el repuesto y deja el error anotado. */
export async function sinRomper<T>(promesa: Promise<T>, repuesto: T, queEra: string): Promise<T> {
  try {
    return await promesa;
  } catch (err) {
    // Queda en los registros de Vercel con el nombre de la sección, para poder encontrarlo.
    console.error(`No se pudo traer ${queEra}:`, err);
    return repuesto;
  }
}
