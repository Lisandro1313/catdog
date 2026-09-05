import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/config";
import { formatShort, nowMs, toDatetimeLocal } from "@/lib/dates";
import { EventForm } from "@/components/admin/EventForm";
import { AssignSeatsForm, ManualReservationForm, NotifyForm } from "@/components/admin/ActionForms";
import { cancelReservationAction, deleteEventAction, markPaidAction, updateEventAction } from "../../../actions";

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, subscribers] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        reservations: {
          orderBy: { createdAt: "desc" },
          include: { seats: { orderBy: { number: "asc" } } },
        },
      },
    }),
    prisma.subscriber.count(),
  ]);
  if (!event) notFound();

  const now = nowMs();
  const active = event.reservations.filter(
    (r) => r.status === "PAID" || (r.status === "PENDING" && r.expiresAt.getTime() > now),
  );
  const paidSeats = active.filter((r) => r.status === "PAID").reduce((n, r) => n + r.quantity, 0);
  const holdSeats = active.filter((r) => r.status === "PENDING").reduce((n, r) => n + r.quantity, 0);
  const revenue = active.filter((r) => r.status === "PAID").reduce((n, r) => n + r.amount, 0);

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted">
        <Link href="/admin" className="hover:text-ink">
          ← Cenas
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Pagos" value={`${paidSeats}/${event.capacity}`} />
        <Stat label="En proceso" value={String(holdSeats)} />
        <Stat label="Libres" value={String(event.capacity - paidSeats - holdSeats)} />
        <Stat label="Recaudado" value={formatPrice(revenue)} />
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Reservas</h2>
          <NotifyForm
            eventId={event.id}
            subscribers={subscribers}
            notifiedAt={event.notifiedAt ? formatShort(event.notifiedAt) : null}
          />
        </div>

        {event.reservations.length === 0 ? (
          <p className="mt-4 text-muted">Nadie reservó todavía.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3">Cant.</th>
                  <th className="py-2 pr-3">Sillas</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Contacto</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Monto</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {event.reservations.map((r) => {
                  const expired = r.status === "PENDING" && r.expiresAt.getTime() < now;
                  return (
                    <tr key={r.id} className={expired || r.status === "CANCELLED" ? "opacity-50" : ""}>
                      <td className="py-2 pr-3 font-display text-lg">{r.quantity}</td>
                      <td className="py-2 pr-3">
                        {r.status === "PAID" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {r.seats.length > 0 && (
                              <span className="font-display text-lg text-accent">{r.seats.map((s) => s.number).join(", ")}</span>
                            )}
                            {r.seats.length === 0 && <span className="text-xs text-muted">sin elegir</span>}
                            <AssignSeatsForm reservationId={r.id} current={r.seats.map((s) => s.number)} quantity={r.quantity} />
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-medium">{r.name}</td>
                      <td className="py-2 pr-3 text-muted">
                        {r.email}
                        {r.phone && <><br />{r.phone}</>}
                      </td>
                      <td className="py-2 pr-3">
                        {r.status === "PAID" && <span className="text-ok">Pagado · {r.paidVia}</span>}
                        {r.status === "PENDING" && !expired && (
                          <span className="text-accent">Pendiente hasta {formatShort(r.expiresAt).slice(-5)}</span>
                        )}
                        {expired && <span className="text-muted">Vencida</span>}
                        {r.status === "CANCELLED" && <span className="text-muted">Cancelada</span>}
                      </td>
                      <td className="py-2 pr-3">{formatPrice(r.amount)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {r.status === "PENDING" && !expired && (
                          <form action={markPaidAction} className="inline">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="via" value="efectivo" />
                            <button className="btn btn-ghost btn-sm mr-2" type="submit">
                              Marcar pagado
                            </button>
                          </form>
                        )}
                        {(r.status === "PAID" || (r.status === "PENDING" && !expired)) && (
                          <form action={cancelReservationAction} className="inline">
                            <input type="hidden" name="id" value={r.id} />
                            <button className="btn btn-danger btn-sm" type="submit">
                              Cancelar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm text-muted mb-3">Cargar a mano (efectivo, transferencia, invitado). Las sillas se pueden dejar vacías y asignar después.</p>
          <ManualReservationForm eventId={event.id} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl">Editar cena</h2>
        <div className="mt-4">
          <EventForm
            action={updateEventAction}
            submitLabel="Guardar cambios"
            initial={{
              id: event.id,
              title: event.title,
              date: toDatetimeLocal(event.date),
              price: event.price,
              capacity: event.capacity,
              description: event.description ?? "",
              menu: event.menu ?? "",
              address: event.address ?? "",
              published: event.published,
            }}
          />
        </div>
        <form action={deleteEventAction} className="mt-6 border-t border-line pt-5">
          <input type="hidden" name="id" value={event.id} />
          <button className="btn btn-danger btn-sm" type="submit">
            {paidSeats > 0 ? "Despublicar cena" : "Borrar cena"}
          </button>
          <span className="ml-3 text-xs text-muted">
            {paidSeats > 0 ? "Tiene pagos: se oculta, no se borra." : "Sin pagos: se borra definitivamente."}
          </span>
        </form>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}
