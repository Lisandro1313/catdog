import { prisma } from "./prisma";
import { argentinaDay } from "./dates";
import { parseProductos, type Item, type Producto, type Via } from "./caja-rapida-tipos";

export * from "./caja-rapida-tipos";

/**
 * La caja de la barra: cobrar rápido, sin cena ni cuentas de por medio.
 * Cada cobro entra al libro como un ingreso (con su forma de pago), así la caja y las estadísticas
 * que ya existen lo toman solo. Lo que se vende y a cuánto se edita desde Ajustes.
 */

const KEYS = {
  productos: "caja:productos",
  mesas: "caja:mesas",
  hora: "caja:tarifa_hora",
  partido: "caja:tarifa_partido",
} as const;

const PRODUCTOS_DEFAULT = [
  "Con cerveza | 10000",
  "Con trago | 11000",
  "Con trago sin alcohol | 9000",
  "Cerveza sola | 6000",
  "Trago solo | 7000",
  "Sánguche solo | 6000",
  "Gaseosa o agua | 3000",
].join("\n");

export type ConfigCaja = { productos: Producto[]; productosRaw: string; mesas: number; tarifaHora: number; tarifaPartido: number };

export async function getConfigCaja(): Promise<ConfigCaja> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const v = (k: string) => rows.find((r) => r.key === k)?.value?.trim();
  const raw = v(KEYS.productos) || PRODUCTOS_DEFAULT;
  const productos = parseProductos(raw);
  const num = (k: string, def: number) => {
    const n = Number((v(k) ?? "").replace(/\D/gu, ""));
    return n > 0 ? n : def;
  };
  return {
    productos: productos.length > 0 ? productos : parseProductos(PRODUCTOS_DEFAULT),
    productosRaw: raw,
    // 0 mesas = todavía no hay mesa de juegos; la sección no se muestra.
    mesas: Math.min(8, Math.max(0, Number((v(KEYS.mesas) ?? "").replace(/\D/gu, "")) || 0)),
    tarifaHora: num(KEYS.hora, 6000),
    tarifaPartido: num(KEYS.partido, 2000),
  };
}

