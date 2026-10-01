import { prisma } from "./prisma";
import { limpiarOrigen, normalizarTelefono, type Resultado } from "./avisos-tipos";

/**
 * La lista de avisos: gente que dejó su WhatsApp para que le contemos qué hay esta semana.
 *
 * Con la casa abierta no hay reserva, así que los contactos no salen más de Reservation: el que
 * entra a la página, mira la carta y se va no deja ningún rastro. Esto es lo único que queda.
 * Se guarda lo mínimo: el número, el nombre si lo dejó, y de qué parte de la página salió.
 */

export * from "./avisos-tipos";

/**
 * Anotar a alguien. Si el número ya estaba no se duplica ni se pisa la fecha de cuando entró;
 * si se había dado de baja y vuelve, vuelve a entrar.
 */
export async function anotarse(input: { phone: string; nombre?: string; de?: string }): Promise<Resultado> {
  const phone = normalizarTelefono(input.phone);
  if (!phone) return "invalido";
  const nombre = (input.nombre ?? "").trim().slice(0, 60);
  const de = limpiarOrigen(input.de ?? "");

  const existente = await prisma.avisado.findUnique({ where: { phone }, select: { id: true } });
  if (existente) {
    await prisma.avisado.update({ where: { phone }, data: { bajaAt: null, ...(nombre ? { nombre } : {}) } });
    return "repetido";
  }
  await prisma.avisado.create({ data: { phone, nombre, de } });
  return "nuevo";
}

/** Los que están en la lista hoy, el último primero. */
export async function getAvisados() {
  return prisma.avisado.findMany({ where: { bajaAt: null }, orderBy: { createdAt: "desc" }, take: 500 });
}

export async function contarAvisados(): Promise<number> {
  return prisma.avisado.count({ where: { bajaAt: null } });
}

/** Se dio de baja. No se borra: si vuelve a anotarse queremos saber que ya había estado. */
export async function darDeBaja(id: string): Promise<void> {
  await prisma.avisado.updateMany({ where: { id, bajaAt: null }, data: { bajaAt: new Date() } });
}

/**
 * Cuántos dejaron el WhatsApp desde cada lado. Es la segunda mitad del embudo: las visitas dicen
 * cuánta gente llegó desde Instagram, esto dice cuántos de esos dejaron algo.
 */
export async function avisadosPorOrigen(): Promise<{ de: string; cuantos: number }[]> {
  const filas = await prisma.avisado.groupBy({
    by: ["de"],
    where: { bajaAt: null },
    _count: { _all: true },
  });
  return filas
    .map((f) => ({ de: f.de || "directo", cuantos: f._count._all }))
    .sort((a, b) => b.cuantos - a.cuantos);
}
