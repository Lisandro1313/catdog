import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { icsFor } from "@/lib/calendar";
import { siteUrl } from "@/lib/config";

/** Archivo .ics de la reserva (solo si está paga: la dirección va adentro). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: { event: true } });
  if (!reservation || reservation.status !== "PAID") return new NextResponse("No encontrado", { status: 404 });

  const ics = icsFor(reservation.event, `${siteUrl()}/reserva/${reservation.id}`, reservation.id);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cena-${reservation.event.date.toISOString().slice(0, 10)}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
