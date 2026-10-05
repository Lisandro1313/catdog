import { prisma } from "./prisma";
import { contar, esEmoji, esSobre, type Conteo, type Sobre } from "./reacciones-tipos";

/**
 * Las reacciones de la sobremesa.
 *
 * Sin cuentas: lo único que identifica a alguien es la cookie del teléfono, la misma con la que ya
 * puede borrar lo suyo. Alcanza para que cada uno cuente una vez y para poder sacar la propia.
 */

export * from "./reacciones-tipos";

/** Pone o saca la reacción de esta persona. Devuelve si quedó puesta. */
export async function alternar(input: { sobre: string; objetoId: string; emoji: string; deviceKey: string }): Promise<boolean> {
  if (!esSobre(input.sobre) || !esEmoji(input.emoji) || !input.objetoId || !input.deviceKey) return false;
  const donde = { sobre: input.sobre, objetoId: input.objetoId, emoji: input.emoji, deviceKey: input.deviceKey };

  const ya = await prisma.reaccion.findFirst({ where: donde, select: { id: true } });
  if (ya) {
    await prisma.reaccion.delete({ where: { id: ya.id } });
    return false;
  }
  await prisma.reaccion.create({ data: donde });
  return true;
}

/**
 * Los conteos de varios mensajes de una, para no hacer una consulta por cada uno: una sobremesa
 * con treinta respuestas haría treinta consultas.
 */
export async function conteosDe(sobre: Sobre, ids: string[], miKey: string | null): Promise<Map<string, Conteo[]>> {
  const out = new Map<string, Conteo[]>();
  if (ids.length === 0) return out;
  const filas = await prisma.reaccion.findMany({
    where: { sobre, objetoId: { in: ids } },
    select: { objetoId: true, emoji: true, deviceKey: true },
  });
  for (const id of ids) {
    const suyas = filas.filter((f) => f.objetoId === id);
    if (suyas.length > 0) out.set(id, contar(suyas, miKey));
  }
  return out;
}

/** Al borrar un tema se van sus reacciones y las de sus respuestas: si no, quedan colgadas. */
export async function borrarReaccionesDe(temaId: string, respuestaIds: string[]): Promise<void> {
  await prisma.reaccion.deleteMany({
    where: { OR: [{ sobre: "tema", objetoId: temaId }, { sobre: "respuesta", objetoId: { in: respuestaIds } }] },
  });
}
