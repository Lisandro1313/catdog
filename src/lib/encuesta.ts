import { prisma } from "./prisma";
import { contar, MAX_OPCIONES, MAX_PREGUNTA, MIN_OPCIONES, parsearOpciones, type EncuestaVista } from "./encuesta-tipos";

export * from "./encuesta-tipos";

/** La encuesta de un tema, ya contada. Null si ese tema no tiene. */
export async function getEncuesta(temaId: string, deviceKey: string | null): Promise<EncuestaVista | null> {
  const e = await prisma.encuesta.findUnique({
    where: { temaId },
    include: { votos: { select: { opcion: true, deviceKey: true } } },
  });
  if (!e) return null;
  const opciones = contar(e.opciones, e.votos, deviceKey);
  return {
    id: e.id,
    pregunta: e.pregunta,
    opciones,
    total: e.votos.length,
    vote: opciones.some((o) => o.mia),
  };
}

/** Qué temas tienen encuesta, para marcarlos en la lista sin pedir una consulta por tema. */
export async function temasConEncuesta(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const filas = await prisma.encuesta.findMany({ where: { temaId: { in: ids } }, select: { temaId: true } });
  return new Set(filas.map((f) => f.temaId));
}

/**
 * Votar, o cambiar el voto.
 *
 * Se puede cambiar a propósito: castigar un toque equivocado con "ya votaste, aguantátela" es la
 * clase de detalle que hace que alguien no vuelva a tocar nada.
 */
export async function votar(encuestaId: string, opcion: number, deviceKey: string): Promise<void> {
  const e = await prisma.encuesta.findUnique({ where: { id: encuestaId }, select: { opciones: true } });
  if (!e) return;
  if (!Number.isInteger(opcion) || opcion < 0 || opcion >= e.opciones.length) return;
  await prisma.votoEncuesta.upsert({
    where: { encuestaId_deviceKey: { encuestaId, deviceKey } },
    update: { opcion },
    create: { encuestaId, opcion, deviceKey },
  });
}

// ---------- panel ----------

/**
 * Pone (o reemplaza) la encuesta de un tema.
 *
 * Reemplazar borra los votos: si cambian las opciones, los votos viejos ya no quieren decir lo
 * mismo. Devuelve false si no hay con qué armarla.
 */
export async function ponerEncuesta(temaId: string, pregunta: string, opcionesRaw: string): Promise<boolean> {
  const p = pregunta.replace(/\s+/gu, " ").trim().slice(0, MAX_PREGUNTA);
  const opciones = parsearOpciones(opcionesRaw);
  if (p.length < 3 || opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) return false;
  await prisma.encuesta.upsert({
    where: { temaId },
    update: { pregunta: p, opciones, votos: { deleteMany: {} } },
    create: { temaId, pregunta: p, opciones },
  });
  return true;
}

export async function borrarEncuesta(temaId: string): Promise<void> {
  await prisma.encuesta.deleteMany({ where: { temaId } });
}
