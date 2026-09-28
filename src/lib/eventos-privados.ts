import { prisma } from "./prisma";
import { parsePaquetes, type Estado, type Paquete } from "./eventos-tipos";

export * from "./eventos-tipos";

/**
 * Eventos privados: la casa cerrada para un grupo, con fecha pedida por ellos.
 * El presupuesto se cierra a mano (cada evento es distinto); acá vive la configuración
 * y las consultas que entran por la página.
 */

const KEYS = {
  activos: "eventos:activos",
  publicarPrecios: "eventos:publicar_precios",
  paquetes: "eventos:paquetes",
  mesa: "eventos:mesa",
  texto: "eventos:texto",
  aclaraciones: "eventos:aclaraciones",
} as const;

const PAQUETES_DEFAULT = [
  "Los pocos | 8 | 0 | Cinco tapeos para compartir; dos bebidas por cabeza (cerveza, trago o sin alcohol); la casa para ustedes",
  "La juntada | 15 | 0 | Siete tapeos para compartir; dos bebidas por cabeza; la casa para ustedes; música a pedido",
  "La casa entera | 25 | 0 | Siete tapeos y algo dulce; dos bebidas por cabeza; la casa para ustedes; música a pedido",
].join("\n");

const TEXTO_DEFAULT =
  "¿Querés hacer tu evento acá? Cerramos la casa para tu grupo: tapeo para compartir, la barra andando y el lugar entero para ustedes. Cumpleaños, un cierre de año, una junta de amigos que se ve poco. Escribinos y te pasamos el presupuesto.";

const ACLARACIONES_DEFAULT = [
  "Contanos cuántos son y para cuándo, y te pasamos el presupuesto cerrado por mensaje.",
  "La fecha se toma con la seña: la mitad al reservar y el resto el día del evento.",
  "Con esa seña compramos lo de tu noche. Por eso se arma con anticipación y no sobre la hora.",
  "Lo que tomen de más se paga en la barra, al precio de siempre.",
].join("\n");

/** Cuánto se pide de seña para tomar la fecha. La mitad alcanza para comprar sin poner plata de la casa. */
export const SENA_PORCENTAJE = 50;

export type ConfigEventos = {
  activos: boolean;
  /** Si los precios por persona salen en la página o se pasan por mensaje. */
  publicarPrecios: boolean;
  paquetes: Paquete[];
  paquetesRaw: string;
  /** Lo que sale la mesa de juegos para todo el evento. 0 = no se ofrece. */
  mesa: number;
  texto: string;
  aclaraciones: string[];
};

export async function getConfigEventos(): Promise<ConfigEventos> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const v = (k: string) => rows.find((r) => r.key === k)?.value?.trim();
  const raw = v(KEYS.paquetes) || PAQUETES_DEFAULT;
  const paquetes = parsePaquetes(raw);
  const mesa = Number((v(KEYS.mesa) ?? "").replace(/\D/gu, ""));
  return {
    // Por defecto están prendidos: si la casa carga los paquetes, es porque los quiere mostrar.
    activos: (v(KEYS.activos) ?? "si") === "si",
    // Por defecto no se publican: cada evento se cotiza y se pasa por mensaje.
    publicarPrecios: v(KEYS.publicarPrecios) === "si",
    paquetes: paquetes.length > 0 ? paquetes : parsePaquetes(PAQUETES_DEFAULT),
    paquetesRaw: raw,
    mesa: Number.isFinite(mesa) && mesa > 0 ? mesa : 50000,
    texto: v(KEYS.texto) || TEXTO_DEFAULT,
    aclaraciones: (v(KEYS.aclaraciones) || ACLARACIONES_DEFAULT).split("\n").map((x) => x.trim()).filter(Boolean),
  };
}

export async function setConfigEventos(input: {
  activos?: boolean;
  publicarPrecios?: boolean;
  paquetes?: string;
  mesa?: number;
  texto?: string;
  aclaraciones?: string;
}) {
  const pares: [string, string][] = [];
  if (input.activos !== undefined) pares.push([KEYS.activos, input.activos ? "si" : "no"]);
  if (input.publicarPrecios !== undefined) pares.push([KEYS.publicarPrecios, input.publicarPrecios ? "si" : "no"]);
  if (input.paquetes !== undefined) pares.push([KEYS.paquetes, input.paquetes.trim().slice(0, 1500)]);
  if (input.mesa !== undefined) pares.push([KEYS.mesa, String(Math.max(0, Math.round(input.mesa)))]);
  if (input.texto !== undefined) pares.push([KEYS.texto, input.texto.trim().slice(0, 500)]);
  if (input.aclaraciones !== undefined) pares.push([KEYS.aclaraciones, input.aclaraciones.trim().slice(0, 800)]);
  await prisma.$transaction(
    pares.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

// ---------- las consultas ----------

export class EventoError extends Error {}

export async function pedirEvento(input: {
  name: string;
  contacto: string;
  email: string | null;
  fecha: string;
  personas: number;
  paquete: string | null;
  conMesa: boolean;
  mensaje: string | null;
  ipHash: string | null;
}): Promise<string> {
  const name = input.name.replace(/\s+/gu, " ").trim().slice(0, 60);
  const contacto = input.contacto.trim().slice(0, 60);
  const fecha = input.fecha.trim().slice(0, 60);
  if (name.length < 2) throw new EventoError("Poné tu nombre.");
  if (contacto.length < 6) throw new EventoError("Dejanos un WhatsApp o un mail para contestarte.");
  if (fecha.length < 3) throw new EventoError("Decinos para cuándo sería.");

  // Dos veces el mismo pedido en pocos minutos es un doble toque, no dos fiestas.
  const repetido = await prisma.pedidoEvento.findFirst({
    where: { contacto, fecha, createdAt: { gt: new Date(Date.now() - 10 * 60000) } },
    select: { id: true },
  });
  if (repetido) return repetido.id;

  const row = await prisma.pedidoEvento.create({
    data: {
      name,
      contacto,
      email: input.email?.trim().slice(0, 120) || null,
      fecha,
      personas: Math.max(1, Math.min(60, Math.round(input.personas))),
      paquete: input.paquete?.slice(0, 60) || null,
      conMesa: input.conMesa,
      mensaje: input.mensaje?.trim().slice(0, 600) || null,
      ipHash: input.ipHash,
    },
  });
  return row.id;
}

export async function getPedidos(limit = 100) {
  return prisma.pedidoEvento.findMany({ orderBy: [{ createdAt: "desc" }], take: limit });
}

export async function setEstadoPedido(id: string, estado: Estado, extra?: { presupuesto?: number | null; sena?: number | null; notas?: string | null }) {
  await prisma.pedidoEvento.update({
    where: { id },
    data: {
      estado,
      updatedAt: new Date(),
      ...(extra?.presupuesto !== undefined ? { presupuesto: extra.presupuesto } : {}),
      ...(extra?.sena !== undefined ? { sena: extra.sena } : {}),
      ...(extra?.notas !== undefined ? { notas: extra.notas } : {}),
    },
  });
}

export async function borrarPedido(id: string) {
  await prisma.pedidoEvento.delete({ where: { id } });
}

/** Cuántas consultas sin contestar hay, para avisar en el panel. */
export async function pedidosSinLeer(): Promise<number> {
  return prisma.pedidoEvento.count({ where: { estado: "consulta" } });
}
