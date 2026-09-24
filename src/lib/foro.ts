import { prisma } from "./prisma";
import { limpiarNombre, limpiarTexto, MAX_TEXTO, MAX_TITULO, type RespuestaRow, type TemaRow } from "./foro-tipos";

export * from "./foro-tipos";

/**
 * La sobremesa: temas que abre cualquiera (la casa o quien vino) y la charla que se arma abajo.
 * Se publica al instante —si hay que pedir permiso, nadie escribe— y desde el panel se oculta o se fija.
 * La identidad es el nombre que cada uno pone más la cookie del teléfono: sin cuentas ni contraseñas.
 */

export class ForoError extends Error {}

/**
 * Los temas para mostrar: primero los fijados y después por última actividad.
 * Los ocultos no salen nunca acá (el panel los ve por su cuenta).
 */
export async function getTemas(deviceKey: string | null, limit = 50): Promise<TemaRow[]> {
  const rows = await prisma.tema.findMany({
    where: { hiddenAt: null },
    orderBy: [{ pinned: "desc" }, { lastAt: "desc" }],
    take: limit,
    include: {
      event: { select: { title: true } },
      _count: { select: { respuestas: { where: { hiddenAt: null } } } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    text: t.text,
    author: t.authorName,
    fromHouse: t.fromHouse,
    pinned: t.pinned,
    createdAt: t.createdAt,
    lastAt: t.lastAt,
    respuestas: t._count.respuestas,
    mio: Boolean(deviceKey) && t.deviceKey === deviceKey,
    eventTitle: t.event?.title ?? null,
  }));
}

export async function getTema(id: string, deviceKey: string | null) {
  const t = await prisma.tema.findFirst({
    where: { id, hiddenAt: null },
    include: {
      event: { select: { title: true } },
      respuestas: { where: { hiddenAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) return null;
  const tema: TemaRow = {
    id: t.id,
    title: t.title,
    text: t.text,
    author: t.authorName,
    fromHouse: t.fromHouse,
    pinned: t.pinned,
    createdAt: t.createdAt,
    lastAt: t.lastAt,
    respuestas: t.respuestas.length,
    mio: Boolean(deviceKey) && t.deviceKey === deviceKey,
    eventTitle: t.event?.title ?? null,
  };
  const respuestas: RespuestaRow[] = t.respuestas.map((r) => ({
    id: r.id,
    text: r.text,
    author: r.authorName,
    fromHouse: r.fromHouse,
    createdAt: r.createdAt,
    mio: Boolean(deviceKey) && r.deviceKey === deviceKey,
  }));
  return { tema, respuestas };
}

export async function abrirTema(input: {
  title: string;
  text: string;
  author: string;
  deviceKey: string;
  eventId?: string | null;
  fromHouse?: boolean;
}): Promise<string> {
  const title = limpiarTexto(input.title, MAX_TITULO);
  const text = limpiarTexto(input.text, MAX_TEXTO);
  const author = limpiarNombre(input.author);
  if (title.length < 3) throw new ForoError("Poné un título, aunque sea corto.");
  if (text.length < 3) throw new ForoError("Escribí algo en el tema.");
  if (author.length < 2) throw new ForoError("Poné tu nombre.");

  // Dos temas iguales seguidos casi siempre son un doble toque en el botón.
  const repetido = await prisma.tema.findFirst({
    where: { deviceKey: input.deviceKey, title, createdAt: { gt: new Date(Date.now() - 10 * 60000) } },
    select: { id: true },
  });
  if (repetido) return repetido.id;

  const t = await prisma.tema.create({
    data: {
      title,
      text,
      authorName: author,
      deviceKey: input.deviceKey,
      eventId: input.eventId ?? null,
      fromHouse: input.fromHouse ?? false,
    },
  });
  return t.id;
}

export async function responder(input: { temaId: string; text: string; author: string; deviceKey: string; fromHouse?: boolean }): Promise<void> {
  const text = limpiarTexto(input.text, MAX_TEXTO);
  const author = limpiarNombre(input.author);
  if (text.length < 2) throw new ForoError("Escribí algo.");
  if (author.length < 2) throw new ForoError("Poné tu nombre.");

  const tema = await prisma.tema.findFirst({ where: { id: input.temaId, hiddenAt: null }, select: { id: true } });
  if (!tema) throw new ForoError("Ese tema ya no está.");

  // La respuesta y la marca de actividad del tema van juntas: si falla una, no queda la otra.
  await prisma.$transaction([
    prisma.respuesta.create({
      data: { temaId: tema.id, text, authorName: author, deviceKey: input.deviceKey, fromHouse: input.fromHouse ?? false },
    }),
    prisma.tema.update({ where: { id: tema.id }, data: { lastAt: new Date() } }),
  ]);
}

/** Cada uno puede borrar lo suyo: se oculta (queda en la base por si hay que revisarlo). */
export async function borrarMiTema(id: string, deviceKey: string): Promise<void> {
  await prisma.tema.updateMany({ where: { id, deviceKey, hiddenAt: null }, data: { hiddenAt: new Date() } });
}

export async function borrarMiRespuesta(id: string, deviceKey: string): Promise<void> {
  await prisma.respuesta.updateMany({ where: { id, deviceKey, hiddenAt: null }, data: { hiddenAt: new Date() } });
}

/** Cuántos temas abrió este teléfono hoy: el freno de verdad contra el spam. */
export async function temasDeHoy(deviceKey: string): Promise<number> {
  return prisma.tema.count({ where: { deviceKey, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60000) } } });
}

// ---------- panel ----------

export async function getTemasAdmin(limit = 200) {
  return prisma.tema.findMany({
    orderBy: [{ pinned: "desc" }, { lastAt: "desc" }],
    take: limit,
    include: {
      event: { select: { title: true } },
      respuestas: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function ocultarTema(id: string, ocultar: boolean) {
  await prisma.tema.update({ where: { id }, data: { hiddenAt: ocultar ? new Date() : null } });
}

export async function fijarTema(id: string, fijar: boolean) {
  await prisma.tema.update({ where: { id }, data: { pinned: fijar } });
}

export async function ocultarRespuesta(id: string, ocultar: boolean) {
  await prisma.respuesta.update({ where: { id }, data: { hiddenAt: ocultar ? new Date() : null } });
}

export async function borrarTemaDefinitivo(id: string) {
  await prisma.tema.delete({ where: { id } });
}
