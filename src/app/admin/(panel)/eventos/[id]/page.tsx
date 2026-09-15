import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/config";
import { formatShort, nowMs, toDatetimeLocal, todayIso } from "@/lib/dates";
import { categoryLabel, getFinancials, toRow } from "@/lib/admin-stats";
import { getSession } from "@/lib/admin-auth";
import { EventForm } from "@/components/admin/EventForm";
import { AssignSeatsForm, ManualReservationForm, NotifyForm, RequestReviewsForm } from "@/components/admin/ActionForms";
import { LedgerForm } from "@/components/admin/LedgerForm";
import { MovementList } from "@/components/admin/MovementList";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import {
  approveReviewAction,
  cancelReservationAction,
  deleteEventAction,
  deleteReservationAction,
  deleteReviewAction,
  duplicateEventAction,
  markPaidAction,
  updateEventAction,
} from "../../../actions";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const copiada = (await searchParams).copiada === "1";
  const [event, subscribers, money, session] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        reservations: {
          orderBy: { createdAt: "desc" },
          include: { seats: { orderBy: { number: "asc" } } },
        },
        ledger: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { event: { select: { title: true } } } },
        reviews: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.subscriber.count(),
    getFinancials(id),
    getSession(),
  ]);
  if (!event) notFound();
  const sessionName = session?.role === "user" ? session.name : undefined;
  const today = todayIso();

  const now = nowMs();
  const active = event.reservations.filter(
    (r) => r.status === "PAID" || (r.status === "PENDING" && r.expiresAt.getTime() > now),
  );
  const paidSeats = active.filter((r) => r.status === "PAID").reduce((n, r) => n + r.quantity, 0);
  const paidPeople = event.reservations.filter((r) => r.status === "PAID").length;
  const past = event.date.getTime() < now;
  const holdSeats = active.filter((r) => r.status === "PENDING").reduce((n, r) => n + r.quantity, 0);

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted">
        <Link href="/admin" className="hover:text-ink">
          ← Cenas
        </Link>
        <span>/</span>
        <span className="text-ink">{event.title}</span>
      </div>

      {copiada && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          Copiada para la semana que viene. Revisá la carta y la fecha, y marcá <strong>Publicada</strong> para que aparezca en el sitio.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Pagos" value={`${paidSeats}/${event.capacity}`} />
        <Stat label="En proceso" value={String(holdSeats)} />
        <Stat label="Libres" value={String(event.capacity - paidSeats - holdSeats)} />
        <Stat label="Cobrado en reservas" value={formatPrice(money.reservations)} />
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
                  const inactive = expired || r.status === "CANCELLED";
                  return (
                    <tr key={r.id} className={inactive ? "opacity-50" : ""}>
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
                        {r.email !== "sin-email@local" && (
                          <a className="hover:text-ink" href={`mailto:${r.email}`}>
                            {r.email}
                          </a>
                        )}
                        {r.phone && (
                          <>
                            <br />
                            <a
                              className="hover:text-ink"
                              href={`https://wa.me/549${r.phone.replace(/\D/g, "").replace(/^549?/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {r.phone}
                            </a>
                          </>
                        )}
                        {r.notes && <p className="mt-1 max-w-[16rem] text-xs text-accent">“{r.notes}”</p>}
                      </td>
                      <td className="py-2 pr-3">
                        {r.status === "PAID" && (
                          <span className="text-ok">
                            Pagado · {r.paidVia}
                            {r.paidAt && <span className="block text-xs text-muted">{formatShort(r.paidAt)}</span>}
                          </span>
                        )}
                        {r.status === "PENDING" && !expired && (
                          <span className="text-accent">Pendiente hasta {formatShort(r.expiresAt).slice(-5)}</span>
                        )}
                        {expired && <span className="text-muted">Vencida</span>}
                        {r.status === "CANCELLED" && <span className="text-muted">Cancelada</span>}
                      </td>
                      <td className="py-2 pr-3">{formatPrice(r.amount)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          {r.status === "PENDING" && !expired && (
                            <form action={markPaidAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="via" value="efectivo" />
                              <button className="btn btn-ghost btn-sm" type="submit">
                                Marcar pagado
                              </button>
                            </form>
                          )}
                          {(r.status === "PAID" || (r.status === "PENDING" && !expired)) && (
                            <form action={cancelReservationAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <ConfirmButton
                                className="btn btn-ghost btn-sm"
                                message={`¿Cancelar la reserva de ${r.name}? Se liberan sus lugares. La fila queda como cancelada.`}
                              >
                                Cancelar
                              </ConfirmButton>
                            </form>
                          )}
                          <form action={deleteReservationAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <ConfirmButton message={`¿Borrar definitivamente la reserva de ${r.name}? No se puede deshacer.`}>
                              Borrar
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm text-muted mb-3">
            Cargar a mano (efectivo, transferencia, invitado). Las sillas se pueden dejar vacías y asignar después.
          </p>
          <ManualReservationForm eventId={event.id} />
        </div>
      </section>

      {past && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Opiniones</h2>
            <RequestReviewsForm eventId={event.id} people={paidPeople} />
          </div>
          {event.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Todavía nadie opinó. Las que se aprueban salen en el home.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {event.reviews.map((rv) => (
                <li key={rv.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="text-accent">{"★".repeat(rv.rating)}</span>
                      <span className="text-line">{"★".repeat(5 - rv.rating)}</span>
                      <span className="ml-2 font-medium">{rv.name}</span>
                      <span className={`ml-2 text-xs ${rv.approved ? "text-ok" : "text-muted"}`}>{rv.approved ? "publicada" : "pendiente"}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">{rv.text}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveReviewAction}>
                      <input type="hidden" name="id" value={rv.id} />
                      <input type="hidden" name="approved" value={rv.approved ? "0" : "1"} />
                      <button className="btn btn-ghost btn-sm" type="submit">
                        {rv.approved ? "Ocultar" : "Publicar"}
                      </button>
                    </form>
                    <form action={deleteReviewAction}>
                      <input type="hidden" name="id" value={rv.id} />
                      <ConfirmButton message={`¿Borrar la opinión de ${rv.name}?`}>Borrar</ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section id="caja" className="card scroll-mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">Caja</h2>
          <p className="text-xs text-muted">Ventas de barra, costos de insumos y lo que haga falta.</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Stat label="Reservas cobradas" value={formatPrice(money.reservations)} />
          <Stat label="Barra y otros" value={formatPrice(money.otherIncome)} />
          <Stat label="Gastos" value={formatPrice(money.expenses)} tone="danger" />
          <Stat label="Resultado" value={formatPrice(money.result)} tone={money.result >= 0 ? "ok" : "danger"} />
        </div>

        {money.byCategory.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {money.byCategory.map((c) => (
              <li key={`${c.kind}-${c.category}`} className="rounded-full border border-line px-3 py-1 text-muted">
                {categoryLabel(c.kind, c.category)}: <span className={c.kind === "INCOME" ? "text-ok" : "text-danger"}>{formatPrice(c.amount)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 text-sm text-muted">
            Cargar algo de esta cena (la barra al cierre, un insumo puntual). Los gastos del día a día van en{" "}
            <Link href="/admin/gastos" className="text-accent hover:text-accent-strong">
              Gastos
            </Link>
            .
          </p>
          <LedgerForm eventId={event.id} today={today} defaultKind="INCOME" compact sessionName={sessionName} />
        </div>

        {event.ledger.length > 0 && (
          <div className="mt-5">
            <MovementList rows={event.ledger.map(toRow)} today={today} sessionName={sessionName} />
          </div>
        )}
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
              bar: event.bar ?? "",
              barPrice: event.barPrice ?? "",
              address: event.address ?? "",
              published: event.published,
            }}
          />
        </div>
        <form action={duplicateEventAction} className="mt-6 border-t border-line pt-5">
          <input type="hidden" name="id" value={event.id} />
          <button className="btn btn-ghost btn-sm" type="submit">
            Repetir la semana que viene
          </button>
          <span className="ml-3 text-xs text-muted">Crea una copia con la misma carta, siete días después, sin publicar.</span>
        </form>
        <form action={deleteEventAction} className="mt-4">
          <input type="hidden" name="id" value={event.id} />
          <ConfirmButton
            message={
              paidSeats > 0
                ? "Esta cena tiene pagos: se va a ocultar del home, no se borra. ¿Seguir?"
                : "¿Borrar esta cena definitivamente? Se borran también sus reservas y su caja."
            }
          >
            {paidSeats > 0 ? "Despublicar cena" : "Borrar cena"}
          </ConfirmButton>
          <span className="ml-3 text-xs text-muted">
            {paidSeats > 0 ? "Tiene pagos: se oculta, no se borra." : "Sin pagos: se borra definitivamente."}
          </span>
        </form>
      </section>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  const color = tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : "";
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display text-2xl ${color}`}>{value}</p>
    </div>
  );
}
