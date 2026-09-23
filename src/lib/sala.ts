import { prisma } from "./prisma";
import { parseBar, parseMenu, splitDrink } from "./menu";
import { KIND_MARIDAJE, KIND_PLATO, type ConsumoRow, type CoverVia, type CuentaRow } from "./sala-tipos";

export * from "./sala-tipos";

/**
 * La sala: cada persona abre su cuenta escaneando el QR de la casa. La casa cobra la cena ahí mismo
 * (efectivo o transferencia; los invitados y el 2x1 se marcan y no pagan) y con eso la cuenta se
 * destraba. Desde ahí piden los pasos cuando quieren (van a la cocina) y los tragos (van a la barra),
 * viendo siempre lo que llevan consumido. Al final se cierra la cuenta y todo entra en la caja.
 */

function armar(c: {
  id: string;
  table: number;
  name: string;
  cover: number;
  coverNote: string | null;
  coverPaidAt: Date | null;
  coverVia: string | null;
  openedAt: Date;
  closedAt: Date | null;
  closedVia: string | null;
  traspasoCode: string | null;
  traspasoHasta: Date | null;
  consumos: ConsumoRow[];
}): CuentaRow {
  const extra = c.consumos.filter((x) => x.status !== "cancelado").reduce((n, x) => n + x.qty * x.price, 0);
  const coverPaid = Boolean(c.coverPaidAt);
  return {
    id: c.id,
    table: c.table,
    name: c.name,
    cover: c.cover,
    coverNote: c.coverNote,
    coverPaid,
    coverVia: c.coverVia,
    abierta: coverPaid && !c.closedAt,
    openedAt: c.openedAt,
    closedAt: c.closedAt,
    closedVia: c.closedVia,
    traspasoCode: c.traspasoHasta && c.traspasoHasta.getTime() > Date.now() ? c.traspasoCode : null,
    consumos: c.consumos,
    extra,
    debe: (coverPaid ? 0 : c.cover) + (c.closedAt ? 0 : extra),
  };
}

const include = { consumos: { orderBy: { createdAt: "asc" } } } as const;

/** Todas las cuentas de una cena, ordenadas por mesa. */
export async function getCuentas(eventId: string): Promise<CuentaRow[]> {
  const rows = await prisma.cuenta.findMany({ where: { eventId }, orderBy: [{ table: "asc" }, { openedAt: "asc" }], include });
  return rows.map(armar);
}

/**
 * Todas las cuentas que lleva este teléfono. Suelen ser una, pero a alguien se le puede apagar el
 * celular y otro le lleva la suya, o una pareja usa un teléfono solo.
 */
export async function getMisCuentas(eventId: string, deviceKey: string): Promise<CuentaRow[]> {
  const rows = await prisma.cuenta.findMany({ where: { eventId, deviceKey }, orderBy: { openedAt: "asc" }, include });
  return rows.map(armar);
}

/**
 * Las cuentas que la casa habilitó para pasar a otro teléfono. Solo esas se listan: el nombre de
 * alguien no aparece hasta que la casa abre el traspaso, y para tomarla hace falta además su código.
 */
export async function getCuentasEnTraspaso(eventId: string) {
  const rows = await prisma.cuenta.findMany({
    where: { eventId, closedAt: null, traspasoCode: { not: null }, traspasoHasta: { gt: new Date() } },
    orderBy: { openedAt: "asc" },
    select: { id: true, name: true },
  });
  return rows;
}

const TRASPASO_MINUTOS = 15;

/**
 * La casa habilita pasar una cuenta a otro teléfono y le da a la persona un código de un solo uso.
 * Es aparte del código de la noche, que lo escucha toda la sala: así nadie se queda con la cuenta ajena.
 */
export async function abrirTraspaso(cuentaId: string): Promise<string> {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const c = await prisma.cuenta.updateMany({
    where: { id: cuentaId, closedAt: null },
    data: { traspasoCode: code, traspasoHasta: new Date(Date.now() + TRASPASO_MINUTOS * 60000) },
  });
  if (c.count === 0) throw new SalaError("Esa cuenta no está abierta.");
  return code;
}

