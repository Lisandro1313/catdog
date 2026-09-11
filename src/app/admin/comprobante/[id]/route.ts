import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { readReceipt } from "@/lib/receipts";

/** Sirve la foto del comprobante de un movimiento. Solo con sesión del panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new NextResponse("No autorizado", { status: 401 });
  const { id } = await params;
  const entry = await prisma.ledgerEntry.findUnique({ where: { id }, select: { receiptUrl: true } });
  if (!entry?.receiptUrl) return new NextResponse("Sin comprobante", { status: 404 });
  try {
    const file = await readReceipt(entry.receiptUrl);
    if (!file) return new NextResponse("No encontrado", { status: 404 });
    return new NextResponse(file.stream, {
      headers: {
        "content-type": file.contentType,
        "content-length": String(file.size),
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[comprobante] lectura falló", err);
    return new NextResponse("Error al leer el comprobante", { status: 502 });
  }
}
