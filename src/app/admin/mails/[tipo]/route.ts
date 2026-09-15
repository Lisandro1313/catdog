import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getNextEvent } from "@/lib/reservations";
import { renderNewEvent, renderReminder, renderReservationConfirmed, renderReviewRequest } from "@/lib/email";

/** Vista previa de los mails que salen, con la próxima cena como ejemplo. Solo con sesión del panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  if (!(await isAdmin())) return new NextResponse("No autorizado", { status: 401 });
  const { tipo } = await params;
  const event = (await getNextEvent()) ?? (await prisma.event.findFirst({ orderBy: { date: "desc" } }));
  if (!event) return new NextResponse("Todavía no hay ninguna cena cargada.", { status: 404 });

  const sample = { name: "Ana García", event, quantity: 2, seats: [4, 5], amount: event.price * 2, reservationId: "ejemplo" };
  const mail =
    tipo === "confirmacion"
      ? renderReservationConfirmed(sample)
      : tipo === "recordatorio"
        ? renderReminder(sample)
        : tipo === "opinion"
          ? renderReviewRequest(event, { id: "ejemplo", name: sample.name })
          : tipo === "nueva-fecha"
            ? renderNewEvent(event, "ejemplo@correo.com")
            : null;
  if (!mail) return new NextResponse("Tipo desconocido", { status: 404 });

  const banner = `<div style="position:sticky;top:0;background:#c9a96e;color:#141210;font:14px system-ui;padding:10px 16px">Vista previa · asunto: <strong>${mail.subject}</strong> · datos de ejemplo</div>`;
  return new NextResponse(mail.html.replace(/(<body[^>]*>)/, `$1${banner}`), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
  });
}