export async function cancelarTraspaso(cuentaId: string) {
  await prisma.cuenta.updateMany({ where: { id: cuentaId }, data: { traspasoCode: null, traspasoHasta: null } });
}

/**
 * Pasa una cuenta a otro teléfono con el código de un solo uso. Sirve cuando a alguien se le apaga el
 * celular o prefiere que se la lleve otro. La cuenta es la misma, con todo lo pedido.
 */
export async function tomarCuenta(cuentaId: string, deviceKey: string, code: string) {
  const c = await prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { closedAt: true, deviceKey: true, traspasoCode: true, traspasoHasta: true } });
  if (!c) throw new SalaError("Esa cuenta no existe.");
  if (c.closedAt) throw new SalaError("Esa cuenta ya se cerró.");
  if (c.deviceKey === deviceKey) throw new SalaError("Esa cuenta ya es de este teléfono.");
  if (!c.traspasoCode || !c.traspasoHasta || c.traspasoHasta.getTime() < Date.now()) {
    throw new SalaError("Pedile a la casa que habilite el pase de esa cuenta.");
  }
  if (c.traspasoCode !== code) throw new SalaError("Ese código no es.");
  const cuantas = await prisma.cuenta.count({ where: { deviceKey, closedAt: null } });
  if (cuantas >= 4) throw new SalaError("Este teléfono ya lleva cuatro cuentas.");
  // El código se quema al usarlo.
  await prisma.cuenta.update({ where: { id: cuentaId }, data: { deviceKey, traspasoCode: null, traspasoHasta: null } });
}

/** Quiénes reservaron y pagaron esta cena: para elegir el nombre al abrir la cuenta (y saber que ya pagó). */
export async function getReservasDeLaNoche(eventId: string) {
  const rows = await prisma.reservation.findMany({ where: { eventId, status: "PAID" }, orderBy: { name: "asc" }, select: { id: true, name: true, quantity: true } });
  const abiertas = await prisma.cuenta.findMany({ where: { eventId }, select: { reservationId: true } });
  const usadas = new Map<string, number>();
  for (const a of abiertas) if (a.reservationId) usadas.set(a.reservationId, (usadas.get(a.reservationId) ?? 0) + 1);
  // Una reserva de 3 lugares deja abrir 3 cuentas con ese nombre.
  return rows.filter((r) => (usadas.get(r.id) ?? 0) < r.quantity).map((r) => ({ id: r.id, name: r.name, quantity: r.quantity }));
}

export class SalaError extends Error {}

/** Abre la cuenta de una persona en una mesa. Queda trabada hasta que la casa cobre (o la marque invitada). */
export async function abrirCuenta(input: { eventId: string; table: number; name: string; deviceKey: string; reservationId?: string | null; price: number }) {
  // Un teléfono puede llevar varias (una pareja con un celu, o el que le lleva la cuenta a un amigo).
  const abiertas = await prisma.cuenta.count({ where: { eventId: input.eventId, deviceKey: input.deviceKey, closedAt: null } });
  if (abiertas >= 4) throw new SalaError("Este teléfono ya lleva cuatro cuentas.");
  let reservationId: string | null = null;
  let cover = input.price;
  let coverNote: string | null = "entera";
  if (input.reservationId) {
    const libres = await getReservasDeLaNoche(input.eventId);
    const r = libres.find((x) => x.id === input.reservationId);
    if (r) {
      // Reservó y pagó por adelantado: la cena ya está saldada.
      reservationId = r.id;
      cover = 0;
      coverNote = "ya pago";
    }
  }
  const row = await prisma.cuenta.create({
    data: {
      eventId: input.eventId,
      table: input.table,
      name: input.name,
      deviceKey: input.deviceKey,
      reservationId,
      cover,
      coverNote,
      ...(reservationId ? { coverPaidAt: new Date(), coverVia: "reserva" } : {}),
    },
    include,
  });
  return armar(row);
}

