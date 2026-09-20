import { del, get, put } from "@vercel/blob";
import { prisma } from "./prisma";
import { parseMenu } from "./menu";

/**
 * Lo que pasa durante la noche además del juego: la carta en vivo (qué acto salió), las huellas
 * (frase y foto de los invitados), el voto al plato y al trago, los pedidos a la barra y las
 * recomendaciones. Todo es opcional para el invitado y se modera desde el panel.
 */

const MAX_PHOTO = 6 * 1024 * 1024;

// ---------- carta en vivo ----------

/** La cocina marca qué acto acaba de salir (null = volver a "todavía nada"). */
export async function setServedStep(eventId: string, step: number | null) {
  await prisma.event.updateMany({ where: { id: eventId }, data: { servedStep: step, servedAt: step == null ? null : new Date() } });
}

// ---------- huellas ----------

export type HuellaRow = { id: string; name: string; text: string | null; photo: string | null; table: number | null; createdAt: Date; approvedAt: Date | null; eventTitle: string };

/** La URL lleva la fecha de aprobación: si la ocultan y la vuelven a aprobar, cambia y no sirve la copia cacheada. */
function photoPath(id: string, photoUrl: string | null, approvedAt: Date | null): string | null {
  return photoUrl ? `/huella/${id}${approvedAt ? `?v=${approvedAt.getTime()}` : ""}` : null;
}

export async function addHuella(input: { eventId: string; deviceKey: string; table: number | null; name: string; text: string | null; file: File | null }) {
  let photoUrl: string | null = null;
  if (input.file && input.file.size > 0) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Las fotos no están disponibles ahora; dejá la frase igual.");
    if (input.file.size > MAX_PHOTO) throw new Error("La foto es demasiado grande (máximo 6 MB).");
    if (!/^image\/(jpeg|png|webp)$/.test(input.file.type)) throw new Error("Solo fotos JPG, PNG o WebP.");
    const ext = input.file.type === "image/png" ? "png" : input.file.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`huellas/${input.eventId}.${ext}`, input.file, { access: "private", addRandomSuffix: true, contentType: input.file.type });
    photoUrl = blob.url;
  }
  if (!input.text && !photoUrl) throw new Error("Dejá una frase o una foto.");
  try {
    const row = await prisma.huella.create({ data: { eventId: input.eventId, deviceKey: input.deviceKey, table: input.table, name: input.name, text: input.text, photoUrl } });
    return row.id;
  } catch (err) {
    // Que no quede una foto huérfana en el store si la fila no se pudo guardar.
    if (photoUrl) await del(photoUrl).catch(() => {});
    throw err;
  }
}

/** Las huellas de este teléfono en esta cena (para mostrarle "quedó guardada"). */
export async function getMyHuellas(eventId: string, deviceKey: string) {
  const rows = await prisma.huella.findMany({ where: { eventId, deviceKey }, orderBy: { createdAt: "desc" } });
  return rows.map((h) => ({ id: h.id, name: h.name, text: h.text, hasPhoto: Boolean(h.photoUrl), approved: Boolean(h.approvedAt) }));
}

/** Aprobadas, las más nuevas primero (para el home). */
export async function getApprovedHuellas(limit = 9): Promise<HuellaRow[]> {
  const rows = await prisma.huella.findMany({ where: { approvedAt: { not: null } }, orderBy: { approvedAt: "desc" }, take: limit, include: { event: { select: { title: true } } } });
  return rows.map((h) => ({ id: h.id, name: h.name, text: h.text, photo: photoPath(h.id, h.photoUrl, h.approvedAt), table: h.table, createdAt: h.createdAt, approvedAt: h.approvedAt, eventTitle: h.event.title }));
}

/** Todas las de una cena (para moderar). */
export async function getHuellasOf(eventId: string): Promise<HuellaRow[]> {
  const rows = await prisma.huella.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, include: { event: { select: { title: true } } } });
  return rows.map((h) => ({ id: h.id, name: h.name, text: h.text, photo: photoPath(h.id, h.photoUrl, h.approvedAt), table: h.table, createdAt: h.createdAt, approvedAt: h.approvedAt, eventTitle: h.event.title }));
}

// Moderación con updateMany/deleteMany: si el otro dueño ya la borró, no explota.
export async function approveHuella(id: string, approved: boolean) {
  await prisma.huella.updateMany({ where: { id }, data: { approvedAt: approved ? new Date() : null } });
}

export async function removeHuella(id: string) {
  const row = await prisma.huella.findUnique({ where: { id } });
  if (!row) return;
  await prisma.huella.delete({ where: { id } });
  if (row.photoUrl) {
    try {
      await del(row.photoUrl);
    } catch (err) {
      console.warn("[huella] no se pudo borrar la foto", err);
    }
  }
}

