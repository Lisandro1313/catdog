import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime } from "@/lib/dates";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

/**
 * El plano de la mesa en papel, silla por silla: nombre, alergias/avisos, regalo, confirmación.
 * Para tener en la cocina y en la puerta sin depender del celu.
 */
export default async function PlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { reservations: { where: { status: "PAID" }, include: { seats: true } } },
  });
  if (!event) notFound();

  const bySeat = new Map<number, (typeof event.reservations)[number]>();
  for (const r of event.reservations) for (const s of r.seats) bySeat.set(s.number, r);
  const unseated = event.reservations.filter((r) => r.seats.length === 0);
  const notes = event.reservations.filter((r) => r.notes || r.giftName);
  const people = event.reservations.reduce((n, r) => n + r.quantity, 0);
  const half = Math.ceil(event.capacity / 2);
  const seatCell = (n: number) => {
    const r = bySeat.get(n);
    return (
      <div key={n} className={`plano-seat ${r ? "is-taken" : ""}`}>
        <span className="plano-n">{n}</span>
        {r ? (
          <>
            <span className="plano-name">{r.name}</span>
            {r.quantity > 1 && <span className="plano-sub">grupo de {r.quantity}</span>}
            {r.giftName && <span className="plano-sub">🎁 {r.giftName}</span>}
            {r.notes && <span className="plano-note">⚠ {r.notes}</span>}
            {r.confirmedAt && <span className="plano-sub">✓ confirmó</span>}
          </>
        ) : (
          <span className="plano-sub">libre</span>
        )}
      </div>
    );
  };

  return (
    <>
      <section className="card p-5 print:hidden sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Plano de la mesa</h1>
            <p className="mt-1 text-sm text-muted">Silla por silla, con avisos y regalos. Una hoja A4 para la cocina y otra para la puerta.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/eventos/${event.id}/noche`} className="btn btn-ghost btn-sm">
              ← La puerta
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>

      <article className="plano">
        <header className="plano-head">
          <div>
            <p className="plano-eyebrow">{event.title}</p>
            <h2>
              {formatLong(event.date)} · {formatTime(event.date)} hs
            </h2>
          </div>
          <p className="plano-count">
            {people} {people === 1 ? "persona" : "personas"}
          </p>
        </header>

        <div className="plano-table">
          <div className="plano-side">{Array.from({ length: half }, (_, i) => seatCell(i + 1))}</div>
          <div className="plano-board">la mesa</div>
          <div className="plano-side">{Array.from({ length: event.capacity - half }, (_, i) => seatCell(half + i + 1))}</div>
        </div>

        {unseated.length > 0 && (
          <section className="plano-block">
            <h3>Sin silla elegida</h3>
            <ul>
              {unseated.map((r) => (
                <li key={r.id}>
                  <strong>{r.name}</strong> · {r.quantity === 1 ? "1 lugar" : `${r.quantity} lugares`}
                  {r.notes && <> · ⚠ {r.notes}</>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {notes.length > 0 && (
          <section className="plano-block">
            <h3>Para la cocina</h3>
            <ul>
              {notes.map((r) => (
                <li key={r.id}>
                  <strong>{r.name}</strong>
                  {r.seats.length > 0 && <> (silla {r.seats.map((s) => s.number).join(", ")})</>}
                  {r.notes && <>: {r.notes}</>}
                  {r.giftName && <> · regalo para {r.giftName}</>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