/** La casa cobra (o perdona) la cena: la cuenta queda destrabada y la persona puede pedir. */
export async function saldarCover(id: string, via: CoverVia, monto?: number) {
  const c = await prisma.cuenta.findUnique({ where: { id }, select: { cover: true } });
  if (!c) throw new SalaError("Esa cuenta no existe.");
  const cover = via === "invitado" ? 0 : monto != null ? Math.max(0, Math.round(monto)) : c.cover;
  await prisma.cuenta.update({
    where: { id },
    data: { cover, coverPaidAt: new Date(), coverVia: via, coverNote: via === "invitado" ? "invitado" : monto != null && monto !== c.cover ? "a mano" : undefined },
  });
}

/** Deshace el cobro (se marcó por error). */
export async function desmarcarCover(id: string) {
  await prisma.cuenta.updateMany({ where: { id }, data: { coverPaidAt: null, coverVia: null } });
}

/** Cambia lo que le toca pagar por la cena (2x1, descuento, lo que sea). */
export async function setCover(id: string, monto: number, nota: string | null) {
  await prisma.cuenta.updateMany({ where: { id }, data: { cover: Math.max(0, Math.round(monto)), coverNote: nota } });
}

/**
 * Pide un paso: el plato (va a la cocina), el trago que lo acompaña (va a la barra), o los dos.
 * Nada de esto cuesta aparte: está en el cubierto. Muchos piden el trago antes que la comida.
 */
export async function pedirPaso(cuentaId: string, stepIndex: number, que: "plato" | "trago" | "ambos") {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId }, include: { event: { select: { menu: true } }, consumos: true } });
  if (!cuenta) throw new SalaError("Esa cuenta no existe.");
  if (!cuenta.coverPaidAt) throw new SalaError("La cuenta todavía está trabada.");
  if (cuenta.closedAt) throw new SalaError("Esa cuenta ya se cerró.");
  const steps = parseMenu(cuenta.event.menu);
  const paso = steps[stepIndex - 1];
  if (!paso) throw new SalaError("Ese paso no está en la carta.");
  const vivos = cuenta.consumos.filter((c) => c.status !== "cancelado");
  const quierePlato = que !== "trago";
  const quiereTrago = que !== "plato" && Boolean(paso.drink);
  const nuevos: { kind: string; item: string }[] = [];
  if (quierePlato && !vivos.some((c) => c.kind === KIND_PLATO && c.stepIndex === stepIndex)) nuevos.push({ kind: KIND_PLATO, item: paso.dish });
  // A la barra le llega el nombre del cóctel, no la lista de ingredientes.
  if (quiereTrago && !vivos.some((c) => c.kind === KIND_MARIDAJE && c.stepIndex === stepIndex)) nuevos.push({ kind: KIND_MARIDAJE, item: splitDrink(paso.drink).name });
  if (nuevos.length === 0) throw new SalaError("Eso ya lo pediste.");
  const platosEnCamino = cuenta.consumos.filter((c) => c.kind === KIND_PLATO && c.status === "pendiente").length;
  if (quierePlato && platosEnCamino >= 2) throw new SalaError("Ya tenés dos platos en camino; esperá a que lleguen.");
  await prisma.consumo.createMany({ data: nuevos.map((n) => ({ cuentaId, kind: n.kind, item: n.item, stepIndex, price: 0 })) });
}

/** Pide un trago de la barra: se suma a la cuenta y le llega a la barra. */
export async function pedirTrago(cuentaId: string, item: string, qty = 1) {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId }, include: { event: { select: { bar: true, barPrice: true } }, consumos: true } });
  if (!cuenta) throw new SalaError("Esa cuenta no existe.");
  if (!cuenta.coverPaidAt) throw new SalaError("La cuenta todavía está trabada.");
  if (cuenta.closedAt) throw new SalaError("Esa cuenta ya se cerró.");
  if (!parseBar(cuenta.event.bar).some((b) => b.name === item)) throw new SalaError("Eso no está en la barra de hoy.");
  const enCamino = cuenta.consumos.filter((c) => c.kind === "trago" && c.status === "pendiente").length;
  if (enCamino >= 3) throw new SalaError("Ya tenés tragos en camino; esperá a que lleguen.");
  await prisma.consumo.create({ data: { cuentaId, kind: "trago", item, qty: Math.min(4, Math.max(1, qty)), price: cuenta.event.barPrice ?? 0 } });
}