/** Lee la foto del store privado. Sin aprobar solo la ve el panel. */
export async function readHuellaPhoto(id: string, admin: boolean) {
  const row = await prisma.huella.findUnique({ where: { id } });
  if (!row?.photoUrl || (!row.approvedAt && !admin)) return null;
  const res = await get(row.photoUrl, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  return { stream: res.stream, contentType: res.blob.contentType, size: res.blob.size, cacheable: Boolean(row.approvedAt) };
}

// ---------- votos ----------

export type VotoKind = "plato" | "trago";

/** Las opciones válidas salen de la carta: no se vota nada que no exista. */
export function voteOptions(menu: string | null, welcomeDrink: string | null): { plato: string[]; trago: string[] } {
  const steps = parseMenu(menu);
  const welcome = (welcomeDrink ?? "").split(/\s+\|\s+/)[0]?.trim();
  const plato = steps.map((s) => s.dish);
  const trago = [...(welcome ? [welcome] : []), ...steps.map((s) => s.drink).filter((d): d is string => Boolean(d))];
  return { plato: [...new Set(plato)], trago: [...new Set(trago)] };
}

export async function saveVote(eventId: string, deviceKey: string, kind: VotoKind, choice: string) {
  await prisma.voto.upsert({
    where: { eventId_deviceKey_kind: { eventId, deviceKey, kind } },
    update: { choice },
    create: { eventId, deviceKey, kind, choice },
  });
}

export async function getMyVotes(eventId: string, deviceKey: string): Promise<Partial<Record<VotoKind, string>>> {
  const rows = await prisma.voto.findMany({ where: { eventId, deviceKey } });
  const out: Partial<Record<VotoKind, string>> = {};
  for (const r of rows) out[r.kind as VotoKind] = r.choice;
  return out;
}

export type VoteTally = { kind: VotoKind; rows: { choice: string; count: number; pct: number }[]; total: number };

/** Conteo por opción (para el panel). En público solo se usa el ganador, nunca cantidades. */
export async function getVoteTally(eventId: string): Promise<VoteTally[]> {
  const rows = await prisma.voto.groupBy({ by: ["kind", "choice"], where: { eventId }, _count: { _all: true } });
  return (["plato", "trago"] as VotoKind[]).map((kind) => {
    const mine = rows.filter((r) => r.kind === kind).map((r) => ({ choice: r.choice, count: r._count._all }));
    const total = mine.reduce((n, r) => n + r.count, 0);
    return { kind, total, rows: mine.sort((a, b) => b.count - a.count).map((r) => ({ ...r, pct: total ? Math.round((r.count / total) * 100) : 0 })) };
  });
}

/** "Lo más votado de la última cena": el ganador de cada tipo, solo si hubo 3 votos o más. */
export async function getLastWinners(): Promise<{ eventTitle: string; plato: string | null; trago: string | null } | null> {
  const last = await prisma.voto.findFirst({ orderBy: { createdAt: "desc" }, select: { eventId: true, event: { select: { title: true } } } });
  if (!last) return null;
  const tally = await getVoteTally(last.eventId);
  const pick = (kind: VotoKind) => {
    const t = tally.find((x) => x.kind === kind);
    return t && t.total >= 3 ? t.rows[0].choice : null;
  };
  const plato = pick("plato");
  const trago = pick("trago");
  if (!plato && !trago) return null;
  return { eventTitle: last.event.title, plato, trago };
}

// ---------- pedidos a la barra ----------

export type PedidoRow = { id: string; table: number; item: string; qty: number; status: string; createdAt: Date };

export async function addPedido(input: { eventId: string; deviceKey: string; table: number; item: string; qty: number }) {
  const open = await prisma.pedido.count({ where: { eventId: input.eventId, deviceKey: input.deviceKey, status: "pendiente" } });
  if (open >= 3) throw new Error("Ya tenés pedidos en camino; esperá que lleguen.");
  await prisma.pedido.create({ data: input });
}

export async function getMyPedidos(eventId: string, deviceKey: string): Promise<PedidoRow[]> {
  const rows = await prisma.pedido.findMany({ where: { eventId, deviceKey }, orderBy: { createdAt: "desc" }, take: 6 });
  return rows.map((p) => ({ id: p.id, table: p.table, item: p.item, qty: p.qty, status: p.status, createdAt: p.createdAt }));
}

export async function getPedidosOf(eventId: string): Promise<PedidoRow[]> {
  const rows = await prisma.pedido.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
  return rows.map((p) => ({ id: p.id, table: p.table, item: p.item, qty: p.qty, status: p.status, createdAt: p.createdAt }));
}

export async function setPedidoStatus(id: string, status: "pendiente" | "listo" | "cancelado") {
  await prisma.pedido.updateMany({ where: { id }, data: { status, doneAt: status === "pendiente" ? null : new Date() } });
}

/** El invitado puede cancelar solo lo suyo y solo si todavía no salió. */
export async function cancelMyPedido(id: string, deviceKey: string) {
  await prisma.pedido.updateMany({ where: { id, deviceKey, status: "pendiente" }, data: { status: "cancelado", doneAt: new Date() } });
}

// ---------- sugerencias ----------

export type SugerenciaKind = "tema" | "idea";
export type SugerenciaRow = { id: string; kind: SugerenciaKind; text: string; createdAt: Date; seenAt: Date | null; eventTitle: string | null };

export async function addSugerencia(input: { eventId: string | null; deviceKey: string; kind: SugerenciaKind; text: string }) {
  const recent = await prisma.sugerencia.count({ where: { deviceKey: input.deviceKey, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recent >= 10) throw new Error("Ya mandaste varias; gracias, las leemos.");
  await prisma.sugerencia.create({ data: input });
}

export async function getSugerencias(opts: { eventId?: string; unseenOnly?: boolean; limit?: number } = {}): Promise<SugerenciaRow[]> {
  const rows = await prisma.sugerencia.findMany({
    where: { ...(opts.eventId ? { eventId: opts.eventId } : {}), ...(opts.unseenOnly ? { seenAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    include: { event: { select: { title: true } } },
  });
  return rows.map((s) => ({ id: s.id, kind: s.kind as SugerenciaKind, text: s.text, createdAt: s.createdAt, seenAt: s.seenAt, eventTitle: s.event?.title ?? null }));
}

export async function markSugerenciasSeen(ids: string[]) {
  if (!ids.length) return;
  await prisma.sugerencia.updateMany({ where: { id: { in: ids } }, data: { seenAt: new Date() } });
}

export async function removeSugerencia(id: string) {
  await prisma.sugerencia.deleteMany({ where: { id } });
}
