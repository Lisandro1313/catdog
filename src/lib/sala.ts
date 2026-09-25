import { prisma } from "./prisma";
import { allowKey } from "./rate-limit";
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

/**
 * Corre algo sobre una cuenta con su fila bloqueada en la base (`FOR UPDATE`): mientras tanto, otro
 * pedido del mismo teléfono espera. Es lo que evita que dos toques simultáneos esquiven los topes.
 * Exige además que la cuenta esté abierta y con la cena saldada.
 */
async function conCuentaBloqueada<T>(
  cuentaId: string,
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], cuenta: { event: { menu: string | null; bar: string | null; barPrice: number | null }; consumos: ConsumoRow[] }) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const bloqueada = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Cuenta" WHERE id = ${cuentaId} FOR UPDATE`;
    if (bloqueada.length === 0) throw new SalaError("Esa cuenta no existe.");
    const cuenta = await tx.cuenta.findUnique({
      where: { id: cuentaId },
      include: { event: { select: { menu: true, bar: true, barPrice: true } }, consumos: true },
    });
    if (!cuenta) throw new SalaError("Esa cuenta no existe.");
    if (!cuenta.coverPaidAt) throw new SalaError("La cuenta todavía está trabada.");
    if (cuenta.closedAt) throw new SalaError("Esa cuenta ya se cerró.");
    return fn(tx, cuenta);
  });
}

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
  if (c.traspasoCode !== code) {
    // Cada cuenta aguanta pocos intentos: cinco errores y hay que pedir el pase de nuevo.
    if (!allowKey(`traspaso:${cuentaId}`, 5, 30 * 60000)) {
      await cancelarTraspaso(cuentaId);
      throw new SalaError("Demasiados intentos: pedile a la casa que lo habilite otra vez.");
    }
    throw new SalaError("Ese código no es.");
  }
  const cuantas = await prisma.cuenta.count({ where: { deviceKey, closedAt: null } });
  if (cuantas >= 4) throw new SalaError("Este teléfono ya lleva cuatro cuentas.");
  // El código se quema al usarlo.
  await prisma.cuenta.update({ where: { id: cuentaId }, data: { deviceKey, traspasoCode: null, traspasoHasta: null } });
}

/**
 * Quiénes reservaron y pagaron esta cena, con los lugares que todavía no reclamó nadie. Es para el
 * panel: la lista de invitados no se le muestra a quien escanea el QR (cualquiera podría decir que
 * es otro y cenar gratis). En la puerta, la casa toca "ya pagó al reservar" en su cuenta.
 */
export async function getReservasDeLaNoche(eventId: string) {
  const rows = await prisma.reservation.findMany({ where: { eventId, status: "PAID" }, orderBy: { name: "asc" }, select: { id: true, name: true, quantity: true } });
  const abiertas = await prisma.cuenta.findMany({ where: { eventId }, select: { reservationId: true } });
  const usadas = new Map<string, number>();
  for (const a of abiertas) if (a.reservationId) usadas.set(a.reservationId, (usadas.get(a.reservationId) ?? 0) + 1);
  return rows
    .map((r) => ({ id: r.id, name: r.name, libres: r.quantity - (usadas.get(r.id) ?? 0) }))
    .filter((r) => r.libres > 0);
}

/** La casa marca que esa cuenta corresponde a una reserva ya paga: la cena queda saldada. */
export async function marcarReserva(cuentaId: string, reservationId: string) {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { eventId: true, closedAt: true } });
  if (!cuenta || cuenta.closedAt) throw new SalaError("Esa cuenta no está abierta.");
  const libres = await getReservasDeLaNoche(cuenta.eventId);
  if (!libres.some((r) => r.id === reservationId)) throw new SalaError("Esa reserva ya está usada.");
  await prisma.cuenta.updateMany({
    where: { id: cuentaId },
    data: { reservationId, cover: 0, coverNote: "ya pago", coverPaidAt: new Date(), coverVia: "reserva" },
  });
}

export class SalaError extends Error {}