/** La casa carga algo a mano (una botella, una picada, lo que sea). */
export async function cargarExtra(cuentaId: string, item: string, price: number, qty = 1) {
  await prisma.consumo.create({ data: { cuentaId, kind: "extra", item: item.slice(0, 80), price: Math.max(0, Math.round(price)), qty: Math.max(1, qty), status: "listo", doneAt: new Date() } });
}

export async function setConsumoStatus(id: string, status: "pendiente" | "listo" | "cancelado") {
  await prisma.consumo.updateMany({ where: { id }, data: { status, doneAt: status === "pendiente" ? null : new Date() } });
}

/** El invitado cancela algo suyo que todavía no salió. */
export async function cancelarMiConsumo(id: string, deviceKey: string) {
  const c = await prisma.consumo.findUnique({ where: { id }, include: { cuenta: { select: { deviceKey: true } } } });
  if (!c || c.cuenta.deviceKey !== deviceKey || c.status !== "pendiente") return;
  await prisma.consumo.update({ where: { id }, data: { status: "cancelado", doneAt: new Date() } });
}

export type PedidoSala = { id: string; cuentaId: string; table: number; name: string; kind: string; item: string; qty: number; createdAt: Date; status: string };

/** Lo que está esperando: `destino` "cocina" son los pasos, "barra" los tragos. */
export async function getPendientes(eventId: string, destino: "cocina" | "barra" | "todo" = "todo"): Promise<PedidoSala[]> {
  // La cocina ve los platos; la barra, los tragos sueltos y los del maridaje.
  const kinds = destino === "cocina" ? [KIND_PLATO] : destino === "barra" ? ["trago", KIND_MARIDAJE] : [KIND_PLATO, "trago", KIND_MARIDAJE];
  const rows = await prisma.consumo.findMany({
    where: { kind: { in: kinds }, status: "pendiente", cuenta: { eventId } },
    orderBy: { createdAt: "asc" },
    include: { cuenta: { select: { id: true, table: true, name: true } } },
  });
  return rows.map((c) => ({ id: c.id, cuentaId: c.cuenta.id, table: c.cuenta.table, name: c.cuenta.name, kind: c.kind, item: c.item, qty: c.qty, createdAt: c.createdAt, status: c.status }));
}

/** Cierra una cuenta: se cobró todo lo que consumió. */
export async function cerrarCuenta(id: string, via: "efectivo" | "tarjeta" | "transferencia" | "invitado") {
  const c = await prisma.cuenta.findUnique({ where: { id }, select: { coverPaidAt: true } });
  if (!c) throw new SalaError("Esa cuenta no existe.");
  if (!c.coverPaidAt) throw new SalaError("Primero cobrá (o marcá como invitado) la cena.");
  await prisma.consumo.updateMany({ where: { cuentaId: id, status: "pendiente" }, data: { status: "listo", doneAt: new Date() } });
  await prisma.cuenta.updateMany({ where: { id }, data: { closedAt: new Date(), closedVia: via } });
}

export async function reabrirCuenta(id: string) {
  await prisma.cuenta.updateMany({ where: { id }, data: { closedAt: null, closedVia: null } });
}

/** El código de la noche para destrabar una cuenta desde el celular del invitado. Se genera una vez por cena. */
export async function getSalaCode(eventId: string): Promise<string> {
  const e = await prisma.event.findUnique({ where: { id: eventId }, select: { salaCode: true } });
  if (e?.salaCode) return e.salaCode;
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await prisma.event.updateMany({ where: { id: eventId }, data: { salaCode: code } });
  return code;
}

export async function nuevoSalaCode(eventId: string): Promise<string> {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await prisma.event.updateMany({ where: { id: eventId }, data: { salaCode: code } });
  return code;
}
