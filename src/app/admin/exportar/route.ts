import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { KIND_LABEL, categoryLabel } from "@/lib/ledger-categories";

/**
 * Caja en CSV (para Excel / el contador): todos los movimientos más las reservas cobradas.
 * ?evento=<id> limita a una cena. Solo con sesión del panel.
 */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new NextResponse("No autorizado", { status: 401 });
  const url = new URL(req.url);
  const eventId = url.searchParams.get("evento");
  const where = eventId ? { eventId } : {};

  const [ledger, paid] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { ...where, deletedAt: null }, include: { event: { select: { title: true, date: true } } }, orderBy: { day: "asc" } }),
    prisma.reservation.findMany({ where: { ...where, status: "PAID" }, include: { event: { select: { title: true, date: true } } }, orderBy: { paidAt: "asc" } }),
  ]);

  const day = (d: Date) => d.toISOString().slice(0, 10);
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows: string[][] = [["fecha", "cena", "tipo", "rubro", "detalle", "monto", "quien", "de_bolsillo"]];
  for (const r of paid) {
    rows.push([
      r.paidAt ? day(r.paidAt) : "",
      r.event.title,
      "Ingreso",
      "Reservas",
      `${r.name} · ${r.quantity} lugar${r.quantity === 1 ? "" : "es"} · ${r.paidVia ?? ""}`,
      String(r.amount),
      "",
      "",
    ]);
  }
  for (const l of ledger) {
    const sign = l.kind === "EXPENSE" || l.kind === "WITHDRAWAL" ? -1 : 1;
    rows.push([
      day(l.day),
      l.event?.title ?? "General",
      KIND_LABEL[l.kind],
      categoryLabel(l.kind, l.category),
      l.description ?? "",
      String(sign * l.amount),
      l.by ?? "",
      l.kind === "EXPENSE" ? (l.fromPocket ? "sí" : "no") : "",
    ]);
  }
  // BOM para que Excel abra los acentos bien; punto y coma como separador (Excel en español).
  const csv = "﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n");
  const name = eventId ? `caja-${paid[0]?.event.title ?? ledger[0]?.event?.title ?? "cena"}` : "caja-completa";
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name.replace(/[^\w.-]+/g, "-").toLowerCase()}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