export async function setConfigCaja(input: { productos?: string; mesas?: number; tarifaHora?: number; tarifaPartido?: number }) {
  const pares: [string, string][] = [];
  if (input.productos !== undefined) pares.push([KEYS.productos, input.productos.trim().slice(0, 1500)]);
  if (input.mesas !== undefined) pares.push([KEYS.mesas, String(Math.min(8, Math.max(0, Math.round(input.mesas))))]);
  if (input.tarifaHora !== undefined) pares.push([KEYS.hora, String(Math.max(0, Math.round(input.tarifaHora)))]);
  if (input.tarifaPartido !== undefined) pares.push([KEYS.partido, String(Math.max(0, Math.round(input.tarifaPartido)))]);
  await prisma.$transaction(
    pares.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

// ---------- cobrar ----------

/** Un cobro: una línea en el libro con el detalle de lo que se llevó. */
export async function cobrar(input: { items: Item[]; via: Via; by: string | null }): Promise<number> {
  const limpios = input.items.filter((i) => i.cantidad > 0 && i.precio >= 0).slice(0, 40);
  if (limpios.length === 0) throw new Error("No hay nada para cobrar.");
  const total = limpios.reduce((n, i) => n + i.precio * i.cantidad, 0);
  if (total <= 0) throw new Error("El total quedó en cero.");
  const detalle = limpios.map((i) => (i.cantidad > 1 ? `${i.cantidad}× ${i.nombre}` : i.nombre)).join(", ").slice(0, 200);
  await prisma.ledgerEntry.create({
    data: {
      kind: "INCOME",
      category: "barra",
      description: detalle,
      amount: total,
      via: input.via,
      day: argentinaDay(),
      by: input.by,
      fromPocket: false,
      createdBy: input.by,
    },
  });
  // Las partidas que entraron en este ticket quedan marcadas como cobradas. Es lo que las saca de
  // la lista de pendientes: una partida cerrada sin cobrar es plata que se hizo y no figura.
  const partidas = [...new Set(limpios.map((i) => i.partidaId).filter((id): id is string => !!id))];
  if (partidas.length > 0) {
    await prisma.partidaMesa.updateMany({ where: { id: { in: partidas }, via: null }, data: { via: input.via } });
  }
  return total;
}

/** Lo cobrado hoy por la caja de la barra, separado por forma de pago. */
export async function getHoy(): Promise<{ total: number; porVia: { via: string; monto: number }[]; cobros: number }> {
  const rows = await prisma.ledgerEntry.findMany({
    where: { kind: "INCOME", category: "barra", deletedAt: null, day: argentinaDay() },
    select: { amount: true, via: true },
  });
  const mapa = new Map<string, number>();
  for (const r of rows) mapa.set(r.via ?? "efectivo", (mapa.get(r.via ?? "efectivo") ?? 0) + r.amount);
  return {
    total: rows.reduce((n, r) => n + r.amount, 0),
    porVia: [...mapa.entries()].map(([via, monto]) => ({ via, monto })).sort((a, b) => b.monto - a.monto),
    cobros: rows.length,
  };
}

/** Los últimos cobros del día, para poder anular el que salió mal. */
export async function getUltimosCobros(limit = 8) {
  return prisma.ledgerEntry.findMany({
    where: { kind: "INCOME", category: "barra", deletedAt: null, day: argentinaDay() },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, description: true, amount: true, via: true, createdAt: true },
  });
}

/** Anular un cobro mal hecho: se borra en blando, queda en la papelera del libro. */
export async function anularCobro(id: string, quien: string | null) {
  await prisma.ledgerEntry.updateMany({
    where: { id, category: "barra", deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: quien },
  });
}

// ---------- la mesa de juegos ----------

export async function getPartidasAbiertas() {
  return prisma.partidaMesa.findMany({ where: { closedAt: null }, orderBy: { mesa: "asc" } });
}

export async function abrirMesa(mesa: number) {
  const abierta = await prisma.partidaMesa.findFirst({ where: { mesa, closedAt: null } });
  if (abierta) return abierta;
  return prisma.partidaMesa.create({ data: { mesa } });
}

/** Cuánto sale una partida según cómo se cobre. Por hora se prorratea por minuto, con 15 minutos de piso. */
export function precioPartida(modo: "hora" | "partido", minutos: number, tarifaHora: number, tarifaPartido: number): number {
  if (modo === "partido") return tarifaPartido;
  const cobrables = Math.max(15, minutos);
  return Math.round((tarifaHora * cobrables) / 60 / 100) * 100;
}

/** Cómo se llama la partida en el ticket. */
function nombrePartida(p: { mesa: number; modo: string | null; minutos: number | null }): string {
  return p.modo === "partido" ? `Mesa ${p.mesa} (partido)` : `Mesa ${p.mesa} (${p.minutos ?? 0} min)`;
}

/** Cierra la partida y devuelve el ítem para sumar al ticket (todavía no cobra). */
export async function cerrarMesa(input: { id: string; modo: "hora" | "partido"; by: string | null }): Promise<Item> {
  const p = await prisma.partidaMesa.findUnique({ where: { id: input.id } });
  if (!p || p.closedAt) throw new Error("Esa partida ya se cerró.");
  const { tarifaHora, tarifaPartido } = await getConfigCaja();
  const minutos = Math.max(0, Math.round((Date.now() - p.startedAt.getTime()) / 60000));
  const precio = precioPartida(input.modo, minutos, tarifaHora, tarifaPartido);
  await prisma.partidaMesa.update({
    where: { id: p.id },
    data: { closedAt: new Date(), modo: input.modo, minutos, amount: precio, by: input.by },
  });
  return { nombre: nombrePartida({ mesa: p.mesa, modo: input.modo, minutos }), precio, cantidad: 1, partidaId: p.id };
}

/**
 * Partidas cerradas con un monto que nunca pasaron por el cobro. Pasa si la pantalla se recarga
 * entre cerrar la mesa y cobrar el ticket: la partida queda cerrada, con plata, y sin ninguna
 * línea en el libro. Acá se ven para volver a ponerlas en el ticket o darlas de baja a mano.
 */
export async function getPartidasSinCobrar() {
  return prisma.partidaMesa.findMany({
    where: { closedAt: { not: null }, via: null, amount: { gt: 0 } },
    orderBy: { closedAt: "desc" },
    take: 12,
  });
}

/** Vuelve a poner en el ticket una partida que quedó colgada. */
export async function recuperarPartida(id: string): Promise<Item> {
  const p = await prisma.partidaMesa.findUnique({ where: { id } });
  if (!p || !p.closedAt || p.via || !p.amount) throw new Error("Esa partida ya no está esperando cobro.");
  return { nombre: nombrePartida(p), precio: p.amount, cantidad: 1, partidaId: p.id };
}

/** No se va a cobrar (se regaló, se arregló por afuera): deja de figurar como pendiente. */
export async function descartarPartida(id: string, quien: string | null) {
  await prisma.partidaMesa.updateMany({ where: { id, via: null }, data: { via: "descartada", by: quien } });
}

/** Una partida que se abrió por error: se borra sin cobrar. */
export async function cancelarMesa(id: string) {
  await prisma.partidaMesa.deleteMany({ where: { id, closedAt: null } });
}