/** Abre la cuenta de una persona en una mesa. Queda trabada hasta que la casa cobre (o la marque invitada). */
export async function abrirCuenta(input: { eventId: string; table: number; name: string; deviceKey: string; price: number }) {
  // Un teléfono puede llevar varias (una pareja con un celu, o el que le lleva la cuenta a un amigo).
  const abiertas = await prisma.cuenta.count({ where: { eventId: input.eventId, deviceKey: input.deviceKey, closedAt: null } });
  if (abiertas >= 4) throw new SalaError("Este teléfono ya lleva cuatro cuentas.");
  // Un tope duro por noche: que nadie pueda llenar el panel de cuentas basura.
  const enLaNoche = await prisma.cuenta.count({ where: { eventId: input.eventId } });
  if (enLaNoche >= 60) throw new SalaError("Hay demasiadas cuentas abiertas; avisale a la casa.");
  // Una jornada no tiene cubierto (se paga lo que se consume): la cuenta nace destrabada y pide de una.
  // La cena sí: queda trabada hasta que la casa cobre en la puerta.
  const sinCubierto = input.price <= 0;
  const row = await prisma.cuenta.create({
    data: {
      eventId: input.eventId,
      table: input.table,
      name: input.name,
      deviceKey: input.deviceKey,
      cover: sinCubierto ? 0 : input.price,
      coverNote: sinCubierto ? "sin cubierto" : "entera",
      coverPaidAt: sinCubierto ? new Date() : null,
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
  await prisma.cuenta.updateMany({ where: { id, closedAt: null }, data: { coverPaidAt: null, coverVia: null } });
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
  // Todo adentro de una transacción con la cuenta bloqueada: dos toques a la vez no pueden colarse
  // entre el chequeo y el alta, que es como se podrían pedir treinta platos del mismo paso.
  await conCuentaBloqueada(cuentaId, async (tx, cuenta) => {
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
    await tx.consumo.createMany({ data: nuevos.map((n) => ({ cuentaId, kind: n.kind, item: n.item, stepIndex, price: 0 })) });
  });
}

/** Pide un trago de la barra: se suma a la cuenta y le llega a la barra. */
export async function pedirTrago(cuentaId: string, item: string, qty = 1) {
  await conCuentaBloqueada(cuentaId, async (tx, cuenta) => {
    const enCarta = parseBar(cuenta.event.bar).find((b) => b.name === item);
    if (!enCarta) throw new SalaError("Eso no está en la barra de hoy.");
    const enCamino = cuenta.consumos.filter((c) => c.kind === "trago" && c.status === "pendiente").length;
    if (enCamino >= 3) throw new SalaError("Ya tenés tragos en camino; esperá a que lleguen.");
    // El precio se toma de la carta, no de lo que mande el teléfono: cada producto puede salir distinto.
    const price = enCarta.price ?? cuenta.event.barPrice ?? 0;
    await tx.consumo.create({ data: { cuentaId, kind: "trago", item, qty: Math.min(4, Math.max(1, qty)), price } });
  });
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
  // Una sola escritura condicional: si el barman ya lo marcó servido, no se puede cancelar después.
  await prisma.consumo.updateMany({
    where: { id, status: "pendiente", cuenta: { deviceKey } },
    data: { status: "cancelado", doneAt: new Date() },
  });
}

export type PedidoSala = { id: string; cuentaId: string; table: number; name: string; kind: string; item: string; qty: number; createdAt: Date; status: string };

/** Lo que está esperando: `destino` "cocina" son los pasos, "barra" los tragos. */
export async function getPendientes(eventId: string, destino: "cocina" | "barra" | "todo" = "todo"): Promise<PedidoSala[]> {
  // La cocina ve los platos; la barra, los tragos sueltos y los del maridaje.
  const kinds = destino === "cocina" ? [KIND_PLATO] : destino === "barra" ? ["trago", KIND_MARIDAJE] : [KIND_PLATO, "trago", KIND_MARIDAJE];
  const rows = await prisma.consumo.findMany({
    where: { kind: { in: kinds }, status: "pendiente", cuenta: { eventId, closedAt: null } },
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
